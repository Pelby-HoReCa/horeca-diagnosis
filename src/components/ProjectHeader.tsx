import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AnimatedPressable from './AnimatedPressable';
import { palette, spacing } from '../styles/theme';

export default function ProjectHeader({
  projectAvatarUri,
  projectName,
  city,
  cityIconSvg,
  helpButtonIconSvg,
  onPressProject,
  onPressHelp,
  headerReady = true,
}: {
  projectAvatarUri?: string | null;
  projectName?: string;
  city?: string;
  cityIconSvg?: string;
  helpButtonIconSvg?: string;
  onPressProject?: () => void;
  onPressHelp?: () => void;
  headerReady?: boolean;
}) {
  return (
    <View style={[styles.section, styles.profileSection]}>
      <Pressable
        style={({ pressed }) => [styles.profileInfo, pressed && styles.profileInfoPressed]}
        onPress={onPressProject}
      >
        <View style={styles.avatarContainer}>
          {projectAvatarUri ? (
            <Image source={{ uri: projectAvatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="business" size={32} color={palette.gray400} />
            </View>
          )}
        </View>
        <View style={[styles.projectInfo, !headerReady && styles.headerHidden]}>
          <Text style={styles.projectName}>{projectName || 'Проект'}</Text>
          <View style={styles.cityContainer}>
            <Text style={styles.cityText}>{city || 'город'}</Text>
            <View style={styles.cityIconContainer}>
              {cityIconSvg ? (
                <SvgXml xml={cityIconSvg} width={16} height={16} />
              ) : (
                <View style={{ width: 16, height: 16 }} />
              )}
            </View>
          </View>
        </View>
      </Pressable>

      <AnimatedPressable
        style={[styles.helpButton, !headerReady && styles.headerHidden]}
        onPress={onPressHelp}
      >
        <View style={styles.helpButtonIconContainer}>
          {helpButtonIconSvg ? (
            <SvgXml xml={helpButtonIconSvg} width={18} height={18} />
          ) : (
            <View style={{ width: 18, height: 18 }} />
          )}
        </View>
        <Text style={styles.helpButtonText}>Помощь PELBY</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 0,
    paddingVertical: spacing.md,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    marginRight: spacing.md,
    marginLeft: spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    transform: [{ translateY: -2 }],
  },
  profileInfoPressed: {
    opacity: 0.6,
  },
  avatarContainer: {
    marginRight: 2,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.gray100,
  },
  projectInfo: {
    flex: 1,
    transform: [{ translateY: -2 }],
  },
  projectName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#0A0D14',
    marginBottom: spacing.xxs,
    marginTop: 0,
    marginLeft: -1,
    transform: [{ translateY: 2 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 22,
    minWidth: 60,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
  },
  cityText: {
    fontSize: 14,
    color: palette.gray600,
    marginRight: 2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 18,
    minWidth: 40,
  },
  cityIconContainer: {
    marginLeft: 0,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD680A',
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    height: 32,
    borderRadius: 999,
    marginLeft: -1,
    transform: [{ translateY: -2 }],
  },
  helpButtonIconContainer: {
    marginRight: 2,
    marginLeft: 0,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: palette.white,
    lineHeight: 16,
    transform: [{ translateY: 0 }, { translateX: -1 }],
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    minHeight: 16,
    minWidth: 90,
  },
  headerHidden: {
    opacity: 0,
  },
});
