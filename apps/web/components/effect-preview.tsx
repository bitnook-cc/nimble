import { effectService } from "@/lib/services/effect-service";
import { Effect } from "@/lib/types/effects";

interface EffectPreviewProps {
  effects: Effect[];
  className?: string;
}

export function EffectPreview({ effects, className = "" }: EffectPreviewProps) {
  if (!effects || effects.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 text-sm ${className}`}>
      {effects.map((effect, index) => {
        const icon = effectService.getEffectIcon(effect);
        const preview = effectService.getEffectPreview(effect);

        return (
          <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
            <span className="text-base">{icon}</span>
            <span className="text-muted-foreground">{preview}</span>
          </div>
        );
      })}
    </div>
  );
}
