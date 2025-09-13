'use client';

import { useState, useEffect, useCallback } from 'react';
import { characterImageService } from '@/lib/services/character-image-service';

interface UseCharacterImageReturn {
  imageDataUrl: string | null;
  thumbnailDataUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refreshImage: () => Promise<void>;
}

export function useCharacterImage(characterId: string | null): UseCharacterImageReturn {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const loadImage = useCallback(async () => {
    if (!characterId) {
      setImageDataUrl(null);
      setThumbnailDataUrl(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the latest image for this character
      const images = await characterImageService.getImageHistory(characterId);
      
      if (images && images.length > 0) {
        // Get the most recent image (first in the list)
        const latestImageId = images[0].id;
        const image = await characterImageService.getImage(latestImageId);
        
        if (image) {
          const profileUrl = characterImageService.createObjectURL(image.profileImage);
          const thumbnailUrl = characterImageService.createObjectURL(image.thumbnailImage);
          
          // Clean up old URLs before setting new ones
          setImageDataUrl((oldUrl) => {
            if (oldUrl) characterImageService.revokeObjectURL(oldUrl);
            return profileUrl;
          });
          setThumbnailDataUrl((oldUrl) => {
            if (oldUrl) characterImageService.revokeObjectURL(oldUrl);
            return thumbnailUrl;
          });
        } else {
          setImageDataUrl(null);
          setThumbnailDataUrl(null);
        }
      } else {
        setImageDataUrl(null);
        setThumbnailDataUrl(null);
      }
    } catch (err) {
      console.error('Failed to load character image:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setImageDataUrl(null);
      setThumbnailDataUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [characterId, refreshCounter]);

  const refreshImage = useCallback(async () => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Listen for image change events
  useEffect(() => {
    const handleImageUpdate = (event: CustomEvent) => {
      if (event.detail?.characterId === characterId) {
        refreshImage();
      }
    };

    window.addEventListener('character-image-updated' as any, handleImageUpdate);

    return () => {
      window.removeEventListener('character-image-updated' as any, handleImageUpdate);
    };
  }, [characterId, refreshImage]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imageDataUrl) {
        characterImageService.revokeObjectURL(imageDataUrl);
      }
      if (thumbnailDataUrl) {
        characterImageService.revokeObjectURL(thumbnailDataUrl);
      }
    };
  }, [imageDataUrl, thumbnailDataUrl]);

  return {
    imageDataUrl,
    thumbnailDataUrl,
    isLoading,
    error,
    refreshImage,
  };
}