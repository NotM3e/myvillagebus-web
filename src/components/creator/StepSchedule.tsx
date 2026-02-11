'use client';

import type { CreatorData } from './ScheduleCreator';

interface StepScheduleProps {
  data: CreatorData;
  updateData: (updates: Partial<CreatorData>) => void;
}

export default function StepSchedule({ data, updateData }: StepScheduleProps) {
  return (
    <div>
      <h2 className="md-title-large mb-4">Harmonogram</h2>
      <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
        Krok 3 - wkrótce
      </p>
    </div>
  );
}