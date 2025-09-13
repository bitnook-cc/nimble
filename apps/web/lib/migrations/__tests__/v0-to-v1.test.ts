import { describe, it, expect } from 'vitest';
import { migrations } from '../registry';

describe('v0 to v1 Migration', () => {
  const v0ToV1Migration = migrations[0];

  it('should migrate effectSelections to traitSelections', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character',
      effectSelections: [
        {
          grantedByEffectId: 'source-1',
          selectedOptions: ['option-1']
        }
      ]
    };

    const migrated = v0ToV1Migration.migrate(v0Character);

    expect(migrated.traitSelections).toBeDefined();
    expect(migrated.effectSelections).toBeUndefined();
    expect(migrated.traitSelections).toHaveLength(1);
    expect(migrated.traitSelections[0].grantedByTraitId).toBe('source-1');
    expect(migrated.traitSelections[0].grantedByEffectId).toBeUndefined();
    expect(migrated.traitSelections[0].selectedOptions).toEqual(['option-1']);
  });

  it('should add _schemaVersion', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character'
    };

    const migrated = v0ToV1Migration.migrate(v0Character);
    expect(migrated._schemaVersion).toBe(1);
  });

  it('should handle characters without effectSelections', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character'
    };

    const migrated = v0ToV1Migration.migrate(v0Character);
    expect(migrated.traitSelections).toEqual([]);
  });

  it('should rename grantedByEffectId to grantedByTraitId in traitSelections', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character',
      effectSelections: [
        {
          grantedByEffectId: 'source-1',
          selectedOptions: ['option-1']
        },
        {
          grantedByEffectId: 'source-2',
          selectedOptions: ['option-2']
        }
      ]
    };

    const migrated = v0ToV1Migration.migrate(v0Character);

    expect(migrated.traitSelections).toHaveLength(2);
    expect(migrated.traitSelections[0].grantedByTraitId).toBe('source-1');
    expect(migrated.traitSelections[0].grantedByEffectId).toBeUndefined();
    expect(migrated.traitSelections[1].grantedByTraitId).toBe('source-2');
    expect(migrated.traitSelections[1].grantedByEffectId).toBeUndefined();
  });

  it('should handle empty arrays correctly', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character',
      effectSelections: []
    };

    const migrated = v0ToV1Migration.migrate(v0Character);

    expect(migrated.traitSelections).toEqual([]);
    expect(migrated._schemaVersion).toBe(1);
  });

  it('should be idempotent', () => {
    const v1Character = {
      id: 'test-char',
      name: 'Test Character',
      _schemaVersion: 1,
      traitSelections: [
        {
          grantedByTraitId: 'source-1',
          selectedOptions: ['option-1']
        }
      ]
    };

    const migrated = v0ToV1Migration.migrate(v1Character);

    // Should not create duplicate fields or change existing correct fields
    expect(migrated.traitSelections).toEqual(v1Character.traitSelections);
    expect(migrated.effectSelections).toBeUndefined();
    expect(migrated._schemaVersion).toBe(1);
  });

  it('should preserve other character fields', () => {
    const v0Character = {
      id: 'test-char',
      name: 'Test Character',
      level: 5,
      classId: 'wizard',
      hitPoints: { current: 30, max: 30, temporary: 0 },
      effectSelections: []
    };

    const migrated = v0ToV1Migration.migrate(v0Character);

    expect(migrated.id).toBe('test-char');
    expect(migrated.name).toBe('Test Character');
    expect(migrated.level).toBe(5);
    expect(migrated.classId).toBe('wizard');
    expect(migrated.hitPoints).toEqual({ current: 30, max: 30, temporary: 0 });
  });
});