'use client';

import { useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckIcon from '@mui/icons-material/Check';

const DAYS_OF_WEEK = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'] as const;

interface ActionStripProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  showPending: boolean;
  onShowPendingChange: (show: boolean) => void;
  timeFilter: 'all' | 'now' | 'custom';
  onTimeFilterChange: (filter: 'all' | 'now' | 'custom') => void;
}

export default function ActionStrip({
  selectedDays,
  onDaysChange,
  showPending,
  onShowPendingChange,
  timeFilter,
  onTimeFilterChange,
}: ActionStripProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Pobierz aktualny dzień tygodnia (0 = niedziela, 1 = poniedziałek...)
  const getCurrentDayName = () => {
    const dayIndex = new Date().getDay();
    // Konwersja: JS ma niedzielę jako 0, my mamy Pon jako 0
    const polishDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_OF_WEEK[polishDayIndex];
  };

  const handleNowClick = () => {
    if (timeFilter === 'now') {
      // Toggle off - reset to all days
      onDaysChange([...DAYS_OF_WEEK]);
      onTimeFilterChange('all');
    } else {
      // Toggle on - set current day + now filter
      const today = getCurrentDayName();
      onDaysChange([today]);
      onTimeFilterChange('now');
    }
    setShowDayPicker(false);
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      // Usuń dzień (ale zostaw przynajmniej jeden)
      if (selectedDays.length > 1) {
        onDaysChange(selectedDays.filter(d => d !== day));
      }
    } else {
      onDaysChange([...selectedDays, day]);
    }
    onTimeFilterChange('all');
  };

  const handleQuickDays = (preset: 'weekdays' | 'weekend' | 'all') => {
    switch (preset) {
      case 'weekdays':
        onDaysChange(['Pon', 'Wt', 'Śr', 'Czw', 'Pt']);
        break;
      case 'weekend':
        onDaysChange(['Sob', 'Nd']);
        break;
      case 'all':
        onDaysChange([...DAYS_OF_WEEK]);
        break;
    }
    onTimeFilterChange('all');
    setShowDayPicker(false);
  };

  const getDaysLabel = () => {
    if (selectedDays.length === 7) return 'Wszystkie dni';
    if (selectedDays.length === 5 && 
        selectedDays.includes('Pon') && 
        selectedDays.includes('Pt') &&
        !selectedDays.includes('Sob')) {
      return 'Dni robocze';
    }
    if (selectedDays.length === 2 && 
        selectedDays.includes('Sob') && 
        selectedDays.includes('Nd')) {
      return 'Weekend';
    }
    if (selectedDays.length === 1) return selectedDays[0];
    return `${selectedDays.length} dni`;
  };

  return (
    <div className="mb-4">
      {/* Main action buttons - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Teraz */}
        <button
          onClick={handleNowClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            timeFilter === 'now'
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
              : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          <AccessTimeIcon sx={{ fontSize: 18 }} />
          <span className="md-label-large">Teraz</span>
        </button>

        {/* Dzień */}
        <button
          onClick={() => setShowDayPicker(!showDayPicker)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            showDayPicker
              ? 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]'
              : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          <TodayIcon sx={{ fontSize: 18 }} />
          <span className="md-label-large">{getDaysLabel()}</span>
        </button>

        {/* Kalendarz - placeholder */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] opacity-50"
        >
          <CalendarMonthIcon sx={{ fontSize: 18 }} />
          <span className="md-label-large">Kalendarz</span>
        </button>

        {/* Pending toggle */}
        <button
          onClick={() => onShowPendingChange(!showPending)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            showPending
              ? 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]'
              : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          <PendingActionsIcon sx={{ fontSize: 18 }} />
          <span className="md-label-large">Pending</span>
        </button>
      </div>

      {/* Day picker dropdown */}
      {showDayPicker && (
        <div className="mt-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-variant)]">
          {/* Quick presets */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleQuickDays('weekdays')}
              className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              Dni robocze
            </button>
            <button
              onClick={() => handleQuickDays('weekend')}
              className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              Weekend
            </button>
            <button
              onClick={() => handleQuickDays('all')}
              className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              Wszystkie
            </button>
          </div>

          {/* Individual days */}
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDayToggle(day)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {isSelected ? (
                    <CheckIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <span className="md-label-large">{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}