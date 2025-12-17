'use client';

import { useEffect, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ConstructionIcon from '@mui/icons-material/Construction';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';

export default function PWAPage() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <PageWrapper maxWidth="max-w-2xl" className="flex items-center text-center">
      {/* Status PWA */}
      {isInstalled && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
          <p className="md-body-medium">
            ✅ Aplikacja zainstalowana! Działa w trybie offline.
          </p>
        </div>
      )}

      {/* Icon */}
      <div className="inline-flex items-center justify-center w-32 h-32 mb-6 rounded-full bg-[var(--md-sys-color-secondary-container)]">
        <ConstructionIcon 
          sx={{ fontSize: 64, color: 'var(--md-sys-color-on-secondary-container)' }} 
        />
      </div>

      {/* Heading */}
      <h1 className="md-headline-large mb-4">
        Aplikacja w budowie
      </h1>

      {/* Description */}
      <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8 max-w-lg mx-auto">
        Pracujemy nad uruchomieniem aplikacji webowej. 
        Już wkrótce będziesz mógł przeglądać rozkłady autobusów 
        bezpośrednio z przeglądarki! Pozowli to na utworzenie aplikacji internetowej na urządzeniach IOS.
      </p>

      {/* CTA */}
      <Link 
        href="/"
        className="md-filled-button inline-flex items-center gap-2 md-elevation-1"
      >
        <HomeIcon />
        Powrót do strony głównej
      </Link>

      {/* Alternative */}
      <p className="mt-6 md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
        Chcesz już teraz korzystać z aplikacji?{' '}
        <Link 
          href="/download" 
          className="text-[var(--md-sys-color-primary)] hover:underline"
        >
          Pobierz wersję na Android
        </Link>
      </p>
    </PageWrapper>
  );
}