export const imageConfig = {
  profile: {
    width: 100,
    height: 100,
    format: "webp" as const,
    quality: 0.9,
  },
  thumbnail: {
    width: 50,
    height: 50,
    format: "webp" as const,
    quality: 0.85,
  },
  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
} as const;

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageFormat = "webp" | "jpeg" | "png";
