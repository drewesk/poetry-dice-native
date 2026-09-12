import type { PoetryExcerpt } from './poetry-api';

let offlinePoemsCache: any = null;

async function loadOfflinePoems() {
  if (!offlinePoemsCache) {
    try {
      offlinePoemsCache = require('../assets/offline-poetry.json');
    } catch (error) {
      console.error('[OfflineAPI] Failed to load offline poems:', error);
      offlinePoemsCache = { poems: [] };
    }
  }
  return offlinePoemsCache;
}

export async function fetchOfflinePoem(): Promise<PoetryExcerpt | null> {
  try {
    const cache = await loadOfflinePoems();
    const poems = cache.poems || [];
    
    if (poems.length === 0) {
      console.warn('[OfflineAPI] No offline poems available');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * poems.length);
    return poems[randomIndex];
  } catch (error) {
    console.error('[OfflineAPI] Error fetching offline poem:', error);
    return null;
  }
}

export async function preloadOfflinePoems(): Promise<void> {
  try {
    await loadOfflinePoems();
    console.log('[OfflineAPI] Offline poems preloaded');
  } catch (error) {
    console.error('[OfflineAPI] Failed to preload offline poems:', error);
  }
}

export function getOfflinePoemsCount(): number {
  try {
    return offlinePoemsCache?.poems?.length || 0;
  } catch {
    return 0;
  }
}
