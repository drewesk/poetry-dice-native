import { Platform } from 'react-native'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const UPDATE_CHECK_KEY = '@poetry_dice_update_check'
const SKIP_VERSION_KEY = '@poetry_dice_skip_version'
const REMIND_LATER_KEY = '@poetry_dice_remind_later'

export interface UpdateInfo {
  isUpdateAvailable: boolean
  currentVersion: string
  latestVersion: string
  releaseNotes?: string
  updateUrl?: string
}

/**
 * Compares two semantic version strings (e.g., "1.2.0" vs "1.3.0")
 */
function compareVersions(current: string, latest: string): number {
  const currentParts = current.split('.').map(Number)
  const latestParts = latest.split('.').map(Number)
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0
    const latestPart = latestParts[i] || 0
    
    if (latestPart > currentPart) return 1  // Update available
    if (latestPart < currentPart) return -1 // Current is newer
  }
  
  return 0 // Same version
}

/**
 * Fetches the latest version from the App Store
 */
async function fetchAppStoreVersion(bundleId: string): Promise<{ version: string; releaseNotes: string; trackViewUrl: string } | null> {
  try {
    // Add timestamp to bust Apple's CDN cache and get fresh version data
    const cacheBuster = Date.now()
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${bundleId}&t=${cacheBuster}`,
      { timeout: 10000 } as any
    )
    
    if (!response.ok) {
      console.log('[UpdateChecker] App Store API request failed')
      return null
    }
    
    const data = await response.json()
    
    if (data.resultCount === 0) {
      console.log('[UpdateChecker] App not found in App Store')
      return null
    }
    
    const appInfo = data.results[0]
    // Convert https URL to itms-apps URL scheme for iOS
    const appStoreUrl = appInfo.trackViewUrl.replace('https://', 'itms-apps://')
    return {
      version: appInfo.version,
      releaseNotes: appInfo.releaseNotes || '',
      trackViewUrl: appStoreUrl
    }
  } catch (error) {
    console.log('[UpdateChecker] Error fetching App Store version:', error)
    return null
  }
}

/**
 * Checks if an update is available for the app
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  // Only check on iOS for now (Android requires different approach)
  if (Platform.OS !== 'ios') {
    return null
  }
  
  try {
    // Get current version from app config
    const currentVersion = Constants.expoConfig?.version || '1.0.0'
    
    // Get bundle ID from app config
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier
    
    if (!bundleId) {
      console.log('[UpdateChecker] Bundle ID not found')
      return null
    }
    
    // Check if user has skipped this version
    const skippedVersion = await AsyncStorage.getItem(SKIP_VERSION_KEY)
    
    // Fetch latest version from App Store
    const appStoreInfo = await fetchAppStoreVersion(bundleId)
    
    if (!appStoreInfo) {
      return null
    }
    
    const latestVersion = appStoreInfo.version
    
    // Compare versions
    const comparison = compareVersions(currentVersion, latestVersion)
    const isUpdateAvailable = comparison > 0
    
    // Don't show if user skipped this version
    if (isUpdateAvailable && skippedVersion === latestVersion) {
      console.log('[UpdateChecker] User skipped version:', latestVersion)
      return null
    }
    
    // Store last check time
    await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString())
    
    return {
      isUpdateAvailable,
      currentVersion,
      latestVersion,
      releaseNotes: appStoreInfo.releaseNotes,
      updateUrl: appStoreInfo.trackViewUrl
    }
  } catch (error) {
    console.log('[UpdateChecker] Error checking for update:', error)
    return null
  }
}

/**
 * Checks if we should check for updates (throttle to once every 6 hours, or sooner if "remind later" was tapped)
 */
export async function shouldCheckForUpdate(): Promise<boolean> {
  try {
    // Check if user tapped "Remind Later" and it's time to remind them
    const remindLaterTime = await AsyncStorage.getItem(REMIND_LATER_KEY)
    if (remindLaterTime) {
      const remindTime = parseInt(remindLaterTime, 10)
      const now = Date.now()
      if (now >= remindTime) {
        // Clear the remind later flag
        await AsyncStorage.removeItem(REMIND_LATER_KEY)
        return true
      }
    }
    
    // Normal 6-hour throttle check
    const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY)
    
    if (!lastCheck) {
      return true // Never checked before
    }
    
    const lastCheckTime = parseInt(lastCheck, 10)
    const now = Date.now()
    const sixHoursInMs = 6 * 60 * 60 * 1000
    
    return (now - lastCheckTime) > sixHoursInMs
  } catch {
    return true
  }
}

/**
 * Marks a version as skipped by the user
 */
export async function skipVersion(version: string): Promise<void> {
  await AsyncStorage.setItem(SKIP_VERSION_KEY, version)
}

/**
 * Clears the skipped version (e.g., when user manually checks for update)
 */
export async function clearSkippedVersion(): Promise<void> {
  await AsyncStorage.removeItem(SKIP_VERSION_KEY)
}

/**
 * Sets a "remind me later" timestamp (2 hours from now)
 */
export async function remindLater(): Promise<void> {
  const twoHoursInMs = 2 * 60 * 60 * 1000
  const remindTime = Date.now() + twoHoursInMs
  await AsyncStorage.setItem(REMIND_LATER_KEY, remindTime.toString())
}
