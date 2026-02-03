'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ScheduleCard from '@/components/ScheduleCard';
import AuthButton from '@/components/AuthButton';
import { getActiveSchedules } from '@/lib/supabase/queries';
import type { ActiveScheduleView } from '@/types/database';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [schedules, setSchedules] = useState<ActiveScheduleView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedules() {
      const data = await getActiveSchedules();
      setSchedules(data);
      setLoading(false);
    }
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.carrier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.direction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.line_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper maxWidth="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="md-headline-medium">Rozkłady</h1>
        <AuthButton />
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

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            Ładowanie rozkładów...
          </p>
        </div>
      )}

      {/* Empty state - no schedules in database */}
      {!loading && schedules.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center mx-auto mb-6">
            <DirectionsBusIcon 
              sx={{ fontSize: 40, color: 'var(--md-sys-color-on-surface-variant)' }} 
            />
          </div>
          <h2 className="md-title-large mb-2">Brak rozkładów</h2>
          <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-6">
            Bądź pierwszy! Dodaj rozkład swojego lokalnego przewoźnika.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && schedules.length > 0 && (
        <>
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-4">
            Znaleziono: {filteredSchedules.length} rozkładów
          </p>

          <div className="mb-20">
            {filteredSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}

            {filteredSchedules.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
                  Brak wyników dla "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* FAB - Add schedule */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
        <AddIcon sx={{ fontSize: 28 }} />
      </button>
    </PageWrapper>
  );
}