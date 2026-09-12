import React, { useMemo } from 'react'
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import * as Haptics from 'expo-haptics'
import { type UpdateInfo } from '../utils/updateChecker'
import { borderRadius, fontSize, spacing, useFontSizeMode } from '../utils/responsive'

interface UpdateModalProps {
  visible: boolean
  updateInfo: UpdateInfo | null
  onUpdateNow: () => void
  onLater: () => void
  onSkip: () => void
}

export default function UpdateModal({ visible, updateInfo, onUpdateNow, onLater, onSkip }: UpdateModalProps) {
  const { fontScaleMultiplier } = useFontSizeMode()
  const styles = useMemo(() => createStyles(fontScaleMultiplier), [fontScaleMultiplier])

  if (!updateInfo || !updateInfo.isUpdateAvailable) {
    return null
  }

  const handleUpdateNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    onUpdateNow()
  }

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onLater()
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onSkip()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.versionText}>
            Version {updateInfo.latestVersion} is now available
          </Text>
          <Text style={styles.currentVersion}>
            You&apos;re on version {updateInfo.currentVersion}
          </Text>

          {updateInfo.releaseNotes && (
            <ScrollView style={styles.notesContainer} bounces={false}>
              <Text style={styles.notesTitle}>What&apos;s New:</Text>
              <Text style={styles.notes}>{updateInfo.releaseNotes}</Text>
            </ScrollView>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 }
              ]}
              onPress={handleUpdateNow}
            >
              <Text style={styles.primaryButtonText}>Update Now</Text>
            </Pressable>

            <View style={styles.secondaryButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { transform: [{ scale: 0.95 }], opacity: 0.7 }
                ]}
                onPress={handleLater}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { transform: [{ scale: 0.95 }], opacity: 0.7 }
                ]}
                onPress={handleSkip}
              >
                <Text style={styles.secondaryButtonText}>Skip This Version</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (_fontScaleMultiplier: number) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(20),
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: borderRadius(20),
    padding: spacing(24),
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: fontSize(48),
    fontFamily: 'Arsenal-Regular',
    marginBottom: spacing(12),
  },
  title: {
    fontSize: fontSize(24),
    fontWeight: '800',
    color: '#6a73e6',
    marginBottom: spacing(8),
    textAlign: 'center',
    fontFamily: 'Arsenal-Bold',
  },
  versionText: {
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Regular',
    color: '#333',
    marginBottom: spacing(4),
    textAlign: 'center',
  },
  currentVersion: {
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Regular',
    color: '#666',
    marginBottom: spacing(16),
    textAlign: 'center',
  },
  notesContainer: {
    maxHeight: spacing(200),
    width: '100%',
    marginBottom: spacing(20),
    backgroundColor: '#f5f5f5',
    borderRadius: borderRadius(12),
    padding: spacing(12),
  },
  notesTitle: {
    fontSize: fontSize(14),
    fontWeight: '700',
    color: '#6a73e6',
    marginBottom: spacing(8),
    fontFamily: 'Arsenal-Bold',
  },
  notes: {
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Regular',
    color: '#333',
    lineHeight: fontSize(20),
  },
  buttonContainer: {
    width: '100%',
    gap: spacing(12),
  },
  primaryButton: {
    backgroundColor: '#6a73e6',
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(24),
    borderRadius: borderRadius(12),
    alignItems: 'center',
    shadowColor: '#6a73e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '700',
    fontFamily: 'Arsenal-Bold',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: spacing(12),
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(20),
    borderRadius: borderRadius(12),
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Regular',
    fontWeight: '600',
  },
})
