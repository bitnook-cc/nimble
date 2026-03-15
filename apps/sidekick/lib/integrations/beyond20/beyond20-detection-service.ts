/**
 * Beyond20 Detection Service
 *
 * Detects the presence of the Beyond20 browser extension and manages
 * event listeners for integration.
 */
import { Beyond20EventCallback, Beyond20Integration, Beyond20Settings } from "./types";

export class Beyond20DetectionService {
  private isInstalled = false;
  private settings: Beyond20Settings | null = null;
  private loadedCallbacks: Beyond20EventCallback[] = [];
  private listenerAdded = false;

  constructor() {
    this.setupEventListener();
  }

  /**
   * Set up the Beyond20_Loaded event listener
   */
  private setupEventListener(): void {
    if (typeof window === "undefined" || this.listenerAdded) {
      return;
    }

    // Listen for Beyond20_Loaded event
    document.addEventListener("Beyond20_Loaded", ((event: CustomEvent) => {
      this.isInstalled = true;
      this.settings = event.detail?.[0] || {};

      // Notify all registered callbacks
      this.loadedCallbacks.forEach((callback) => callback(this.settings));

      console.log("Beyond20 detected:", this.settings);
    }) as EventListener);

    this.listenerAdded = true;

    // Trigger a check immediately in case Beyond20 is already loaded
    this.checkIfAlreadyLoaded();
  }

  /**
   * Check if Beyond20 is already loaded by dispatching a custom event
   */
  private checkIfAlreadyLoaded(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Dispatch event to trigger Beyond20_Loaded if extension is present
    const checkEvent = new CustomEvent("Beyond20_Check");
    document.dispatchEvent(checkEvent);
  }

  /**
   * Register a callback to be called when Beyond20 is detected
   */
  public onLoaded(callback: Beyond20EventCallback): void {
    this.loadedCallbacks.push(callback);

    // If already loaded, call immediately
    if (this.isInstalled) {
      callback(this.settings);
    }
  }

  /**
   * Get the current integration status
   */
  public getStatus(): Beyond20Integration {
    return {
      isInstalled: this.isInstalled,
      settings: this.settings,
    };
  }

  /**
   * Check if Beyond20 is currently installed
   */
  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Get Beyond20 settings if available
   */
  public getSettings(): Beyond20Settings | null {
    return this.settings;
  }
}

// Singleton instance
export const beyond20DetectionService = new Beyond20DetectionService();
