import {
  CastingCost,
  CastingMethodContext,
  CastingMethodHandler,
  CastingMethodType,
  CastingResult,
} from "../spell-casting-types";

export abstract class BaseCastingHandler implements CastingMethodHandler {
  abstract readonly methodType: CastingMethodType;

  abstract isAvailable(context: CastingMethodContext): boolean;
  abstract calculateCost(context: CastingMethodContext): CastingCost;
  abstract cast(context: CastingMethodContext): Promise<CastingResult>;
  abstract getDescription(): string;
  abstract getDisplayName(): string;
}
