/**
 * shareIntentHandler.ts
 *
 * Handles Android ACTION_SEND share intents that deliver images (payment
 * screenshots, receipts, etc.).  When the OS passes a content URI we copy the
 * file into the app's permanent cache directory so it survives across restarts,
 * then we create a payment-queue entry in the local database.
 *
 * This module is intentionally side-effect-free on import – call
 * handleSharedIntent() from App.tsx when an intent arrives.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import {
  addPaymentQueueItem,
  findQueueItemByImageUri,
} from './database';

/** Destination folder inside the app's documents directory */
const getQueueImagesDir = () => {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) throw new Error('documentDirectory unavailable on this platform');
  return `${docDir}payment_queue_images/`;
};

/** Ensure the storage folder exists. */
async function ensureDir(): Promise<void> {
  const dir = getQueueImagesDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Safely extract file extension from a URI, defaulting to 'jpg' for content://
 * or unrecognised URI structures.
 */
function getSafeExtension(uri: string): string {
  try {
    const pathWithoutQuery = uri.split('?')[0];
    const lastSegment = pathWithoutQuery.split('/').pop() || '';
    if (lastSegment.includes('.')) {
      const candidate = lastSegment.split('.').pop()?.toLowerCase() || '';
      if (/^[a-z0-9]{2,5}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch (_) {}
  return 'jpg';
}

/**
 * Copy a shared image URI into our permanent storage.
 * Returns the local `file://` path.
 */
async function persistImage(sharedUri: string): Promise<string> {
  await ensureDir();
  const dir = getQueueImagesDir();
  const ext = getSafeExtension(sharedUri);
  const filename = `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const destPath = `${dir}${filename}`;

  if (Platform.OS === 'android' && sharedUri.startsWith('content://')) {
    // For content:// URIs we use copyAsync which handles the OS permissions
    await FileSystem.copyAsync({ from: sharedUri, to: destPath });
  } else if (sharedUri.startsWith('file://') || sharedUri.startsWith('/')) {
    await FileSystem.copyAsync({ from: sharedUri, to: destPath });
  } else {
    // Fallback: treat as a remote URL and download
    const result = await FileSystem.downloadAsync(sharedUri, destPath);
    return result.uri;
  }

  return destPath;
}

export interface HandleShareResult {
  /** The queue item id that was created (or already existed). */
  queueItemId: string;
  /** Whether this was a new item vs. a duplicate that was already in the queue. */
  isDuplicate: boolean;
}

/**
 * Main entry point called from App.tsx whenever we detect an incoming share
 * intent carrying an image.
 *
 * @param sharedImageUri  The URI delivered by the intent (content:// or file://)
 * @returns               Info about the created queue item, or null on failure.
 */
export async function handleSharedIntent(
  sharedImageUri: string
): Promise<HandleShareResult | null> {
  try {
    // 1. Dedup: check if we already have an entry for this exact URI
    const existing = findQueueItemByImageUri(sharedImageUri);
    if (existing && existing.status === 'PENDING') {
      return { queueItemId: existing.id, isDuplicate: true };
    }

    // 2. Persist the image to local storage so we own the file
    const localUri = await persistImage(sharedImageUri);

    // 3. Create the queue item
    const queueId = addPaymentQueueItem(localUri);

    return { queueItemId: queueId, isDuplicate: false };
  } catch (err) {
    console.error('[ShareIntentHandler] Failed to handle shared image:', err);
    return null;
  }
}

/**
 * Delete a persisted receipt image from disk.
 * Call this after the queue item is approved or permanently rejected.
 */
export async function cleanupQueueImage(localUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }
  } catch (err) {
    console.warn('[ShareIntentHandler] Failed to clean up image:', err);
  }
}
