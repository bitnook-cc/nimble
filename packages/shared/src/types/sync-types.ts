/**
 * Sync operation error codes
 */
export enum SyncErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  MAX_CHARACTERS_EXCEEDED = 'MAX_CHARACTERS_EXCEEDED',
  INVALID_CHARACTER_DATA = 'INVALID_CHARACTER_DATA',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Sync status response
 */
export interface SyncStatus {
  characterCount: number;
  lastSyncedAt: number | null; // Unix timestamp in milliseconds
  maxCharacters: number;
}

/**
 * Sync result response
 */
export interface SyncResult {
  characters: any[]; // Will be typed as Character[] in consuming apps
  syncedAt: number; // Unix timestamp in milliseconds
  characterCount: number;
  maxCharacters: number;
}

/**
 * Sync error response
 */
export interface SyncError {
  error: string;
  code: SyncErrorCode;
  details?: any;
}