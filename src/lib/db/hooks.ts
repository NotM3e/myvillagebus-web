'use client';

import { useState, useEffect } from 'react';
import { db, initializeSettings } from './index';
import type { AppSettings } from '@/types/offline';

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
  const [lines, setLines] = useState<Awaited<ReturnType<typeof db.lines.toArray>>>([]);
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

import { downloadLine, deleteLine, isLineDownloaded } from './sync';

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