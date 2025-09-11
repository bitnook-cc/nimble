export type TabType = "combat" | "skills" | "character" | "equipment" | "spells" | "log";

export interface UIState {
  collapsibleSections: {
    classInfo: boolean;
    classFeatures: boolean;
    hitDice: boolean;
    wounds: boolean;
    initiative: boolean;
    actionTracker: boolean;
    resources: boolean;
    attributes: boolean;
    armor: boolean;
    abilities: boolean;
    inventory: boolean;
  };
  advantageLevel: number; // Positive for advantage, negative for disadvantage, 0 for normal
  activeTab: TabType; // Currently selected tab in the character sheet
}

export class UIStateService {
  private readonly storageKey = "nimble-navigator-ui-state";
  private _uiState: UIState | null = null;
  private uiStateListeners: ((uiState: UIState) => void)[] = [];

  // Public getter for UI state
  get uiState(): UIState | null {
    return this._uiState;
  }

  // State Management with subscriptions
  subscribeToUIState(listener: (uiState: UIState) => void): () => void {
    this.uiStateListeners.push(listener);
    if (this._uiState) {
      listener(this._uiState);
    }

    // Return unsubscribe function
    return () => {
      this.uiStateListeners = this.uiStateListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    if (this._uiState) {
      this.uiStateListeners.forEach((listener) => listener(this._uiState!));
    }
  }

  async getUIState(): Promise<UIState> {
    if (this._uiState) {
      return this._uiState;
    }

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      this._uiState = this.getDefaultUIState();
    } else {
      try {
        const parsed = JSON.parse(stored);
        this._uiState = this.migrateUIState(parsed);
      } catch {
        this._uiState = this.getDefaultUIState();
      }
    }

    return this._uiState!; // We know it's not null at this point
  }

  async saveUIState(state: UIState): Promise<void> {
    this._uiState = state;
    localStorage.setItem(this.storageKey, JSON.stringify(state));
    this.notifyListeners();
  }

  async updateCollapsibleState(
    section: keyof UIState["collapsibleSections"],
    isOpen: boolean,
  ): Promise<void> {
    const currentState = await this.getUIState();
    const newState = {
      ...currentState,
      collapsibleSections: {
        ...currentState.collapsibleSections,
        [section]: isOpen,
      },
    };
    await this.saveUIState(newState);
  }

  async updateAdvantageLevel(advantageLevel: number): Promise<void> {
    const currentState = await this.getUIState();
    const newState = {
      ...currentState,
      advantageLevel,
    };
    await this.saveUIState(newState);
  }

  async updateActiveTab(activeTab: TabType): Promise<void> {
    const currentState = await this.getUIState();
    const newState = {
      ...currentState,
      activeTab,
    };
    await this.saveUIState(newState);
  }

  private migrateUIState(stored: any): UIState {
    // Handle migration from old mana-based UI state
    const sections = stored.collapsibleSections || {};

    return {
      collapsibleSections: {
        classInfo: sections.classInfo ?? true,
        classFeatures: sections.classFeatures ?? true,
        hitDice: sections.hitDice ?? true,
        wounds: sections.wounds ?? true,
        initiative: sections.initiative ?? true,
        actionTracker: sections.actionTracker ?? true,
        resources: sections.resources ?? true,
        attributes: sections.attributes ?? true,
        armor: sections.armor ?? true,
        abilities: sections.abilities ?? true,
        inventory: sections.inventory ?? true,
      },
      advantageLevel: stored.advantageLevel ?? 0,
      activeTab: stored.activeTab ?? "combat",
    };
  }

  private getDefaultUIState(): UIState {
    return {
      collapsibleSections: {
        classInfo: true,
        classFeatures: true,
        hitDice: true,
        wounds: true,
        initiative: true,
        actionTracker: true,
        resources: true,
        attributes: true,
        armor: true,
        abilities: true,
        inventory: true,
      },
      advantageLevel: 0,
      activeTab: "combat",
    };
  }
}

export const uiStateService = new UIStateService();
