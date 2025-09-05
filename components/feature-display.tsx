'use client';

import React from 'react';
import { ClassFeature } from '@/lib/types/class';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FeatureEffect } from '@/lib/types/feature-effects';
import { FeatureEffectsDisplay } from './feature-effects-display';

interface FeatureDisplayProps {
  feature: ClassFeature;
  onSelectEffect?: (effect: FeatureEffect) => void;
  selectedEffectIds?: string[];
  className?: string;
}

export function FeatureDisplay({ feature, onSelectEffect, selectedEffectIds = [], className = '' }: FeatureDisplayProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Feature Header */}
          <div>
            <h3 className="font-semibold text-base">{feature.name}</h3>
            {feature.level && (
              <Badge variant="outline" className="mt-1 text-xs">
                Level {feature.level}
              </Badge>
            )}
          </div>

          {/* Feature Description */}
          <p className="text-sm text-muted-foreground">{feature.description}</p>

          {/* Feature Effects - using the shared component */}
          <div className="pt-2 border-t">
            <FeatureEffectsDisplay 
              effects={feature.effects}
              onSelectEffect={onSelectEffect}
              selectedEffectIds={selectedEffectIds}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}