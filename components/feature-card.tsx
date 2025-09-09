"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CharacterFeature, ClassFeature } from "@/lib/schemas/features";

interface FeatureCardProps {
  feature: CharacterFeature | ClassFeature;
  source: "class" | "subclass" | "ancestry" | "background";
  sourceLabel: string;
  level?: number;
  children?: React.ReactNode;
}

const getSourceBadgeColor = (source: "class" | "subclass" | "ancestry" | "background") => {
  switch (source) {
    case "class":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "subclass":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "ancestry":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "background":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function FeatureCard({ feature, source, sourceLabel, level, children }: FeatureCardProps) {
  const hasLevel = "level" in feature && level !== undefined;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-base">{feature.name}</CardTitle>
          {hasLevel && (
            <Badge variant="outline" className="text-xs">
              Level {level}
            </Badge>
          )}
          <Badge variant="outline" className={`text-xs ${getSourceBadgeColor(source)}`}>
            {sourceLabel}
          </Badge>
        </div>
        <CardDescription className="text-sm">{feature.description}</CardDescription>
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
