"use client";

import { AlertCircle, Loader2, Upload } from "lucide-react";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { imageConfig } from "../lib/config/image-config";
import { characterImageService } from "../lib/services/character-image-service";
import {
  createProfileAndThumbnail,
  readFileAsDataURL,
  validateImageFile,
} from "../lib/utils/image-processing";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface CharacterImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  onImageSaved: (imageId: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function CharacterImageUploadDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  onImageSaved,
}: CharacterImageUploadDialogProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspect = imageConfig.profile.width / imageConfig.profile.height;

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const crop = centerAspectCrop(width, height, aspect);
      setCrop(crop);
    },
    [aspect],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setError("");
    try {
      const dataUrl = await readFileAsDataURL(file);
      setImageSrc(dataUrl);
    } catch (err) {
      setError("Failed to read file");
      console.error("Error reading file:", err);
    }
  };

  const handleSave = async () => {
    if (!completedCrop || !imageSrc || !imgRef.current) {
      setError("Please select and crop an image");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Get the displayed dimensions from the img element
      const displayedWidth = imgRef.current.clientWidth;
      const displayedHeight = imgRef.current.clientHeight;

      const { profile, thumbnail } = await createProfileAndThumbnail(
        imageSrc,
        completedCrop,
        displayedWidth,
        displayedHeight,
      );
      const imageId = await characterImageService.saveImage(characterId, profile, thumbnail);
      onImageSaved(imageId);
      onOpenChange(false);

      // Reset state
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to save image");
      console.error("Error saving image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setImageSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Character Image</DialogTitle>
          <DialogDescription>
            Upload and crop an image for {characterName}. The image will be resized to{" "}
            {imageConfig.profile.width}x{imageConfig.profile.height} pixels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!imageSrc ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF or WebP up to {imageConfig.upload.maxFileSizeBytes / (1024 * 1024)}
                  MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={imageConfig.upload.acceptedFormats.join(",")}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  circularCrop={false}
                >
                  {/* Using native img element for react-image-crop compatibility */}
                  {/* The crop library requires a native img element to work properly */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Upload"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageSrc("");
                    setCrop(undefined);
                    setCompletedCrop(undefined);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Choose Different Image
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isProcessing || !completedCrop}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Save Image"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
