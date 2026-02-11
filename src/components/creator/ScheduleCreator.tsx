'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import StepCarrier from './StepCarrier';
import StepLine from './StepLine';
import StepSchedule from './StepSchedule';
import CheckIcon from '@mui/icons-material/Check';

interface ScheduleCreatorProps {
  user: User;
}

export interface CreatorData {
  // Krok 1
  carrier: {
    id: string | null; // null = nowy przewoźnik
    name: string;
    isNew: boolean;
  } | null;
  // Krok 2
  line: {
    id: string | null;
    number: string;
    description: string;
    isNew: boolean;
  } | null;
  stops: {
    id: string | null;
    city: string;
    name: string;
    isNew: boolean;
  }[];
  direction: string;
  // Krok 3
  days: string[];
  excludesHolidays: boolean;
  departures: string; // Bulk entry text
}

const STEPS = [
  { label: 'Przewoźnik', key: 'carrier' },
  { label: 'Linia i trasa', key: 'line' },
  { label: 'Harmonogram', key: 'schedule' },
] as const;

export default function ScheduleCreator({ user }: ScheduleCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<CreatorData>({
    carrier: null,
    line: null,
    stops: [],
    direction: '',
    days: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt'],
    excludesHolidays: true,
    departures: '',
  });

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return data.carrier !== null && data.carrier.name.trim() !== '';
      case 1:
        return data.line !== null && data.stops.length >= 2 && data.direction.trim() !== '';
      case 2:
        return data.days.length > 0 && data.departures.trim() !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // TODO: Zapis do Supabase
    console.log('Submit:', data);
    alert('Funkcja zapisu wkrótce!');
  };

  const updateData = (updates: Partial<CreatorData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-start justify-center mb-8 w-full">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center min-w-0">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  index < currentStep
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : index === currentStep
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-2 ring-[var(--md-sys-color-primary)]'
                    : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon sx={{ fontSize: 18 }} />
                ) : (
                  <span className="md-label-medium sm:md-label-large">{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-xs sm:text-sm text-center max-w-[70px] sm:max-w-none ${
                index === currentStep 
                  ? 'text-[var(--md-sys-color-on-surface)] font-medium' 
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                {step.label}
              </span>
            </div>
            
            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div 
                className={`h-0.5 flex-1 mx-2 sm:mx-4 mt-4 sm:mt-5 ${
                  index < currentStep 
                    ? 'bg-[var(--md-sys-color-primary)]' 
                    : 'bg-[var(--md-sys-color-outline-variant)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="mb-8">
        {currentStep === 0 && (
          <StepCarrier data={data} updateData={updateData} />
        )}
        {currentStep === 1 && (
          <StepLine data={data} updateData={updateData} />
        )}
        {currentStep === 2 && (
          <StepSchedule data={data} updateData={updateData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="md-text-button disabled:opacity-50"
        >
          Wstecz
        </button>
        
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="md-filled-button disabled:opacity-50"
          >
            Dalej
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canGoNext()}
            className="md-filled-button disabled:opacity-50"
          >
            Wyślij rozkład
          </button>
        )}
      </div>
    </div>
  );
}