'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Shield, 
  BookOpen, 
  Zap, 
  Crown, 
  Users, 
  CircleDot,
  Award
} from 'lucide-react';
import { FeatureEffect } from '@/lib/types/feature-effects';

interface FeatureEffectsDisplayProps {
  effects: FeatureEffect[];
  onSelectEffect?: (effect: FeatureEffect) => void;
  selectedEffectIds?: string[];
  className?: string;
}

const getEffectIcon = (effectType: string) => {
  switch (effectType) {
    case 'ability': return <Zap className="h-3 w-3" />;
    case 'attribute_boost': return <TrendingUp className="h-3 w-3" />;
    case 'stat_bonus': return <Plus className="h-3 w-3" />;
    case 'proficiency': return <Award className="h-3 w-3" />;
    case 'spell_school': return <BookOpen className="h-3 w-3" />;
    case 'spell_school_choice': return <BookOpen className="h-3 w-3" />;
    case 'utility_spells': return <Sparkles className="h-3 w-3" />;
    case 'spell_tier_access': return <Crown className="h-3 w-3" />;
    case 'resource': return <CircleDot className="h-3 w-3" />;
    case 'subclass_choice': return <Users className="h-3 w-3" />;
    case 'pick_feature_from_pool': return <Users className="h-3 w-3" />;
    case 'resistance': return <Shield className="h-3 w-3" />;
    default: return null;
  }
};

const getEffectLabel = (effectType: string) => {
  switch (effectType) {
    case 'ability': return 'Ability';
    case 'attribute_boost': return 'Attribute Boost';
    case 'stat_bonus': return 'Stat Bonus';
    case 'proficiency': return 'Proficiency';
    case 'spell_school': return 'Spell School';
    case 'spell_school_choice': return 'Choose Spell School';
    case 'utility_spells': return 'Utility Spells';
    case 'spell_tier_access': return 'Spell Tier Access';
    case 'resource': return 'Resource';
    case 'subclass_choice': return 'Choose Subclass';
    case 'pick_feature_from_pool': return 'Choose Feature';
    case 'resistance': return 'Resistance';
    default: return effectType;
  }
};

const formatEffectDescription = (effect: FeatureEffect): string => {
  switch (effect.type) {
    case 'ability':
      return `Grants: ${effect.ability.name}`;
    
    case 'attribute_boost':
      const attrs = effect.allowedAttributes.map(a => a.toUpperCase()).join(' or ');
      return `+${effect.amount} to ${attrs}`;
    
    case 'stat_bonus':
      if (effect.statBonus.attributes) {
        const bonuses = Object.entries(effect.statBonus.attributes)
          .map(([attr, val]) => `+${val} ${attr.toUpperCase()}`)
          .join(', ');
        return bonuses;
      }
      return 'Stat bonus';
    
    case 'proficiency':
      return effect.proficiencies.map(p => p.name).join(', ');
    
    case 'spell_school':
      return `Unlocks ${effect.spellSchool.name}`;
    
    case 'spell_school_choice':
      const numChoices = effect.numberOfChoices || 1;
      return `Choose ${numChoices} spell school${numChoices > 1 ? 's' : ''}`;
    
    case 'utility_spells':
      return `Utility spells from ${effect.schools.join(', ')}`;
    
    case 'spell_tier_access':
      return `Access to Tier ${effect.maxTier} spells`;
    
    case 'resource':
      return `${effect.resourceDefinition.name}: ${effect.resourceDefinition.description || 'Resource'}`;
    
    case 'subclass_choice':
      return 'Select your specialization';
    
    case 'pick_feature_from_pool':
      return `Choose ${effect.choicesAllowed} feature${effect.choicesAllowed > 1 ? 's' : ''} from ${effect.poolId}`;
    
    case 'resistance':
      return effect.resistances.map(r => r.name).join(', ');
    
    default:
      return 'Effect';
  }
};

const isSelectableEffect = (effect: FeatureEffect): boolean => {
  return ['attribute_boost', 'spell_school_choice', 'utility_spells', 'subclass_choice', 'pick_feature_from_pool'].includes(effect.type);
};

export function FeatureEffectsDisplay({ 
  effects, 
  onSelectEffect, 
  selectedEffectIds = [], 
  className = '' 
}: FeatureEffectsDisplayProps) {
  if (!effects || effects.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Passive feature - no mechanical effects
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effects</div>
      <div className="space-y-2">
        {effects.map((effect, index) => {
          const isSelectable = isSelectableEffect(effect);
          const isSelected = selectedEffectIds.includes(effect.id);
          
          return (
            <div 
              key={effect.id || index}
              className={`
                flex items-center gap-2 p-2 rounded-md border bg-card
                ${isSelectable && onSelectEffect ? 'cursor-pointer hover:bg-accent' : ''}
                ${isSelected ? 'border-primary bg-accent' : 'border-border'}
              `}
              onClick={() => isSelectable && onSelectEffect && onSelectEffect(effect)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1">
                  {getEffectIcon(effect.type)}
                  <Badge variant="secondary" className="text-xs">
                    {getEffectLabel(effect.type)}
                  </Badge>
                </div>
                <span className="text-sm">
                  {formatEffectDescription(effect)}
                </span>
              </div>
              {isSelectable && onSelectEffect && (
                <Button 
                  size="sm" 
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEffect(effect);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}