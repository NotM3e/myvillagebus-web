'use client';

import type { CreatorData } from './ScheduleCreator';

interface StepLineProps {
  data: CreatorData;
  updateData: (updates: Partial<CreatorData>) => void;
}

export default function StepLine({ data, updateData }: StepLineProps) {
  return (
    <div>
      <h2 className="md-title-large mb-4">Linia i trasa</h2>
      <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
        Krok 2 - wkrótce
      </p>
    </div>
  );
}