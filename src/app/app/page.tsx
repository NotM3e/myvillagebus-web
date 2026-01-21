'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ScheduleCard from '@/components/ScheduleCard';
import { dummySchedules } from '@/data/dummy-schedules';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchedules = dummySchedules.filter(
    (schedule) =>
      schedule.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.direction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.line.includes(searchQuery)
  );

  return (
    <PageWrapper maxWidth="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="md-headline-medium">Rozkłady</h1>
        <button className="w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
          <PersonOutlineIcon sx={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <SearchIcon 
          sx={{ 
            position: 'absolute', 
            left: 12, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: 20
          }} 
        />
        <input
          type="text"
          placeholder="Szukaj przewoźnika, linii lub trasy..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
        />
      </div>

      {/* Results count */}
      <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-4">
        Znaleziono: {filteredSchedules.length} rozkładów
      </p>

      {/* Schedules list */}
      <div className="mb-20">
        {filteredSchedules.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}

        {filteredSchedules.length === 0 && (
          <div className="text-center py-12">
            <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
              Brak wyników dla "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* FAB - Add schedule */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
        <AddIcon sx={{ fontSize: 28 }} />
      </button>
    </PageWrapper>
  );
}