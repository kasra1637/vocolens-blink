import React from "react";
import UnifiedSlider from "@/components/shared/UnifiedSlider";

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accentColor?: string;
  trackColor?: string;
}

export default function ReflectionSlider({
  value,
  min,
  max,
  onChange,
  accentColor = "rgba(255,255,255,0.85)",
  trackColor = "rgba(255,255,255,0.15)",
}: Props) {
  return (
    <UnifiedSlider
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      accentColor={accentColor}
      trackColor={trackColor}
    />
  );
}

