'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, initializeSettings } from './index';
import { downloadLine, deleteLine, isLineDownloaded } from './sync';
import type { AppSettings, OfflineSchedule, OfflineLine, OfflineStop, OfflineRouteStop } from '@/types/offline';

// ============================================================
// HOOK: useSettings
// ============================================================

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = async (updates: Partial<Omit<AppSettings, 'id'>>) => {
    if (!settings) return;
    
    const newSettings = { ...settings, ...updates };
    await db.settings.put(newSettings);
    setSettings(newSettings);
  };

  return { settings, loading, updateSettings };
}

// ============================================================
// HOOK: useDownloadedLines
// ============================================================

export function useDownloadedLines() {
  const [lines, setLines] = useState<OfflineLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.lines.toArray().then((data) => {
      setLines(data);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    const data = await db.lines.toArray();
    setLines(data);
  };

  return { lines, loading, refresh };
}

// ============================================================
// HOOK: useSavedFilters
// ============================================================

export function useSavedFilters() {
  const [filters, setFilters] = useState<Awaited<ReturnType<typeof db.savedFilters.toArray>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.savedFilters.toArray().then((data) => {
      setFilters(data);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    const data = await db.savedFilters.toArray();
    setFilters(data);
  };

  return { filters, loading, refresh };
}

// ============================================================
// HOOK: useLineDownload
// ============================================================

export function useLineDownload(lineId: string) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    isLineDownloaded(lineId).then((result) => {
      setIsDownloaded(result);
      setLoading(false);
    });
  }, [lineId]);

  const download = async () => {
    setSyncing(true);
    const result = await downloadLine(lineId);
    if (result.success) {
      setIsDownloaded(true);
    }
    setSyncing(false);
    return result;
  };

  const remove = async () => {
    setSyncing(true);
    const result = await deleteLine(lineId);
    if (result.success) {
      setIsDownloaded(false);
    }
    setSyncing(false);
    return result;
  };

  return { isDownloaded, loading, syncing, download, remove };
}

// ============================================================
// TYPY DLA OFFLINE SCHEDULES
// ============================================================

export interface OfflineScheduleWithDetails extends OfflineSchedule {
  lineNumber: string;
  lineDescription: string | null;
  lineOperationNote: string | null;
  carrierName: string;
  carrierLogo: string | null;
  carrierVerified: boolean;
}

// ============================================================
// HOOK: useOfflineSchedules
// ============================================================

interface UseOfflineSchedulesOptions {
  searchQuery?: string;
  showPending?: boolean;
}

export function useOfflineSchedules(options: UseOfflineSchedulesOptions = {}) {
  const { searchQuery = '', showPending = false } = options;
  
  const [schedules, setSchedules] = useState<OfflineScheduleWithDetails[]>([]);
  const [lines, setLines] = useState<OfflineLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  // Pobierz dane z IndexedDB
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const linesData = await db.lines.toArray();
      setLines(linesData);
      
      if (linesData.length === 0) {
        setSchedules([]);
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      // Pobierz rozkłady
      let schedulesData = await db.schedules.toArray();
      
      // Filtruj po statusie
      if (!showPending) {
        schedulesData = schedulesData.filter(s => s.status === 'active');
      } else {
        schedulesData = schedulesData.filter(s => s.status === 'active' || s.status === 'pending');
      }

      // Połącz z danymi linii
      const schedulesWithDetails: OfflineScheduleWithDetails[] = schedulesData.map(schedule => {
        const line = linesData.find(l => l.id === schedule.lineId);
        return {
          ...schedule,
          lineNumber: line?.number ?? '',
          lineDescription: line?.description ?? null,
          lineOperationNote: line?.operationNote ?? null,
          carrierName: line?.carrierName ?? '',
          carrierLogo: line?.carrierLogo ?? null,
          carrierVerified: line?.carrierVerified ?? false,
        };
      });

      // Sortuj po nazwie przewoźnika, potem po pierwszym odjeździe
      schedulesWithDetails.sort((a, b) => {
        const carrierCompare = a.carrierName.localeCompare(b.carrierName);
        if (carrierCompare !== 0) return carrierCompare;
        
        if (!a.firstDeparture) return 1;
        if (!b.firstDeparture) return -1;
        return a.firstDeparture.localeCompare(b.firstDeparture);
      });

      setSchedules(schedulesWithDetails);
      setIsEmpty(false);
      setLoading(false);
    }

    fetchData();
  }, [showPending]);

  // Filtrowanie po searchQuery (memoized)
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) {
      return schedules;
    }

    const query = searchQuery.toLowerCase();
    return schedules.filter(schedule => 
      schedule.carrierName.toLowerCase().includes(query) ||
      schedule.direction.toLowerCase().includes(query) ||
      schedule.lineNumber.toLowerCase().includes(query)
    );
  }, [schedules, searchQuery]);

  const refresh = async () => {
    setLoading(true);
    const linesData = await db.lines.toArray();
    setLines(linesData);
    
    if (linesData.length === 0) {
      setSchedules([]);
      setIsEmpty(true);
      setLoading(false);
      return;
    }

    let schedulesData = await db.schedules.toArray();
    
    if (!showPending) {
      schedulesData = schedulesData.filter(s => s.status === 'active');
    }

    const schedulesWithDetails: OfflineScheduleWithDetails[] = schedulesData.map(schedule => {
      const line = linesData.find(l => l.id === schedule.lineId);
      return {
        ...schedule,
        lineNumber: line?.number ?? '',
        lineDescription: line?.description ?? null,
        lineOperationNote: line?.operationNote ?? null,
        carrierName: line?.carrierName ?? '',
        carrierLogo: line?.carrierLogo ?? null,
        carrierVerified: line?.carrierVerified ?? false,
      };
    });

    schedulesWithDetails.sort((a, b) => {
      const carrierCompare = a.carrierName.localeCompare(b.carrierName);
      if (carrierCompare !== 0) return carrierCompare;
      if (!a.firstDeparture) return 1;
      if (!b.firstDeparture) return -1;
      return a.firstDeparture.localeCompare(b.firstDeparture);
    });

    setSchedules(schedulesWithDetails);
    setIsEmpty(false);
    setLoading(false);
  };

  return {
    schedules: filteredSchedules,
    allSchedules: schedules,
    lines,
    loading,
    isEmpty, // true = brak pobranych linii
    refresh,
  };
}

// ============================================================
// HOOK: useScheduleStops (przystanki dla rozkładu)
// ============================================================

export interface StopWithOrder {
  id: string;
  city: string;
  name: string;
  orderIndex: number;
  offsetMinutes: number;
}

export function useScheduleStops(scheduleId: string | null) {
  const [stops, setStops] = useState<StopWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scheduleId) {
      setStops([]);
      setLoading(false);
      return;
    }

    const id = scheduleId;

    async function fetchStops() {
      setLoading(true);
      
      // Pobierz route_stops dla tego schedule
      const routeStops = await db.routeStops
        .where('scheduleId')
        .equals(id)
        .toArray();

      if (routeStops.length === 0) {
        setStops([]);
        setLoading(false);
        return;
      }

      // Pobierz dane przystanków
      const stopIds = routeStops.map(rs => rs.stopId);
      const stopsData = await db.stops.bulkGet(stopIds);

      // Połącz i posortuj
      const stopsWithOrder: StopWithOrder[] = routeStops
        .map(rs => {
          const stop = stopsData.find(s => s?.id === rs.stopId);
          return stop ? {
            id: stop.id,
            city: stop.city,
            name: stop.name,
            orderIndex: rs.orderIndex,
            offsetMinutes: rs.offsetMinutes,
          } : null;
        })
        .filter((s): s is StopWithOrder => s !== null)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      setStops(stopsWithOrder);
      setLoading(false);
    }

    fetchStops();
  }, [scheduleId]);

  return { stops, loading };
}