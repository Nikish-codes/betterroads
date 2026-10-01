import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { theme, radii } from '@/theme';
import type { RoadAuthority } from '@/lib/authorityLookup';

interface AuthorityInfoModalProps {
  visible: boolean;
  onClose: () => void;
  authorities: RoadAuthority[];
  matchType?: 'area' | 'city' | 'state' | 'national';
  location?: { area: string | null; city: string | null; state: string | null };
  onTakePhoto: () => void;
}

export function AuthorityInfoModal({
  visible,
  onClose,
  authorities,
  matchType,
  location,
  onTakePhoto,
}: AuthorityInfoModalProps) {
  const [loading, setLoading] = useState(false);

  const authority = authorities[0]; // Show first authority
  if (!authority) return null;

  const getMatchTypeLabel = () => {
    switch (matchType) {
      case 'area': return 'Area-specific';
      case 'city': return 'City authority';
      case 'state': return 'State authority';
      case 'national': return 'National highways';
      default: return 'Authority';
    }
  };

  const getAuthorityTypeLabel = () => {
    switch (authority.type) {
      case 'MUNICIPAL': return 'Municipal Corporation';
      case 'STATE_PWD': return 'State Public Works Department';
      case 'NATIONAL': return 'National Highways Authority';
      case 'RURAL': return 'Rural Roads Development';
      case 'OTHER': return 'Road Authority';
      default: return 'Authority';
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="shield-account" size={24} color={theme.saffronDeep} />
              <Text style={styles.headerTitle}>Who's Responsible?</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location Badge */}
            {location && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={16} color={theme.ink2} />
                <Text style={styles.locationText}>
                  {[location.area, location.city, location.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {/* Authority Name */}
            <Text style={styles.authorityName}>{authority.name}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getAuthorityTypeLabel()}</Text>
            </View>

            {/* Match Type */}
            <View style={styles.matchTypeBadge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.saffronDeep} />
              <Text style={styles.matchTypeText}>{getMatchTypeLabel()} match</Text>
            </View>

            {/* Jurisdiction */}
            {authority.city && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jurisdiction:</Text>
                <Text style={styles.infoValue}>
                  {authority.city}, {authority.state}
                </Text>
              </View>
            )}

            {authority.areas && authority.areas.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Areas:</Text>
                <Text style={styles.infoValue}>{authority.areas.slice(0, 5).join(', ')}</Text>
              </View>
            )}

            {/* Contact Information */}
            {authority.contactName && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <Text style={styles.contactName}>{authority.contactName}</Text>
                {authority.contactPhone && (
                  <Pressable
                    style={styles.contactButton}
                    onPress={() => handleOpenLink(`tel:${authority.contactPhone}`)}
                  >
                    <Ionicons name="call" size={16} color={theme.saffronDeep} />
                    <Text style={styles.contactButtonText}>{authority.contactPhone}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Social Media Handles */}
            {(authority.twitterHandle || authority.instagramHandle) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Social Media</Text>
                <View style={styles.socialGrid}>
                  {authority.twitterHandle && (
                    <Pressable
                      style={styles.socialButton}
                      onPress={() =>
                        handleOpenLink(
                          authority.twitterHandle!.startsWith('@')
                            ? `https://twitter.com/${authority.twitterHandle!.substring(1)}`
                            : authority.twitterHandle!
                        )
                      }
                    >
                      <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
                      <Text style={styles.socialHandle}>{authority.twitterHandle}</Text>
                    </Pressable>
                  )}
                  {authority.instagramHandle && (
                    <Pressable
                      style={styles.socialButton}
                      onPress={() =>
                        handleOpenLink(
                          authority.instagramHandle!.startsWith('@')
                            ? `https://instagram.com/${authority.instagramHandle!.substring(1)}`
                            : authority.instagramHandle!
                        )
                      }
                    >
                      <Ionicons name="logo-instagram" size={18} color="#E4405F" />
                      <Text style={styles.socialHandle}>{authority.instagramHandle}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Take Photo CTA */}
            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>Report Bad Road Condition</Text>
              <Text style={styles.ctaDescription}>
                Take a photo of the bad road and share it with {authority.name} on social media.
              </Text>
              <Pressable style={styles.takePhotoButton} onPress={onTakePhoto}>
                <Ionicons name="camera" size={20} color="#ffffff" />
                <Text style={styles.takePhotoButtonText}>Take Photo & Share</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.ink,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.bg2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 13,
    color: theme.ink2,
    fontWeight: '600',
  },
  authorityName: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.ink,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: theme.saffronTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.saffronDeep,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  matchTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.saffronDeep,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.ink2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: theme.ink,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.ink,
    marginBottom: 12,
  },
  contactName: {
    fontSize: 14,
    color: theme.ink2,
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.saffronDeep,
  },
  socialGrid: {
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.bg2,
    padding: 12,
    borderRadius: radii.md,
  },
  socialHandle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.ink,
  },
  ctaSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: theme.saffronTint,
    borderRadius: radii.lg,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.saffronDeep,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: theme.ink2,
    lineHeight: 20,
    marginBottom: 16,
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.saffronDeep,
    paddingVertical: 14,
    borderRadius: radii.full,
  },
  takePhotoButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
