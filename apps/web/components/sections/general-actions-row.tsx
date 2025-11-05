"use client";

import { ArrowRight, Eye, Swords, Wand2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { useState } from "react";

import { useActivityLog } from "@/lib/hooks/use-activity-log";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { SkillName } from "@/lib/schemas/character";
import { WeaponItem } from "@/lib/schemas/inventory";
import { getCharacterService } from "@/lib/services/service-factory";
import { SpellCastingService } from "@/lib/services/spell-casting-service";
import {
  ManaCastingOptions,
  SlotCastingOptions,
  SpellCastingOptions,
} from "@/lib/services/spell-casting-types";

import { UpcastSpellDialog } from "../dialogs/upcast-spell-dialog";
import { ManaSpellActions } from "../spell-actions/mana-spell-actions";
import { SlotSpellActions } from "../spell-actions/slot-spell-actions";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

type AssessSubAction = "ask_question" | "create_opening" | "anticipate_danger";

export function GeneralActionsRow() {
  const { character, updateActionTracker, performUseAbility } = useCharacterService();
  const { attack, rollSkill } = useDiceActions();
  const { uiState } = useUIStateService();
  const [showWeaponDialog, setShowWeaponDialog] = useState(false);
  const [showSpellDialog, setShowSpellDialog] = useState(false);
  const [showAssessDialog, setShowAssessDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [selectedAssessAction, setSelectedAssessAction] = useState<AssessSubAction | null>(null);
  const [upcastingSpell, setUpcastingSpell] = useState<SpellAbilityDefinition | null>(null);

  const { addLogEntry } = useActivityLog();
  const characterService = getCharacterService();
  const spellCastingService = SpellCastingService.getInstance();

  if (!character || !character.inEncounter) return null;

  const canUseAction = character.actionTracker.current > 0;
  const equippedWeapons = character.inventory.items.filter(
    (item): item is WeaponItem => item.type === "weapon" && (item.equipped ?? false),
  );

  const consumeAction = () => {
    if (canUseAction) {
      updateActionTracker({
        ...character.actionTracker,
        current: character.actionTracker.current - 1,
      });
    }
  };

  const handleMove = async () => {
    if (!canUseAction) return;
    consumeAction();
    await addLogEntry({
      id: uuidv4(),
      type: "freeform",
      timestamp: new Date(),
      description: `${character.name} moves`,
      characterId: character.id,
      actionType: "move",
    });
  };

  const handleAttack = () => {
    if (!canUseAction) return;

    if (equippedWeapons.length === 0) {
      addLogEntry({
        id: uuidv4(),
        type: "freeform",
        timestamp: new Date(),
        description: `${character.name} has no equipped weapons`,
        characterId: character.id,
        actionType: "attack_failed",
      });
      return;
    }

    if (equippedWeapons.length === 1) {
      performAttack(equippedWeapons[0]);
    } else {
      setShowWeaponDialog(true);
    }
  };

  const performAttack = async (weapon: WeaponItem) => {
    if (!canUseAction) return;

    consumeAction();
    const attributeModifier = character._attributes.strength; // TODO: Could be dexterity for finesse weapons
    await attack(weapon.name, weapon.damage || "1d6", attributeModifier, uiState.advantageLevel);
    setShowWeaponDialog(false);
  };

  const handleCastSpell = () => {
    if (!canUseAction) return;
    setShowSpellDialog(true);
  };

  const handleAssess = () => {
    if (!canUseAction) return;
    setShowAssessDialog(true);
  };

  const handleAssessSubAction = (action: AssessSubAction) => {
    setSelectedAssessAction(action);
    setShowAssessDialog(false);

    if (action === "ask_question") {
      setShowSkillDialog(true);
    } else {
      performAssessAction(action);
    }
  };

  const performAssessAction = async (action: AssessSubAction, skill?: SkillName) => {
    if (!canUseAction) return;

    consumeAction();

    if (action === "ask_question" && skill) {
      const skillData = character._skills[skill];
      const attributeValue = character._attributes[skillData.associatedAttribute];
      await rollSkill(skill, attributeValue, skillData.modifier, uiState.advantageLevel);
    } else {
      let actionDescription = "";
      switch (action) {
        case "create_opening":
          actionDescription = "creates an opening";
          break;
        case "anticipate_danger":
          actionDescription = "anticipates danger";
          break;
        default:
          actionDescription = "assesses the situation";
      }

      await addLogEntry({
        id: uuidv4(),
        type: "freeform",
        timestamp: new Date(),
        description: `${character.name} ${actionDescription}`,
        characterId: character.id,
        actionType: "assess",
      });
    }

    setShowSkillDialog(false);
    setSelectedAssessAction(null);
  };

  const handleSkillSelection = (skill: SkillName) => {
    if (selectedAssessAction === "ask_question") {
      performAssessAction(selectedAssessAction, skill);
    }
  };

  const combatSpells = characterService.getAbilities();
  const spellAbilities = combatSpells.filter((spell) => spell.type === "spell");
  const spellcastingConfig = characterService.getSpellcastingConfig();
  const spellTierAccess = characterService.getSpellTierAccess();

  const handleSpellCast = async (spell: SpellAbilityDefinition, targetTier?: number) => {
    if (!spellcastingConfig) {
      console.error("No spellcasting configuration found for this class");
      return;
    }

    let options: SpellCastingOptions;

    if (spellcastingConfig.method === "mana") {
      options = {
        methodType: "mana",
        targetTier: targetTier || spell.tier,
      } as ManaCastingOptions;
    } else {
      // Slot casting always uses highest tier
      options = {
        methodType: "slot",
      } as SlotCastingOptions;
    }

    const result = await spellCastingService.castSpell(spell.id, options);

    if (!result.success) {
      console.error("Failed to cast spell:", result.error);
    }

    setShowSpellDialog(false);
    setUpcastingSpell(null);
  };

  const handleUpcastClick = async (spell: SpellAbilityDefinition) => {
    // For slot casting, cast immediately at max tier (no upcast dialog needed)
    if (spellcastingConfig?.method === "slot") {
      await handleSpellCast(spell);
      return;
    }

    // For mana casting, show the upcast dialog
    setShowSpellDialog(false);
    setUpcastingSpell(spell);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <Button
          variant="outline"
          size="default"
          onClick={handleMove}
          disabled={!canUseAction}
          className="text-sm h-10"
        >
          <ArrowRight className="w-4 h-4 mr-1" />
          Move
        </Button>

        <Button
          variant="outline"
          size="default"
          onClick={handleAttack}
          disabled={!canUseAction}
          className="text-sm h-10"
        >
          <Swords className="w-4 h-4 mr-1" />
          Attack
        </Button>

        <Button
          variant="outline"
          size="default"
          onClick={handleCastSpell}
          disabled={!canUseAction || spellAbilities.length === 0}
          className="text-sm h-10"
        >
          <Wand2 className="w-4 h-4 mr-1" />
          Cast a Spell
        </Button>

        <Button
          variant="outline"
          size="default"
          onClick={handleAssess}
          disabled={!canUseAction}
          className="text-sm h-10"
        >
          <Eye className="w-4 h-4 mr-1" />
          Assess
        </Button>
      </div>

      {/* Weapon Selection Dialog */}
      <Dialog open={showWeaponDialog} onOpenChange={setShowWeaponDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Weapon</DialogTitle>
            <DialogDescription>Choose which weapon to attack with</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {equippedWeapons.map((weapon) => (
              <Button
                key={weapon.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => performAttack(weapon)}
              >
                <Swords className="w-4 h-4 mr-2" />
                {weapon.name} ({weapon.damage || "1d6"})
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Spell Selection Dialog */}
      <Dialog open={showSpellDialog} onOpenChange={setShowSpellDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cast a Spell</DialogTitle>
            <DialogDescription>Choose a spell to cast</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {spellAbilities.map((spell) => (
              <div key={spell.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{spell.name}</h3>
                    {spell.description && (
                      <p className="text-xs text-muted-foreground mt-1">{spell.description}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Tier {spell.tier} • {spell.school}
                      </span>
                    </div>
                  </div>
                </div>
                {spellcastingConfig?.method === "mana" ? (
                  <ManaSpellActions
                    spell={spell}
                    spellTierAccess={spellTierAccess}
                    onCast={handleSpellCast}
                    onUpcast={handleUpcastClick}
                  />
                ) : spellcastingConfig?.method === "slot" ? (
                  <SlotSpellActions
                    spell={spell}
                    spellTierAccess={spellTierAccess}
                    onCast={handleSpellCast}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assess Action Dialog */}
      <Dialog open={showAssessDialog} onOpenChange={setShowAssessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assess</DialogTitle>
            <DialogDescription>Choose how to assess the situation</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAssessSubAction("ask_question")}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAssessSubAction("create_opening")}
            >
              <Swords className="w-4 h-4 mr-2" />
              Create an Opening
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAssessSubAction("anticipate_danger")}
            >
              <Eye className="w-4 h-4 mr-2" />
              Anticipate Danger
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skill Selection Dialog */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>Choose which skill to use for your question</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(character._skills).map(([skillName, skillData]) => (
              <Button
                key={skillName}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSkillSelection(skillName as SkillName)}
              >
                {skillName.charAt(0).toUpperCase() + skillName.slice(1).replace("_", " ")} (+
                {character._attributes[skillData.associatedAttribute] + skillData.modifier})
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcast Spell Dialog */}
      {upcastingSpell && (
        <UpcastSpellDialog
          spell={upcastingSpell}
          baseTier={upcastingSpell.tier}
          maxTier={spellTierAccess}
          onCast={(targetTier) => handleSpellCast(upcastingSpell, targetTier)}
          onClose={() => setUpcastingSpell(null)}
        />
      )}
    </>
  );
}
