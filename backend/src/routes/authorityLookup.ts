import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql, and, or, ilike, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { roadAuthorities } from '../db/schema.js';

/**
 * Public API for authority lookup ("Who's Responsible?" feature)
 *
 * Determines which road authority is responsible for a given location.
 */

const router = new Hono();

const CACHE = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

/**
 * GET /api/public/authority-lookup?lat=12.9716&lon=77.5946&city=Bengaluru&state=Karnataka&area=Indiranagar
 *
 * Lookup authority based on coordinates and/or location metadata.
 * Priority: area > city > state > national
 */
router.get(
  '/authority-lookup',
  zValidator(
    'query',
    z.object({
      lat: z.string().optional(),
      lon: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      area: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { lat, lon, city, state, area } = c.req.valid('query');

      // Validate that we have at least some location data
      if (!state && !city && !area) {
        return c.json(
          { ok: false, error: 'At least one of state, city, or area is required' },
          400
        );
      }

      // Build query conditions based on available data
      const conditions: any[] = [];

      // Priority 1: Area match (most specific)
      if (area && city && state) {
        const areaResults = await db
          .select()
          .from(roadAuthorities)
          .where(
            and(
              sql`${roadAuthorities.areas} @> ARRAY[${area}]::text[]`,
              ilike(roadAuthorities.city, city),
              ilike(roadAuthorities.state, state)
            )
          )
          .limit(5);

        if (areaResults.length > 0) {
          return c.json({ ok: true, authorities: areaResults, matchType: 'area' }, 200, CACHE);
        }
      }

      // Priority 2: City match
      if (city && state) {
        const cityResults = await db
          .select()
          .from(roadAuthorities)
          .where(
            and(
              ilike(roadAuthorities.city, city),
              ilike(roadAuthorities.state, state)
            )
          )
          .limit(5);

        if (cityResults.length > 0) {
          return c.json({ ok: true, authorities: cityResults, matchType: 'city' }, 200, CACHE);
        }
      }

      // Priority 3: State match (PWD or state-level authority)
      if (state) {
        const stateResults = await db
          .select()
          .from(roadAuthorities)
          .where(
            and(
              ilike(roadAuthorities.state, state),
              or(
                sql`${roadAuthorities.city} IS NULL`,
                sql`${roadAuthorities.type} = 'STATE_PWD'`
              )
            )
          )
          .limit(5);

        if (stateResults.length > 0) {
          return c.json({ ok: true, authorities: stateResults, matchType: 'state' }, 200, CACHE);
        }
      }

      // Priority 4: National highways authority (fallback)
      const nationalResults = await db
        .select()
        .from(roadAuthorities)
        .where(sql`${roadAuthorities.type} = 'NATIONAL'`)
        .limit(5);

      if (nationalResults.length > 0) {
        return c.json(
          { ok: true, authorities: nationalResults, matchType: 'national', note: 'Could not find specific local authority, showing national authority as fallback' },
          200,
          CACHE
        );
      }

      // No match found
      return c.json(
        { ok: false, error: 'No authority found for this location. Please try again with more specific location details.' },
        404
      );
    } catch (err) {
      console.error('[public/authority-lookup]', err);
      return c.json({ ok: false, error: 'Failed to lookup authority' }, 500);
    }
  }
);

/**
 * GET /api/public/authorities
 *
 * List all authorities (for debugging/admin purposes)
 */
router.get('/authorities', async (c) => {
  try {
    const results = await db
      .select()
      .from(roadAuthorities)
      .orderBy(roadAuthorities.state, roadAuthorities.city);

    return c.json({ ok: true, authorities: results }, 200, CACHE);
  } catch (err) {
    console.error('[public/authorities]', err);
    return c.json({ ok: false, error: 'Failed to load authorities' }, 500);
  }
});

export { router as authorityLookupRouter };
