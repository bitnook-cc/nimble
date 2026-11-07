"use client";

import { Wand2 } from "lucide-react";

import { useState } from "react";

import { gameConfig } from "@/lib/config/game-config";
import { useToastService } from "@/lib/hooks/use-toast-service";
import { TraitSelection } from "@/lib/schemas/character";
import type { CharacterFeature, FeatureTrait } from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { FeatureSelectionService } from "@/lib/services/feature-selection-service";
import { getCharacterCreation, getCharacterService } from "@/lib/services/service-factory";

import { AncestrySelection } from "./character-builder/ancestry-selection";
import {
  AttributeSelection,
  STANDARD_ARRAYS,
  startingAttributes,
} from "./character-builder/attribute-selection";
import { BackgroundSelection } from "./character-builder/background-selection";
import { ClassSelection } from "./character-builder/class-selection";
import { EquipmentSelection } from "./character-builder/equipment-selection";
import { FeaturesOverview } from "./character-builder/features-overview";
import { SkillsSelection } from "./character-builder/skills-selection";
import { Button } from "./ui/button";
import { WizardDialog } from "./wizard/wizard-dialog";

// Character builder state - maintains all character data until final creation
interface CharacterBuilderState {
  // Basic info
  classId?: string;
  ancestryId?: string;
  backgroundId?: string;
  name: string;

  // Features
  traitSelections: TraitSelection[];

  // Attributes
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  };

  // Skills
  skillAllocations: Record<string, number>;

  // Equipment
  selectedEquipment: string[];
}

function remainingChoices(trait: FeatureTrait, selections: TraitSelection[]) {
  const chosen = selections.filter((s) => s.grantedByTraitId === trait.id);
  switch (trait.type) {
    case "choice": {
      const choice = chosen.find((s) => s.type === "choice");
      return (
        !choice ||
        choice.selectedOptions.length < trait.numSelections ||
        choice.selectedOptions.some(
          (option) =>
            trait.options.some(
              (t) => t.id === option.traitId && t.type === "pick_feature_from_pool",
            ) && !option.selection,
        )
      );
    }
    case "pick_feature_from_pool":
      return chosen.length < trait.choicesAllowed;
    case "spell_school_choice":
      return chosen.length < (trait.numberOfChoices ?? 1);
    case "attribute_boost":
    case "subclass_choice":
      return chosen.length === 0;
    case "utility_spells": {
      const schools = trait.schools?.length
        ? trait.schools
        : selections.filter((s) => s.type === "spell_school").map((s) => s.schoolId);
      const needed = FeatureSelectionService.getInstance().getUtilitySpellSelectionCount(
        trait,
        schools,
      );
      return chosen.length < needed;
    }
    default:
      return false;
  }
}

function withoutOldChoices(selections: TraitSelection[], features?: CharacterFeature[]) {
  const obsolete = new Set(features?.flatMap((f) => f.traits?.map((t) => t.id) ?? []));
  return selections.filter((s) => !obsolete.has(s.grantedByTraitId));
}

// Builder steps
const STEPS = [
  { id: "class", label: "Class" },
  { id: "ancestry", label: "Ancestry" },
  { id: "background", label: "Background" },
  { id: "features", label: "Features" },
  { id: "attributes", label: "Attributes" },
  { id: "skills", label: "Skills" },
  { id: "equipment", label: "Equipment" },
  { id: "review", label: "Review" },
];

interface CharacterBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (characterId: string) => void;
}

export function CharacterBuilder({ isOpen, onClose, onCharacterCreated }: CharacterBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [builderState, setBuilderState] = useState<CharacterBuilderState>({
    name: "",
    traitSelections: [],
    attributes: {
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      will: 0,
    },
    skillAllocations: {},
    selectedEquipment: [],
  });

  const [acceptCustom, setAcceptCustom] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showError } = useToastService();
  const contentRepository = ContentRepositoryService.getInstance();
  const characterCreationService = getCharacterCreation();
  const characterService = getCharacterService();

  const availableClasses = contentRepository.getAllClasses();
  const availableAncestries = contentRepository.getAllAncestries();
  const availableBackgrounds = contentRepository.getAllBackgrounds();

  const handleClassSelect = (classId: string) => {
    const cls = contentRepository.getClassDefinition(classId);
    if (!cls || classId === builderState.classId) return;
    setAcceptCustom(false);
    setBuilderState((prev) => ({
      ...prev,
      classId,
      attributes: startingAttributes(cls.keyAttributes),
      traitSelections: withoutOldChoices(
        prev.traitSelections,
        availableClasses.find((c) => c.id === prev.classId)?.features,
      ),
      selectedEquipment: cls.startingEquipment ?? [],
    }));
  };

  const handleAncestrySelect = (ancestryId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      ancestryId,
      traitSelections:
        prev.ancestryId === ancestryId
          ? prev.traitSelections
          : withoutOldChoices(
              prev.traitSelections,
              availableAncestries.find((c) => c.id === prev.ancestryId)?.features,
            ),
    }));
  };

  const handleBackgroundSelect = (backgroundId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      backgroundId,
      traitSelections:
        prev.backgroundId === backgroundId
          ? prev.traitSelections
          : withoutOldChoices(
              prev.traitSelections,
              availableBackgrounds.find((c) => c.id === prev.backgroundId)?.features,
            ),
    }));
  };

  const handleNameChange = (name: string) => {
    setBuilderState((prev) => ({ ...prev, name }));
  };

  const handleEquipmentReady = (equipment: string[]) => {
    setBuilderState((prev) => ({
      ...prev,
      selectedEquipment: equipment,
    }));
  };

  const handleFeatureSelectionsChange = (selections: TraitSelection[]) => {
    setBuilderState((prev) => ({ ...prev, traitSelections: selections }));
  };

  const handleAttributesChange = (attributes: typeof builderState.attributes) => {
    setAcceptCustom(false);
    setBuilderState((prev) => ({ ...prev, attributes }));
  };

  const handleSkillsChange = (skillAllocations: Record<string, number>) => {
    setBuilderState((prev) => ({ ...prev, skillAllocations }));
  };

  const canProceedFromAncestry = (): boolean => {
    return !!(builderState.ancestryId && builderState.name.trim());
  };

  const canProceedFromBackground = (): boolean => {
    return !!(builderState.backgroundId && canProceedFromAncestry());
  };

  const canProceedFromHeritage = (): boolean => {
    return !!(
      builderState.classId &&
      builderState.ancestryId &&
      builderState.backgroundId &&
      builderState.name.trim()
    );
  };

  const createCharacterFromBuilder = async () => {
    if (creating || !canProceedFromBackground() || (customScores && !acceptCustom)) return;
    if (!builderState.classId || !builderState.ancestryId || !builderState.backgroundId) return;

    setCreating(true);
    try {
      // Effect selections are already in the correct format
      const traitSelections = builderState.traitSelections;

      // Create the complete character at the end
      const character = await characterCreationService.createCompleteCharacter({
        name: builderState.name.trim(),
        classId: builderState.classId,
        ancestryId: builderState.ancestryId,
        backgroundId: builderState.backgroundId,
        attributes: builderState.attributes,
        skillAllocations: builderState.skillAllocations,
        traitSelections,
        selectedEquipment: builderState.selectedEquipment,
      });

      // Load the character into the character service
      await characterService.loadCharacter(character.id);

      // Notify parent and close
      onCharacterCreated(character.id);
      onClose();
    } catch (error) {
      console.error("Failed to create character:", error);
      showError("Failed to create character. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const sortedScores = Object.values(builderState.attributes)
    .sort((a, b) => b - a)
    .join(",");
  const customScores = !Object.values(STANDARD_ARRAYS).some(
    (array) => array.values.join(",") === sortedScores,
  );
  const stepId = STEPS[currentStep].id;
  const canProceed =
    !creating &&
    (stepId === "class"
      ? !!builderState.classId
      : stepId === "ancestry"
        ? canProceedFromAncestry()
        : stepId === "background"
          ? canProceedFromBackground()
          : stepId === "review"
            ? canProceedFromHeritage() && (!customScores || acceptCustom)
            : true);
  const handleNext = () => {
    if (!canProceed) return;
    if (stepId === "review") void createCharacterFromBuilder();
    else setCurrentStep(currentStep + 1);
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "class":
        return (
          <ClassSelection
            availableClasses={availableClasses}
            selectedClassId={builderState.classId}
            onClassSelect={handleClassSelect}
          />
        );
      case "ancestry":
        return (
          <AncestrySelection
            availableAncestries={availableAncestries}
            selectedAncestryId={builderState.ancestryId}
            characterName={builderState.name}
            onAncestrySelect={handleAncestrySelect}
            onNameChange={handleNameChange}
          />
        );
      case "background":
        return (
          <BackgroundSelection
            availableBackgrounds={availableBackgrounds}
            selectedBackgroundId={builderState.backgroundId}
            onBackgroundSelect={handleBackgroundSelect}
          />
        );
      case "features":
        if (!builderState.classId || !builderState.ancestryId || !builderState.backgroundId)
          return null;
        return (
          <FeaturesOverview
            classId={builderState.classId}
            ancestryId={builderState.ancestryId}
            backgroundId={builderState.backgroundId}
            traitSelections={builderState.traitSelections}
            onTraitSelectionsChange={handleFeatureSelectionsChange}
          />
        );
      case "attributes":
        return (
          <AttributeSelection
            attributes={builderState.attributes}
            onAttributesChange={handleAttributesChange}
            classId={builderState.classId}
            ancestryId={builderState.ancestryId}
          />
        );
      case "skills":
        return (
          <SkillsSelection
            skillAllocations={builderState.skillAllocations}
            onSkillsChange={handleSkillsChange}
            attributes={builderState.attributes}
          />
        );
      case "equipment":
        return (
          <EquipmentSelection
            selectedEquipment={builderState.selectedEquipment}
            onEquipmentReady={handleEquipmentReady}
          />
        );
      case "review": {
        const pointsLeft =
          gameConfig.character.initialSkillPoints -
          Object.values(builderState.skillAllocations).reduce((sum, n) => sum + n, 0);

        const cls = availableClasses.find((c) => c.id === builderState.classId);
        const ancestry = availableAncestries.find((a) => a.id === builderState.ancestryId);
        const background = availableBackgrounds.find((b) => b.id === builderState.backgroundId);
        const pending = [
          ...(cls?.features.filter((f) => f.level === 1) ?? []),
          ...(ancestry?.features ?? []),
          ...(background?.features ?? []),
        ].filter((f) => f.traits?.some((t) => remainingChoices(t, builderState.traitSelections)));
        return (
          <section className="space-y-4" aria-label="Character review">
            <h3 className="text-xl font-semibold">Review {builderState.name}</h3>
            <p>
              Level 1 {ancestry?.name} {cls?.name} · {background?.name}
            </p>
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">Starting attributes</h4>
              <p>
                {Object.entries(builderState.attributes)
                  .map(
                    ([attr, n]) => attr.slice(0, 3).toUpperCase() + " " + (n >= 0 ? "+" : "") + n,
                  )
                  .join(" · ")}
              </p>
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)}>
                Edit attributes
              </Button>
              {customScores && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acceptCustom}
                    onChange={(e) => setAcceptCustom(e.target.checked)}
                  />
                  Use these custom scores instead of a standard array.
                </label>
              )}
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">Skills and features</h4>
              <p>
                {pointsLeft
                  ? `${pointsLeft} unspent skill point${pointsLeft === 1 ? "" : "s"}. You can assign them in Explore later.`
                  : "All starting skill points assigned."}
              </p>
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(5)}>
                Edit skills
              </Button>
              {pending.length > 0 && (
                <div>
                  <p>Feature choices to finish: {pending.map((f) => f.name).join(", ")}.</p>
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                    Review features
                  </Button>
                </div>
              )}
            </div>
            <p>Starting equipment: {builderState.selectedEquipment.length} items</p>
          </section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <WizardDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Character Builder"
      titleIcon={<Wand2 className="h-5 w-5 text-primary" />}
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onNext={handleNext}
      onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
      canProceed={canProceed}
      nextButtonText={
        creating
          ? "Creating…"
          : stepId === "review"
            ? "Finish Character"
            : "Next: " + STEPS[currentStep + 1].label
      }
      previousButtonText={currentStep ? "Back to " + STEPS[currentStep - 1].label : "Previous"}
      className="sm:max-w-4xl w-[95vw]"
      completedSteps={STEPS.slice(0, currentStep).map((_, i) => i)}
    >
      <div className="min-w-0 px-4 sm:px-6 py-4">{renderStepContent()}</div>
    </WizardDialog>
  );
}
