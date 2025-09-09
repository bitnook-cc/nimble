"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import React, { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

interface WizardStep {
  id: string;
  label: string;
}

interface WizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleIcon?: React.ReactNode;
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  className?: string;
  contentClassName?: string;
  completedSteps?: number[];
}

export function WizardDialog({
  open,
  onOpenChange,
  title,
  titleIcon,
  steps,
  currentStep,
  onStepChange,
  children,
  onNext,
  onPrevious,
  canProceed = true,
  nextButtonText,
  previousButtonText,
  className,
  contentClassName,
  completedSteps = [],
}: WizardDialogProps) {
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0", className)}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            {titleIcon}
            {title}
          </DialogTitle>
          <DialogDescription>
            Follow the step-by-step wizard to create or level up your character.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <WizardStepIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* Step Content */}
        <div className={cn("flex-1 overflow-y-auto", contentClassName)}>{children}</div>

        {/* Navigation Buttons */}
        <WizardNavigation
          onPrevious={handlePrevious}
          onNext={handleNext}
          canProceed={canProceed}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          currentStep={currentStep}
          totalSteps={steps.length}
          nextButtonText={nextButtonText}
          previousButtonText={previousButtonText}
        />
      </DialogContent>
    </Dialog>
  );
}

export function WizardStepIndicator({
  steps,
  currentStep,
  completedSteps = [],
}: {
  steps: WizardStep[];
  currentStep: number;
  completedSteps?: number[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeStepRef = React.useRef<HTMLDivElement>(null);

  // Auto-center the active step when currentStep changes
  React.useEffect(() => {
    if (activeStepRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeStep = activeStepRef.current;

      const containerWidth = container.clientWidth;
      const activeStepLeft = activeStep.offsetLeft;
      const activeStepWidth = activeStep.clientWidth;

      // Calculate the scroll position to center the active step
      const scrollLeft = activeStepLeft - containerWidth / 2 + activeStepWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  return (
    <div className="w-full py-4">
      <div ref={containerRef} className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-center min-w-max px-4 sm:px-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              ref={index === currentStep ? activeStepRef : null}
              className="flex items-center shrink-0"
            >
              <div
                className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : completedSteps.includes(index)
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap",
                  index === currentStep ? "font-medium" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-2 sm:mx-3 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WizardNavigation({
  onPrevious,
  onNext,
  canProceed = true,
  isFirstStep = false,
  isLastStep = false,
  currentStep,
  totalSteps,
  nextButtonText,
  previousButtonText,
}: {
  onPrevious: () => void;
  onNext: () => void;
  canProceed?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  currentStep: number;
  totalSteps: number;
  nextButtonText?: string;
  previousButtonText?: string;
}) {
  return (
    <div className="flex items-center justify-between p-6 border-t">
      <Button variant="outline" onClick={onPrevious} disabled={isFirstStep}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        {previousButtonText || "Previous"}
      </Button>

      <Button onClick={onNext} disabled={!canProceed}>
        {nextButtonText || (isLastStep ? "Complete" : "Next")}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
