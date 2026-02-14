'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useDownloadedLines, useAllSyncMeta } from '@/lib/db/hooks';
import { downloadLine, deleteLine } from '@/lib/db/sync';
import { getAllLinesBasic } from '@/lib/supabase/queries';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Link from 'next/link';

interface CloudLine {
  id: string;
  number: string;
  description: string | null;
  carrier: {
    id: string;
    name: string;
    is_verified: boolean;
  };
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'przed chwila';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;
  
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export default function BrowsePage() {
  const [activeTab, setActiveTab] = useState<'downloaded' | 'available'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudLines, setCloudLines] = useState<CloudLine[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(true);
  const [syncingLineId, setSyncingLineId] = useState<string | null>(null);

  const { lines: downloadedLines, loading: loadingDownloaded, refresh } = useDownloadedLines();
  const { syncMetas } = useAllSyncMeta();

  // Pobierz liste linii z chmury
  useEffect(() => {
    getAllLinesBasic().then((data) => {
      const normalized = data.map((line: any) => ({
        ...line,
        carrier: Array.isArray(line.carrier) ? line.carrier[0] : line.carrier,
      }));
      setCloudLines(normalized);
      setLoadingCloud(false);
    });
  }, []);

  // Filtruj linie
  const filteredCloudLines = cloudLines.filter((line) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      line.carrier.name.toLowerCase().includes(query) ||
      line.number.toLowerCase().includes(query) ||
      (line.description?.toLowerCase().includes(query) ?? false)
    );
  });

  const filteredDownloadedLines = downloadedLines.filter((line) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      line.carrierName.toLowerCase().includes(query) ||
      line.number.toLowerCase().includes(query) ||
      (line.description?.toLowerCase().includes(query) ?? false)
    );
  });

  // Grupuj po przewozniku
  const groupedCloudLines = filteredCloudLines.reduce((acc, line) => {
    const carrierName = line.carrier.name;
    if (!acc[carrierName]) {
      acc[carrierName] = {
        carrier: line.carrier,
        lines: [],
      };
    }
    acc[carrierName].lines.push(line);
    return acc;
  }, {} as Record<string, { carrier: CloudLine['carrier']; lines: CloudLine[] }>);

  const groupedDownloadedLines = filteredDownloadedLines.reduce((acc, line) => {
    const carrierName = line.carrierName;
    if (!acc[carrierName]) {
      acc[carrierName] = {
        carrierVerified: line.carrierVerified,
        lines: [],
      };
    }
    acc[carrierName].lines.push(line);
    return acc;
  }, {} as Record<string, { carrierVerified: boolean; lines: typeof downloadedLines }>);

  // Sprawdz czy linia jest pobrana
  const isDownloaded = (lineId: string) => {
    return downloadedLines.some((l) => l.id === lineId);
  };

  // Pobierz sync meta dla linii
  const getSyncMeta = (lineId: string) => {
    return syncMetas.find((m) => m.lineId === lineId);
  };

  // Pobierz linie
  const handleDownload = async (lineId: string) => {
    setSyncingLineId(lineId);
    await downloadLine(lineId);
    await refresh();
    window.dispatchEvent(new Event('lines-updated'));
    setSyncingLineId(null);
  };

  // Odswiez linie
  const handleRefresh = async (lineId: string) => {
    setSyncingLineId(lineId);
    await downloadLine(lineId); // downloadLine nadpisuje istniejace dane
    await refresh();
    window.dispatchEvent(new Event('lines-updated'));
    setSyncingLineId(null);
  };

  // Usun linie
  const handleDelete = async (lineId: string) => {
    setSyncingLineId(lineId);
    await deleteLine(lineId);
    await refresh();
    window.dispatchEvent(new Event('lines-updated'));
    setSyncingLineId(null);
  };

  return (
    <PageWrapper maxWidth="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/app"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
        >
          <ArrowBackIcon sx={{ color: 'var(--md-sys-color-on-surface)' }} />
        </Link>
        <h1 className="md-title-large">Zarzadzaj liniami</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-3 px-4 rounded-full md-label-large transition-colors ${
            activeTab === 'available'
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
              : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          Do pobrania
        </button>
        <button
          onClick={() => setActiveTab('downloaded')}
          className={`flex-1 py-3 px-4 rounded-full md-label-large transition-colors ${
            activeTab === 'downloaded'
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
              : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          Pobrane ({downloadedLines.length})
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
          placeholder="Szukaj przewoznika lub linii..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
        />
      </div>

      {/* Available Lines Tab */}
      {activeTab === 'available' && (
        <>
          {loadingCloud ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
                Ladowanie linii...
              </p>
            </div>
          ) : Object.keys(groupedCloudLines).length === 0 ? (
            <div className="text-center py-12">
              <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
                {searchQuery ? `Brak wynikow dla "${searchQuery}"` : 'Brak dostepnych linii'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCloudLines).map(([carrierName, { carrier, lines }]) => (
                <div key={carrierName}>
                  {/* Carrier header */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="md-title-medium">{carrierName}</h2>
                    {carrier.is_verified && (
                      <VerifiedIcon sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }} />
                    )}
                  </div>
                  
                  {/* Lines */}
                  <div className="space-y-2">
                    {lines.map((line) => {
                      const downloaded = isDownloaded(line.id);
                      const syncing = syncingLineId === line.id;
                      
                      return (
                        <div 
                          key={line.id}
                          className="md-card md-elevation-1 p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="md-title-small">Linia {line.number}</p>
                            {line.description && (
                              <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
                                {line.description}
                              </p>
                            )}
                          </div>
                          
                          {downloaded ? (
                            <div className="flex items-center gap-1 text-[var(--md-sys-color-primary)]">
                              <CheckCircleIcon sx={{ fontSize: 20 }} />
                              <span className="md-label-medium">Pobrano</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDownload(line.id)}
                              disabled={syncing}
                              className="md-filled-button flex items-center gap-2 py-2 px-4"
                            >
                              {syncing ? (
                                <div className="w-5 h-5 border-2 border-[var(--md-sys-color-on-primary)] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CloudDownloadIcon sx={{ fontSize: 20 }} />
                              )}
                              Pobierz
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Downloaded Lines Tab */}
      {activeTab === 'downloaded' && (
        <>
          {loadingDownloaded ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            </div>
          ) : Object.keys(groupedDownloadedLines).length === 0 ? (
            <div className="text-center py-12">
              <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
                {searchQuery ? `Brak wynikow dla "${searchQuery}"` : 'Brak pobranych linii'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab('available')}
                  className="md-text-button mt-4"
                >
                  Przejdz do dostepnych linii
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDownloadedLines).map(([carrierName, { carrierVerified, lines }]) => (
                <div key={carrierName}>
                  {/* Carrier header */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="md-title-medium">{carrierName}</h2>
                    {carrierVerified && (
                      <VerifiedIcon sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }} />
                    )}
                  </div>
                  
                  {/* Lines */}
                  <div className="space-y-2">
                    {lines.map((line) => {
                      const syncing = syncingLineId === line.id;
                      const meta = getSyncMeta(line.id);
                      
                      return (
                        <div 
                          key={line.id}
                          className="md-card md-elevation-1 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="md-title-small">Linia {line.number}</p>
                              {line.description && (
                                <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
                                  {line.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Sync info + actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                            {/* Last sync */}
                            {meta && (
                              <div className="flex items-center gap-1 text-[var(--md-sys-color-on-surface-variant)]">
                                <AccessTimeIcon sx={{ fontSize: 14 }} />
                                <span className="md-body-small">
                                  {formatRelativeTime(meta.lastSyncAt)}
                                </span>
                              </div>
                            )}
                            
                            {!meta && <div />}
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRefresh(line.id)}
                                disabled={syncing}
                                className="md-text-button flex items-center gap-1 text-sm"
                                title="Odswiez dane"
                              >
                                {syncing ? (
                                  <div className="w-4 h-4 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <RefreshIcon sx={{ fontSize: 18 }} />
                                )}
                                Odswiez
                              </button>
                              
                              <button
                                onClick={() => handleDelete(line.id)}
                                disabled={syncing}
                                className="md-text-button flex items-center gap-1 text-sm text-[var(--md-sys-color-error)]"
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                Usun
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}