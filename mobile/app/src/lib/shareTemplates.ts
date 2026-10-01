import type { RoadAuthority } from './authorityLookup';

export interface ShareTemplateOptions {
  authority: RoadAuthority;
  location: string; // e.g., "Indiranagar, Bengaluru, Karnataka"
  photoUri?: string;
}

/**
 * Generate share message for X (Twitter)
 */
export function generateTwitterMessage(options: ShareTemplateOptions): string {
  const { authority, location } = options;
  const handle = authority.twitterHandle || `@${authority.name.replace(/\s+/g, '')}`;

  return `${handle} Bad road condition at ${location}. Please fix! 🚧\n\n#BetterRoads #RoadSafety`;
}

/**
 * Generate share message for Instagram (caption for post/story)
 */
export function generateInstagramMessage(options: ShareTemplateOptions): string {
  const { authority, location } = options;
  const handle = authority.instagramHandle || `@${authority.name.replace(/\s+/g, '').toLowerCase()}`;

  return `Bad road at ${location} 🚧\n\n${handle} please take action!\n\n#BetterRoads #RoadSafety #FixOurRoads`;
}

/**
 * Generate share message for WhatsApp
 */
export function generateWhatsAppMessage(options: ShareTemplateOptions): string {
  const { authority, location } = options;

  let message = `🚧 *Bad Road Condition Report*\n\n`;
  message += `📍 Location: ${location}\n\n`;
  message += `👤 Responsible Authority: *${authority.name}*\n`;

  if (authority.contactPhone) {
    message += `📞 Contact: ${authority.contactPhone}\n`;
  }

  if (authority.twitterHandle) {
    message += `🐦 Twitter: ${authority.twitterHandle}\n`;
  }

  message += `\n_Please fix this road urgently!_\n\n`;
  message += `Reported via BetterRoads app 🛣️`;

  return message;
}

/**
 * Generate share message for Facebook
 */
export function generateFacebookMessage(options: ShareTemplateOptions): string {
  const { authority, location } = options;

  let message = `Bad road condition at ${location}! 🚧\n\n`;
  message += `${authority.name} - please take immediate action to fix this road.\n\n`;

  if (authority.contactPhone) {
    message += `Contact: ${authority.contactPhone}\n`;
  }

  message += `\n#BetterRoads #RoadSafety #FixOurRoads`;

  return message;
}

/**
 * Generate share message for email
 */
export function generateEmailContent(options: ShareTemplateOptions): { subject: string; body: string } {
  const { authority, location } = options;

  const subject = `Bad Road Condition Report - ${location}`;

  let body = `Dear ${authority.contactName || authority.name},\n\n`;
  body += `I am writing to report a bad road condition that requires immediate attention.\n\n`;
  body += `Location: ${location}\n`;
  body += `Date: ${new Date().toLocaleDateString()}\n\n`;
  body += `Please find attached a photograph of the current road condition. This issue poses a safety risk to commuters and requires urgent repair.\n\n`;
  body += `I request you to kindly take necessary action at the earliest.\n\n`;
  body += `Thank you,\n`;
  body += `A concerned citizen\n\n`;
  body += `---\n`;
  body += `Reported via BetterRoads app (betterroads.org)`;

  return { subject, body };
}

/**
 * Generate generic share message (fallback)
 */
export function generateGenericMessage(options: ShareTemplateOptions): string {
  const { authority, location } = options;

  return `Bad road at ${location}. ${authority.name} please fix! Reported via BetterRoads app.`;
}

/**
 * Get all available share options with their messages
 */
export function getAllShareMessages(options: ShareTemplateOptions) {
  return {
    twitter: generateTwitterMessage(options),
    instagram: generateInstagramMessage(options),
    whatsapp: generateWhatsAppMessage(options),
    facebook: generateFacebookMessage(options),
    email: generateEmailContent(options),
    generic: generateGenericMessage(options),
  };
}
