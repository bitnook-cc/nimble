import { apiUrl } from "@/lib/utils/api";

import { authService } from "../auth-service";
import { characterImageService } from "../character-image-service";

export interface ImageSyncResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Service for syncing character images between client and server
 *
 * Strategy:
 * - Upload: Convert IndexedDB blob to base64 and send to server
 * - Download: Fetch image from URL and store in IndexedDB
 * - Only sync the current profile image (not thumbnails or history)
 */
class ImageSyncService {
  private static instance: ImageSyncService;

  private constructor() {}

  static getInstance(): ImageSyncService {
    if (!ImageSyncService.instance) {
      ImageSyncService.instance = new ImageSyncService();
    }
    return ImageSyncService.instance;
  }

  /**
   * Upload character image to server
   * Converts the current profile image to base64 and uploads to Vercel Blob Storage
   */
  async uploadCharacterImage(characterId: string, imageId: string): Promise<ImageSyncResult> {
    try {
      // Check if user is authenticated
      const authResponse = await authService.fetchUser();
      if (!authResponse.user) {
        return { success: false, error: "Not authenticated" };
      }

      // Get the profile image from IndexedDB
      const profileBlob = await characterImageService.getProfileImage(characterId, imageId);
      if (!profileBlob) {
        return { success: false, error: "Image not found in local storage" };
      }

      // Convert blob to base64
      const base64 = await this.blobToBase64(profileBlob);

      // Upload to server
      const response = await fetch(`${apiUrl}/images/characters/${characterId}/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          imageData: base64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Check if blob storage is not configured
        if (response.status === 503) {
          console.warn(
            "[ImageSync] Blob storage not configured on server - images will only be stored locally",
          );
          return {
            success: false,
            error: "Image sync not available - images will only be stored locally",
          };
        }

        throw new Error(error.error || "Failed to upload image");
      }

      const result = await response.json();
      console.log("[ImageSync] Upload successful:", result.url);

      return {
        success: true,
        url: result.url,
      };
    } catch (error) {
      console.error("[ImageSync] Upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Download character image from server
   * Fetches the image from the URL and stores it in IndexedDB
   */
  async downloadCharacterImage(
    characterId: string,
    imageUrl: string,
    imageId?: string,
  ): Promise<ImageSyncResult> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();

      // Generate thumbnail from the downloaded image
      const thumbnail = await this.generateThumbnail(blob);

      // Save to IndexedDB (will emit event automatically)
      await characterImageService.saveImage(characterId, blob, thumbnail, imageId);

      console.log("[ImageSync] Download successful, saved with ID:", imageId);

      return {
        success: true,
        url: imageUrl,
      };
    } catch (error) {
      console.error("[ImageSync] Download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Get image URL from server for a character
   */
  async getCharacterImageUrl(characterId: string): Promise<string | null> {
    try {
      const response = await fetch(`${apiUrl}/images/characters/${characterId}/avatar`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 404) {
        return null; // No image on server
      }

      if (response.status === 503) {
        console.warn("[ImageSync] Blob storage not configured on server");
        return null; // Blob storage not available
      }

      if (!response.ok) {
        throw new Error("Failed to get image URL");
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error("[ImageSync] Failed to get image URL:", error);
      return null;
    }
  }

  /**
   * Sync character image with server
   * - If local image exists but not on server: upload
   * - If server image exists but not local: download
   * - If both exist: compare metadata and sync if needed
   */
  async syncCharacterImage(characterId: string, currentImageId?: string): Promise<ImageSyncResult> {
    try {
      // Check if user is authenticated
      const authResponse = await authService.fetchUser();
      if (!authResponse.user) {
        return { success: true }; // No sync needed when not authenticated
      }

      // Get server image info
      const serverImageUrl = await this.getCharacterImageUrl(characterId);

      // Get local image info
      const hasLocalImage = currentImageId
        ? await characterImageService.imageExists(characterId, currentImageId)
        : false;

      // Sync logic
      if (hasLocalImage && !serverImageUrl) {
        // Upload local to server
        console.log("[ImageSync] Uploading local image to server");
        return await this.uploadCharacterImage(characterId, currentImageId!);
      } else if (!hasLocalImage && serverImageUrl) {
        // Download from server
        console.log("[ImageSync] Downloading image from server");
        return await this.downloadCharacterImage(characterId, serverImageUrl, currentImageId);
      } else if (hasLocalImage && serverImageUrl) {
        // Both exist - for now, local takes precedence
        // In the future, could compare timestamps or hashes
        console.log("[ImageSync] Both local and server images exist, keeping local");
        return { success: true, url: serverImageUrl };
      }

      // No image on either side
      return { success: true };
    } catch (error) {
      console.error("[ImageSync] Sync failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }

  /**
   * Delete character image from server
   */
  async deleteCharacterImage(characterId: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/images/characters/${characterId}/avatar`, {
        method: "DELETE",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("[ImageSync] Delete failed:", error);
      return false;
    }
  }

  // Helper methods

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async generateThumbnail(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      img.onload = () => {
        // Set thumbnail size (50x50)
        canvas.width = 50;
        canvas.height = 50;

        // Draw and scale image
        ctx.drawImage(img, 0, 0, 50, 50);

        // Convert to blob
        canvas.toBlob(
          (thumbnailBlob) => {
            if (thumbnailBlob) {
              resolve(thumbnailBlob);
            } else {
              reject(new Error("Failed to create thumbnail"));
            }
          },
          "image/webp",
          0.85,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(blob);
    });
  }
}

export const imageSyncService = ImageSyncService.getInstance();
