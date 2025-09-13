import { imageConfig } from '../config/image-config';
import type { PixelCrop } from 'react-image-crop';

export async function processImage(
  imageSrc: string,
  crop: PixelCrop,
  targetWidth: number,
  targetHeight: number,
  format: 'webp' | 'jpeg' | 'png' = 'webp',
  quality: number = 0.9,
  naturalWidth?: number,
  naturalHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set the canvas size to the target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Calculate scale between displayed size and natural size
      // If naturalWidth/Height are provided, use them; otherwise assume 1:1
      const scaleX = naturalWidth ? image.naturalWidth / naturalWidth : 1;
      const scaleY = naturalHeight ? image.naturalHeight / naturalHeight : 1;
      
      // Draw the cropped and scaled image
      // Apply scale to convert from displayed pixels to natural image pixels
      ctx.drawImage(
        image,
        crop.x * scaleX,  // Source X position (scaled to natural size)
        crop.y * scaleY,  // Source Y position (scaled to natural size)
        crop.width * scaleX,  // Source width (scaled to natural size)
        crop.height * scaleY, // Source height (scaled to natural size)
        0,  // Destination X (top-left of canvas)
        0,  // Destination Y (top-left of canvas)
        targetWidth,  // Destination width (scaled)
        targetHeight  // Destination height (scaled)
      );
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${format}`,
        quality
      );
    };
    
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
}

export async function createProfileAndThumbnail(
  imageSrc: string,
  crop: PixelCrop,
  displayedWidth?: number,
  displayedHeight?: number
): Promise<{ profile: Blob; thumbnail: Blob }> {
  const [profile, thumbnail] = await Promise.all([
    processImage(
      imageSrc,
      crop,
      imageConfig.profile.width,
      imageConfig.profile.height,
      imageConfig.profile.format,
      imageConfig.profile.quality,
      displayedWidth,
      displayedHeight
    ),
    processImage(
      imageSrc,
      crop,
      imageConfig.thumbnail.width,
      imageConfig.thumbnail.height,
      imageConfig.thumbnail.format,
      imageConfig.thumbnail.quality,
      displayedWidth,
      displayedHeight
    ),
  ]);
  
  return { profile, thumbnail };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const acceptedFormats = imageConfig.upload.acceptedFormats as readonly string[];
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`,
    };
  }
  
  // Check file size
  if (file.size > imageConfig.upload.maxFileSizeBytes) {
    const maxSizeMB = imageConfig.upload.maxFileSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}