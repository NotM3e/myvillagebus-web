// ============================================================
// TYPY DLA INDEXEDDB (OFFLINE STORAGE)
// ============================================================

// Linia z denormalizowanymi danymi przewoźnika
export interface OfflineLine {
  id: string;
  number: string;
  description: string | null;
  operationNote: string | null;
  // Denormalizowany przewoźnik
  carrierId: string;
  carrierName: string;
  carrierLogo: string | null;
  carrierVerified: boolean;
}

// Rozkład (schedule) - uproszczony dla offline
export interface OfflineSchedule {
  id: string;
  lineId: string;
  direction: string;
  version: number;
  status: 'pending' | 'active' | 'flagged' | 'archived';
  isIncomplete: boolean;
  isVerified: boolean;
  days: string[];
  excludesHolidays: boolean;
  netScore: number;
  firstDeparture: string | null;
  createdAt: string;
  lastModifiedAt: string;
}

// Przystanek (słownik - współdzielony między liniami)
export interface OfflineStop {
  id: string;
  city: string;
  name: string;
  isVerified: boolean;
}

// Przystanek na trasie rozkładu
export interface OfflineRouteStop {
  id: string;
  scheduleId: string;
  stopId: string;
  orderIndex: number;
  offsetMinutes: number;
}

// Kurs (godzina odjazdu)
export interface OfflineCourse {
  id: string;
  scheduleId: string;
  departureTime: string; // HH:MM:SS
  useOffsets: boolean;
}

// Ręczne godziny (gdy useOffsets = false)
export interface OfflineCourseTime {
  id: string;
  courseId: string;
  stopId: string;
  arrivalTime: string | null;
  orderIndex: number;
}

// Zapisany filtr (FAB)
export interface SavedFilter {
  id?: number; // auto-increment
  name: string;
  fromStop: { id: string; city: string; name: string } | null;
  toStop: { id: string; city: string; name: string } | null;
  days: string[] | null;
  timeFrom: string | null;
  showPending: boolean;
  carrierId: string | null;
  createdAt: string;
}

// Ustawienia aplikacji (singleton)
export interface AppSettings {
  id: 1; // zawsze 1
  showPending: boolean;
  defaultFilterId: number | null;
  syncOnlyWifi: boolean;
  syncCooldownMinutes: number;
}

// Metadane synchronizacji per linia
export interface SyncMeta {
  lineId: string;
  lastSyncAt: string; // ISO timestamp
  lastServerVersion: number; // wersja z serwera
}