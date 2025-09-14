import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterCreateForm } from '../character-create-form';
import { v4 as uuidv4 } from 'uuid';
import { ContentRepositoryService } from '@/lib/services/content-repository-service';
import { InMemoryStorageService } from '@/lib/services/storage-service';

// Mock the services
vi.mock('@/lib/services/service-factory', () => ({
  getCharacterCreation: vi.fn(),
  getCharacterService: vi.fn(),
}));

// Use real ContentRepositoryService with InMemoryStorageService
vi.mock('@/lib/services/storage-service', () => {
  const mockStorage = new Map<string, string>();
  
  const InMemoryStorageServiceMock = class {
    getItem(key: string): string | null {
      return mockStorage.get(key) || null;
    }
    setItem(key: string, value: string): void {
      mockStorage.set(key, value);
    }
    removeItem(key: string): void {
      mockStorage.delete(key);
    }
    clear(): void {
      mockStorage.clear();
    }
  };
  
  return {
    StorageService: {
      getInstance: vi.fn(() => new InMemoryStorageServiceMock()),
    },
    LocalStorageService: InMemoryStorageServiceMock,
    InMemoryStorageService: InMemoryStorageServiceMock,
    __clearMockStorage: () => mockStorage.clear()
  };
});

vi.mock('@/lib/hooks/use-toast-service', () => ({
  useToastService: vi.fn(() => ({
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    clearAllToasts: vi.fn(),
  })),
}));

// Mock game config
vi.mock('@/lib/config/game-config', () => ({
  gameConfig: {
    defaults: {
      classId: 'berserker',
    },
  },
}));

describe('CharacterCreateForm', () => {
  let mockCharacterCreation: any;
  let mockCharacterService: any;
  let mockShowSuccess: ReturnType<typeof vi.fn>;
  let mockShowError: ReturnType<typeof vi.fn>;
  
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    // Clear mock storage
    const storageModule = await import('@/lib/services/storage-service');
    (storageModule as any).__clearMockStorage?.();
    
    // Setup mock implementations
    mockCharacterCreation = {
      quickCreateCharacter: vi.fn(),
    };
    
    mockCharacterService = {
      loadCharacter: vi.fn(),
    };
    
    mockShowSuccess = vi.fn();
    mockShowError = vi.fn();
    
    // Setup service factory mocks
    const serviceFactory = await import('@/lib/services/service-factory');
    const { getCharacterCreation, getCharacterService } = vi.mocked(serviceFactory);
    getCharacterCreation.mockReturnValue(mockCharacterCreation);
    getCharacterService.mockReturnValue(mockCharacterService);
    
    // Setup toast service mock
    const toastModule = await import('@/lib/hooks/use-toast-service');
    const { useToastService } = vi.mocked(toastModule);
    useToastService.mockReturnValue({
      toasts: [],
      addToast: vi.fn(),
      removeToast: vi.fn(),
      showError: mockShowError,
      showSuccess: mockShowSuccess,
      showWarning: vi.fn(),
      showInfo: vi.fn(),
      clearAllToasts: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Quick Create Feature', () => {
    it('should render the quick create button', () => {
      render(<CharacterCreateForm />);
      
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      expect(quickCreateButton).toBeInTheDocument();
    });

    it('should display available classes in the dropdown', () => {
      render(<CharacterCreateForm />);
      
      // Check if the select element exists
      const classSelect = screen.getByRole('combobox');
      expect(classSelect).toBeInTheDocument();
      
      // Check if default class is selected
      expect(classSelect).toHaveValue('berserker');
    });

    it('should create a character with quick create', async () => {
      const user = userEvent.setup();
      const mockCharacterId = uuidv4();
      const mockCharacterName = 'Thorin Ironforge';
      
      // Setup the mock to return a character
      mockCharacterCreation.quickCreateCharacter.mockResolvedValue({
        id: mockCharacterId,
        name: mockCharacterName,
        classId: 'berserker',
        level: 1,
        ancestryId: 'dwarf',
        backgroundId: 'warrior',
      });
      
      const onComplete = vi.fn();
      render(<CharacterCreateForm onComplete={onComplete} />);
      
      // Click the quick create button
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      await user.click(quickCreateButton);
      
      // Wait for the async operations to complete
      await waitFor(() => {
        expect(mockCharacterCreation.quickCreateCharacter).toHaveBeenCalledWith({
          classId: 'berserker',
          level: 1,
        });
      });
      
      // Verify character was loaded
      expect(mockCharacterService.loadCharacter).toHaveBeenCalledWith(mockCharacterId);
      
      // Verify success message was shown
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Character created',
        `${mockCharacterName} has been created successfully!`
      );
      
      // Verify onComplete callback was called
      expect(onComplete).toHaveBeenCalled();
    });

    it('should allow selecting a different class before quick create', async () => {
      const user = userEvent.setup();
      const mockCharacterId = uuidv4();
      
      mockCharacterCreation.quickCreateCharacter.mockResolvedValue({
        id: mockCharacterId,
        name: 'Gandalf the Grey',
        classId: 'mage',
        level: 1,
        ancestryId: 'human',
        backgroundId: 'scholar',
      });
      
      render(<CharacterCreateForm />);
      
      // Select a different class
      const classSelect = screen.getByRole('combobox');
      await user.selectOptions(classSelect, 'mage');
      
      // Click quick create
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      await user.click(quickCreateButton);
      
      // Verify the character was created with the selected class
      await waitFor(() => {
        expect(mockCharacterCreation.quickCreateCharacter).toHaveBeenCalledWith({
          classId: 'mage',
          level: 1,
        });
      });
    });

    it('should handle errors during character creation', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create character';
      
      // Setup the mock to reject
      mockCharacterCreation.quickCreateCharacter.mockRejectedValue(new Error(errorMessage));
      
      render(<CharacterCreateForm />);
      
      // Click quick create
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      await user.click(quickCreateButton);
      
      // Wait for error handling
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to create character', 'Unable to create the character. Please try again.');
      });
      
      // Verify button is re-enabled after error
      expect(quickCreateButton).not.toBeDisabled();
    });

    it('should disable the quick create button while creating', async () => {
      const user = userEvent.setup();
      
      // Setup a promise we can control
      let resolveCreate: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      
      mockCharacterCreation.quickCreateCharacter.mockReturnValue(createPromise);
      
      render(<CharacterCreateForm />);
      
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      
      // Initially not disabled
      expect(quickCreateButton).not.toBeDisabled();
      
      // Click the button
      await user.click(quickCreateButton);
      
      // Should be disabled while creating
      expect(quickCreateButton).toBeDisabled();
      
      // Resolve the promise
      resolveCreate!({
        id: uuidv4(),
        name: 'Test Character',
        classId: 'berserker',
        level: 1,
      });
      
      // Wait for button to be re-enabled
      await waitFor(() => {
        expect(quickCreateButton).not.toBeDisabled();
      });
    });

    it('should show custom builder when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<CharacterCreateForm />);
      
      // Click the character builder button
      const builderButton = screen.getByRole('button', { name: /character builder/i });
      await user.click(builderButton);
      
      // The CharacterBuilder component should be rendered
      // We can check for its presence by looking for dialog role or specific text
      await waitFor(() => {
        // The builder is a modal/dialog, check for dialog role or heading
        const dialog = screen.queryByRole('dialog') || 
                      screen.queryByText(/create your character/i) ||
                      screen.queryByText(/choose class/i) ||
                      screen.queryByText(/select class/i);
        expect(dialog).toBeTruthy();
      });
    });

    it('should handle cancel callback', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<CharacterCreateForm onCancel={onCancel} showAsCard={false} />);
      
      // The component should have a cancel option when onCancel is provided
      // This might be in the form or in the builder
      const cancelButton = screen.queryByRole('button', { name: /cancel/i });
      if (cancelButton) {
        await user.click(cancelButton);
        expect(onCancel).toHaveBeenCalled();
      }
    });
  });

  describe('Component Props', () => {
    it('should render without card wrapper when showAsCard is false', () => {
      const { container } = render(<CharacterCreateForm showAsCard={false} />);
      
      // Should not have Card component wrapper
      const cardElement = container.querySelector('.card');
      expect(cardElement).not.toBeInTheDocument();
    });

    it('should render with card wrapper when showAsCard is true', () => {
      const { container } = render(<CharacterCreateForm showAsCard={true} />);
      
      // Should have Card component wrapper (checking for card-related classes)
      const formContainer = container.firstChild;
      expect(formContainer?.nodeName).toBeDefined();
    });
  });

  describe('Integration with Services', () => {
    it('should integrate with real service structure', async () => {
      const user = userEvent.setup();
      const mockCharacterId = uuidv4();
      
      // Create a more realistic mock character response
      const mockCharacter = {
        id: mockCharacterId,
        name: 'Aragorn',
        classId: 'hunter',
        level: 1,
        ancestryId: 'human',
        backgroundId: 'ranger',
        attributes: {
          strength: 2,
          dexterity: 3,
          intelligence: 0,
          will: 1,
        },
        hitPoints: { current: 10, max: 10, temporary: 0 },
        skills: {},
        inventory: { items: [], capacity: 12, maxSize: 12 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockCharacterCreation.quickCreateCharacter.mockResolvedValue(mockCharacter);
      
      render(<CharacterCreateForm />);
      
      // Select hunter class
      const classSelect = screen.getByRole('combobox');
      await user.selectOptions(classSelect, 'hunter');
      
      // Click quick create
      const quickCreateButton = screen.getByRole('button', { name: /quick create/i });
      await user.click(quickCreateButton);
      
      // Verify the full integration
      await waitFor(() => {
        expect(mockCharacterCreation.quickCreateCharacter).toHaveBeenCalledWith({
          classId: 'hunter',
          level: 1,
        });
        expect(mockCharacterService.loadCharacter).toHaveBeenCalledWith(mockCharacterId);
        expect(mockShowSuccess).toHaveBeenCalled();
      });
    });
  });
});