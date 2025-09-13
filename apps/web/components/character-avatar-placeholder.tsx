export function CharacterAvatarPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
      
      {/* Head */}
      <ellipse cx="50" cy="35" rx="18" ry="20" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      
      {/* Body/shoulders */}
      <path
        d="M 25 75 Q 25 55, 50 55 Q 75 55, 75 75 L 75 95 Q 75 98, 72 98 L 28 98 Q 25 98, 25 95 Z"
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      
      {/* Face features - simple dots for eyes */}
      <circle cx="42" cy="33" r="2" fill="#6b7280" />
      <circle cx="58" cy="33" r="2" fill="#6b7280" />
      
      {/* Simple mouth */}
      <path
        d="M 44 42 Q 50 45, 56 42"
        stroke="#6b7280"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}