import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import "@/styles/nimble-card.css";

interface NimbleCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "simple" | "accent" | "muted";
}

export function NimbleCard({
  children,
  className,
  variant = "default",
}: NimbleCardProps) {
  const variantClass = variant === "simple" ? "nimble-card-simple" : 
                       variant === "accent" ? "nimble-card nimble-card-accent" :
                       variant === "muted" ? "nimble-card nimble-card-muted" :
                       "nimble-card";

  if (variant === "simple") {
    return (
      <div className={cn(variantClass, className)}>
        {children}
      </div>
    );
  }

  // Exact Nimbrew structure: content first, then nested grids
  return (
    <div className={cn(variantClass, className)}>
      {/* Main content wrapper */}
      <div className="nimble-card-content-wrapper">
        {children}
      </div>
      
      {/* Border frame grid with nested background */}
      <div className="statblockBG">
        <div className="BGCorner" />
        <div className="BGCorner" />
        <div className="BGCorner" />
        <div className="BGCorner" />
        <div className="BGEdgeTop" />
        <div className="BGEdgeLeft" />
        <div className="BGEdgeRight" />
        <div className="BGEdgeBottom" />
        <div className="BGCenter" />
        
        {/* White background grid with corner cutouts - nested inside statblockBG */}
        <div className="whiteBGClass">
          <svg className="colorBGcorner" viewBox="0 0 100 100">
            <defs>
              <mask id="cornerCutout1" maskUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="0" cy="0" r="90" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="var(--solidBGColor)" mask="url(#cornerCutout1)" />
          </svg>
          <svg className="colorBGcorner" viewBox="0 0 100 100">
            <defs>
              <mask id="cornerCutout2" maskUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="100" cy="0" r="90" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="var(--solidBGColor)" mask="url(#cornerCutout2)" />
          </svg>
          <svg className="colorBGcorner" viewBox="0 0 100 100">
            <defs>
              <mask id="cornerCutout3" maskUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="0" cy="100" r="90" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="var(--solidBGColor)" mask="url(#cornerCutout3)" />
          </svg>
          <svg className="colorBGcorner" viewBox="0 0 100 100">
            <defs>
              <mask id="cornerCutout4" maskUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="100" cy="100" r="90" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="var(--solidBGColor)" mask="url(#cornerCutout4)" />
          </svg>
          <div className="colorBGtop" />
          <div className="colorBGleft" />
          <div className="colorBGright" />
          <div className="colorBGbottom" />
          <div className="colorBGcenter" />
        </div>
      </div>
    </div>
  );
}

interface NimbleCardBannerProps {
  children: ReactNode;
  className?: string;
}

export function NimbleCardBanner({
  children,
  className,
}: NimbleCardBannerProps) {
  return (
    <div className={cn("nimble-card-banner", className)}>
      {children}
      <div className="passiveBGHolder">
        <svg className="passiveBGPointSVG" viewBox="0 0 100 50" preserveAspectRatio="none">
          <polygon points="0,25 100,0 100,50" fill="var(--passiveBGColor)" />
        </svg>
        <div className="passiveBGRect" />
        <svg className="passiveBGPointSVG" viewBox="0 0 100 50" preserveAspectRatio="none">
          <polygon points="100,25 0,0 0,50" fill="var(--passiveBGColor)" />
        </svg>
      </div>
    </div>
  );
}

interface NimbleCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function NimbleCardHeader({
  children,
  className,
}: NimbleCardHeaderProps) {
  return (
    <div className={cn("nimble-card-header", className)}>
      {children}
    </div>
  );
}

interface NimbleCardContentProps {
  children: ReactNode;
  className?: string;
}

export function NimbleCardContent({
  children,
  className,
}: NimbleCardContentProps) {
  return (
    <div className={cn("nimble-card-content", className)}>
      {children}
    </div>
  );
}