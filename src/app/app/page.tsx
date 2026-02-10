'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import OfflineScheduleCard from '@/components/OfflineScheduleCard';
import { useOfflineSchedules, useSettings } from '@/lib/db/hooks';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import Link from 'next/link';

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useSettings();
  
  const { 
    schedules, 
    loading, 
    isEmpty 
  } = useOfflineSchedules({ 
    searchQuery,
    showPending: settings?.showPending ?? false,
  });

   return (
    <PageWrapper maxWidth="max-w-2xl">

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

      {/* Empty state - no downloaded lines */}
      {!loading && isEmpty && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center mx-auto mb-6">
            <CloudDownloadIcon 
              sx={{ fontSize: 40, color: 'var(--md-sys-color-on-surface-variant)' }} 
            />
          </div>
          <h2 className="md-title-large mb-2">Brak pobranych linii</h2>
          <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-6">
            Pobierz linie autobusowe, aby przeglądać rozkłady offline.
          </p>
          <Link 
            href="/app/browse"
            className="md-filled-button inline-flex items-center gap-2"
          >
            <CloudDownloadIcon sx={{ fontSize: 20 }} />
            Przeglądaj dostępne linie
          </Link>
        </div>
      )}

      {/* Results */}
      {!loading && !isEmpty && (
        <>
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-4">
            Znaleziono: {schedules.length} rozkładów
          </p>

          <div className="mb-20">
            {schedules.map((schedule) => (
              <OfflineScheduleCard key={schedule.id} schedule={schedule} />
            ))}

            {schedules.length === 0 && searchQuery && (
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