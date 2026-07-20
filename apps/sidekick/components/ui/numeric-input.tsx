"use client";

import { useEffect, useState } from "react";

import { Input } from "../ui/input";

interface NumericInputProps {
  id: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A numeric input that lets the user type freely (including clearing the field)
 * and only commits the value on blur or Enter.
 */
export function NumericInput({ id, value, min = 0, max, onChange, className }: NumericInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(localValue);
    if (isNaN(parsed)) {
      setLocalValue(String(value));
      return;
    }
    const clamped = Math.max(min, max != null ? Math.min(max, parsed) : parsed);
    setLocalValue(String(clamped));
    onChange(String(clamped));
  };

  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      className={className}
    />
  );
}
