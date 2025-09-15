import { v4 as uuidv4 } from "uuid";

import { imageConfig } from "../config/image-config";

export interface CharacterImage {
  id: string;
  characterId: string;
  profileImage: Blob;
  thumbnailImage: Blob;
  createdAt: Date;
}

export interface CharacterImageMetadata {
  id: string;
  characterId: string;
  createdAt: Date;
  profileSize: number;
  thumbnailSize: number;
}

class CharacterImageService {
  private static instance: CharacterImageService;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = "NimbleCharacterImages";
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = "images";
  private isSupported: boolean = false;

  private constructor() {
    this.checkSupport();
    if (this.isSupported) {
      this.initDB();
    }
  }

  static getInstance(): CharacterImageService {
    if (!CharacterImageService.instance) {
      CharacterImageService.instance = new CharacterImageService();
    }
    return CharacterImageService.instance;
  }

  private checkSupport(): void {
    this.isSupported = typeof window !== "undefined" && "indexedDB" in window;
  }

  private async initDB(): Promise<void> {
    if (!this.isSupported) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        this.isSupported = false;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
          store.createIndex("characterId", "characterId", { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.isSupported) {
      throw new Error("IndexedDB is not supported");
    }

    if (!this.db) {
      await this.initDB();
    }

    if (!this.db) {
      throw new Error("Failed to initialize IndexedDB");
    }

    return this.db;
  }

  async saveImage(
    characterId: string,
    profileBlob: Blob,
    thumbnailBlob: Blob,
    saveAsImageId?: string,
  ): Promise<string> {
    const db = await this.ensureDB();

    const imageId = saveAsImageId || uuidv4();
    const image: CharacterImage = {
      id: imageId,
      characterId,
      profileImage: profileBlob,
      thumbnailImage: thumbnailBlob,
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(image);

      request.onsuccess = () => {
        // Emit event to notify UI of image change
        this.emitImageChangeEvent(characterId);
        resolve(imageId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private emitImageChangeEvent(characterId: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("character-image-updated", {
          detail: { characterId },
        }),
      );
    }
  }

  async getImage(imageId: string): Promise<CharacterImage | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(imageId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getImageHistory(characterId: string): Promise<CharacterImageMetadata[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("characterId");
      const request = index.getAllKeys(IDBKeyRange.only(characterId));

      request.onsuccess = async () => {
        const keys = request.result;
        const metadata: CharacterImageMetadata[] = [];

        for (const key of keys) {
          const getRequest = store.get(key);
          await new Promise<void>((resolveGet) => {
            getRequest.onsuccess = () => {
              const image = getRequest.result as CharacterImage;
              if (image) {
                metadata.push({
                  id: image.id,
                  characterId: image.characterId,
                  createdAt: image.createdAt,
                  profileSize: image.profileImage.size,
                  thumbnailSize: image.thumbnailImage.size,
                });
              }
              resolveGet();
            };
          });
        }

        // Sort by creation date descending
        metadata.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(metadata);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProfileImage(characterId: string, imageId: string): Promise<Blob | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(imageId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.characterId === characterId) {
          resolve(result.profileImage);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async imageExists(characterId: string, imageId: string): Promise<boolean> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(imageId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.characterId === characterId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAllImagesForCharacter(characterId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("characterId");
      const request = index.openCursor(IDBKeyRange.only(characterId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  isImageUploadSupported(): boolean {
    return this.isSupported;
  }

  createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const characterImageService = CharacterImageService.getInstance();
