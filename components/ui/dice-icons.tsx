import { DiceType } from "@/lib/types/dice";

interface DiceIconProps {
  className?: string;
}

export function D4Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2 L22 20 L2 20 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">
        4
      </text>
    </svg>
  );
}

export function D6Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function D8Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2 L20 8 L20 16 L12 22 L4 16 L4 8 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="12" y="14" textAnchor="middle" fontSize="8" fill="currentColor">
        8
      </text>
    </svg>
  );
}

export function D10Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2 L20 6 L18 18 L6 18 L4 6 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="12" y="13" textAnchor="middle" fontSize="7" fill="currentColor">
        10
      </text>
    </svg>
  );
}

export function D12Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2 L18 5 L21 11 L18 17 L12 22 L6 17 L3 11 L6 5 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill="currentColor">
        12
      </text>
    </svg>
  );
}

export function D20Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2 L19 7 L22 14 L19 19 L12 22 L5 19 L2 14 L5 7 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M12 2 L5 7 L12 12 L19 7 Z" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M12 12 L5 19 L12 22 L19 19 Z" stroke="currentColor" strokeWidth="1" fill="none" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill="currentColor">
        20
      </text>
    </svg>
  );
}

export function D100Icon({ className = "w-4 h-4" }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2 L20 6 L18 18 L6 18 L4 6 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="12" y="13" textAnchor="middle" fontSize="6" fill="currentColor">
        100
      </text>
    </svg>
  );
}

interface DiceIconComponentProps {
  type: DiceType;
  className?: string;
}

export function DiceIcon({ type, className = "w-4 h-4" }: DiceIconComponentProps) {
  switch (type) {
    case 4:
      return <D4Icon className={className} />;
    case 6:
      return <D6Icon className={className} />;
    case 8:
      return <D8Icon className={className} />;
    case 10:
      return <D10Icon className={className} />;
    case 12:
      return <D12Icon className={className} />;
    case 20:
      return <D20Icon className={className} />;
    case 100:
      return <D100Icon className={className} />;
    default:
      return <D6Icon className={className} />;
  }
}
