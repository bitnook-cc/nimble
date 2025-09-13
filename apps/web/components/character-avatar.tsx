'use client';

import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { CharacterAvatarPlaceholder } from './character-avatar-placeholder';
import { characterImageService } from '../lib/services/character-image-service';

interface CharacterAvatarProps {
  characterId: string;
  characterName: string;
  imageId?: string;
  size?: 'thumbnail' | 'profile';
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function CharacterAvatar({
  characterId,
  characterName,
  imageId,
  size = 'profile',
  className,
  onClick,
  clickable = false,
}: CharacterAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        
        if (imageId) {
          const image = await characterImageService.getImage(imageId);
          
          if (image && isMounted) {
            const blob = size === 'thumbnail' ? image.thumbnailImage : image.profileImage;
            objectUrl = characterImageService.createObjectURL(blob);
            setImageUrl(objectUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load character image:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        characterImageService.revokeObjectURL(objectUrl);
      }
    };
  }, [characterId, imageId, size]);

  const dimensions = size === 'thumbnail' ? 'w-[50px] h-[50px]' : 'w-[100px] h-[100px]';
  const isClickable = clickable || !!onClick;

  return (
    <div
      className={cn(
        dimensions,
        'relative overflow-hidden rounded-lg bg-gray-100 flex-shrink-0',
        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary transition-all',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      aria-label={isClickable ? `Upload image for ${characterName}` : `${characterName} avatar`}
    >
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-gray-200" />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={characterName}
          className="w-full h-full object-cover"
        />
      ) : (
        <CharacterAvatarPlaceholder className="w-full h-full" />
      )}
    </div>
  );
}