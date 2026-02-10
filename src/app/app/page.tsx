'use client';

import { useState, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ActionStrip from '@/components/ActionStrip';
import OfflineScheduleCard from '@/components/OfflineScheduleCard';
import StopSearch from '@/components/StopSearch';
import SaveFilterDialog from '@/components/SaveFilterDialog';
import type { OfflineStop } from '@/types/offline';
import { useOfflineSchedules, saveFilter } from '@/lib/db/hooks';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import Link from 'next/link';

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']);
  const [showPending, setShowPending] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'now' | 'custom'>('all');
  const [fromStop, setFromStop] = useState<OfflineStop | null>(null);
  const [toStop, setToStop] = useState<OfflineStop | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { 
    schedules: allSchedules, 
    loading, 
    isEmpty 
  } = useOfflineSchedules({ 
    searchQuery,
    showPending,
  });

  // Filtrowanie
  const filteredSchedules = useMemo(() => {
    let result = allSchedules;

    // Filtr dni
    if (selectedDays.length < 7) {
      result = result.filter(schedule => 
        schedule.days.some(day => selectedDays.includes(day))
      );
    }

    // Filtr "Teraz" - pokaż tylko kursy z najbliższą godziną
    if (timeFilter === 'now') {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      result = result.filter(schedule => {
        if (!schedule.firstDeparture) return false;
        const departure = schedule.firstDeparture.slice(0, 5);
        return departure >= currentTime || 
               (currentTime <= '23:59' && departure >= '00:00' && departure <= '04:00');
      });

      result.sort((a, b) => {
        if (!a.firstDeparture) return 1;
        if (!b.firstDeparture) return -1;
        return a.firstDeparture.localeCompare(b.firstDeparture);
      });
    }

    // TODO: Filtr po przystankach (fromStop, toStop)
    // Wymaga sprawdzenia route_stops dla każdego schedule
    // Na razie tylko logujemy że filtry są ustawione
    if (fromStop || toStop) {
      console.log('Stop filters:', { from: fromStop?.city, to: toStop?.city });
    }

    return result;
  }, [allSchedules, selectedDays, timeFilter, fromStop, toStop]);

  
  const handleSaveFilter = async (name: string) => {
    await saveFilter({
      name,
      fromStop: fromStop?.city ?? null,
      toStop: toStop?.city ?? null,
      days: selectedDays.length < 7 ? selectedDays : null,
      carrierId: null, // TODO: dodać filtr przewoźnika
    });
    setShowSaveDialog(false);
  };

  const canSaveFilter = fromStop || toStop || selectedDays.length < 7;

  return (
    <PageWrapper maxWidth="max-w-2xl">
      {/* Stop Search */}
      <div className="mt-4">
        <StopSearch
          fromStop={fromStop}
          toStop={toStop}
          onFromChange={setFromStop}
          onToChange={setToStop}
        />
      </div>
      
      {/* Action Strip */}
      <ActionStrip
        selectedDays={selectedDays}
        onDaysChange={setSelectedDays}
        showPending={showPending}
        onShowPendingChange={setShowPending}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

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
            Znaleziono: {filteredSchedules.length} rozkładów
          </p>

          <div className="mb-20">
            {filteredSchedules.map((schedule) => (
              <OfflineScheduleCard key={schedule.id} schedule={schedule} />
            ))}

            {filteredSchedules.length === 0 && (
              <div className="text-center py-12">
                <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
                  {searchQuery 
                    ? `Brak wyników dla "${searchQuery}"`
                    : 'Brak rozkładów dla wybranych filtrów'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* FAB - Save filter */}
      <button 
        onClick={() => setShowSaveDialog(true)}
        disabled={!canSaveFilter}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        title={canSaveFilter ? 'Zapisz trasę' : 'Ustaw filtry aby zapisać'}
      >
        <AddIcon sx={{ fontSize: 28 }} />
      </button>

      {/* Save Filter Dialog */}
      <SaveFilterDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFilter}
        defaultName={fromStop && toStop ? `${fromStop.city} → ${toStop.city}` : ''}
      />
    </PageWrapper>
  );
}