"use client";

import { useCharacterImage } from "../lib/hooks/use-character-image";
import { cn } from "../lib/utils";
import { CharacterAvatarPlaceholder } from "./character-avatar-placeholder";

interface CharacterAvatarProps {
  characterId: string;
  characterName: string;
  imageId?: string;
  classId?: string;
  size?: "thumbnail" | "profile";
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function CharacterAvatar({
  characterId,
  characterName,
  imageId,
  classId,
  size = "profile",
  className,
  onClick,
  clickable = false,
}: CharacterAvatarProps) {
  const { imageDataUrl, thumbnailDataUrl, isLoading } = useCharacterImage(characterId);
  const imageUrl = size === "thumbnail" ? thumbnailDataUrl : imageDataUrl;

  const dimensions = size === "thumbnail" ? "w-[50px] h-[50px]" : "w-[100px] h-[100px]";
  const isClickable = clickable || !!onClick;

  // Determine placeholder image for official classes
  const getPlaceholderImage = () => {
    if (!classId) return null;
    
    // List of official classes that have placeholder images
    const officialClasses = [
      'berserker', 'cheat', 'commander', 'hunter', 'mage', 
      'oathsworn', 'shadowmancer', 'shepherd', 'songweaver', 
      'stormshifter', 'zephyr'
    ];
    
    if (officialClasses.includes(classId)) {
      return `/placeholders/${classId}.png`;
    }
    
    return null;
  };

  const placeholderImageSrc = getPlaceholderImage();

  return (
    <div
      className={cn(
        dimensions,
        "relative overflow-hidden rounded-lg bg-gray-100 flex-shrink-0",
        isClickable && "cursor-pointer hover:ring-2 hover:ring-primary transition-all",
        className,
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={isClickable ? `Upload image for ${characterName}` : `${characterName} avatar`}
    >
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-gray-200" />
      ) : imageUrl ? (
        // Using native img element because imageUrl is a data URL from IndexedDB
        // Next.js Image component doesn't work well with dynamic data URLs
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={characterName} className="w-full h-full object-cover" />
      ) : placeholderImageSrc ? (
        // Use class-specific placeholder image for official classes
        // eslint-disable-next-line @next/next/no-img-element
        <img src={placeholderImageSrc} alt={characterName} className="w-full h-full object-cover" />
      ) : (
        <CharacterAvatarPlaceholder className="w-full h-full" />
      )}
    </div>
  );
}
