import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wsiobus - Rozkłady małych przewoźników | Aplikacja PWA",
  description: "Rozkłady lokalnych autobusów w jednym miejscu. Działa offline, tworzone przez społeczność. Dla Androida i iOS (PWA). Darmowa aplikacja bez reklam.",
  keywords: "rozkład autobusów, przewoźnicy lokalni, aplikacja autobusowa, offline, PWA, rozkład jazdy",
  authors: [{ name: "myVillageBus" }],
  openGraph: {
    title: "Wsiobus - Rozkłady małych przewoźników",
    description: "Rozkłady lokalnych autobusów zawsze pod ręką. Offline, społecznościowe, darmowe.",
    url: "https://wsiobus.pl",
    siteName: "Wsiobus",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wsiobus - Rozkłady małych przewoźników",
    description: "Rozkłady lokalnych autobusów zawsze pod ręką. Offline, społecznościowe, darmowe.",
  },
};

import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DownloadIcon from '@mui/icons-material/Download';
import WebIcon from '@mui/icons-material/Web';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SortIcon from '@mui/icons-material/Sort';
import SaveIcon from '@mui/icons-material/Save';

export default function Home() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="text-center mb-16 pt-12">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-[var(--md-sys-color-primary-container)]">
          <DirectionsBusIcon 
            sx={{ fontSize: 48, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
        </div>
        
        <h1 className="md-headline-large text-[var(--md-sys-color-on-background)] mb-4">
          Mój Wsiobus
        </h1>

        <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] max-w-2xl mx-auto mb-8">
          Rozkłady małych przewoźników w jednym miejscu.<br/>
          Bez szukania zdjęć w galerii, bez pytania znajomych - po prostu otwierasz i jedziesz.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/download"
            className="md-filled-button inline-flex items-center gap-2 md-elevation-1"
          >
            <DownloadIcon />
            Pobierz na Android
          </Link>
          
          <Link 
            href="/app"
            className="md-outlined-button inline-flex items-center gap-2"
          >
            <WebIcon />
            Otwórz aplikację web
          </Link>
        </div>
      </div>

      {/* Comunity section */}
      <div className="md-card md-elevation-3 max-w-3xl mx-auto mb-8">
        <div className="p-8">
          <h2 className="md-headline-medium mb-4 text-center">
            Rozkłady tworzy społeczność
          </h2>
          <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] text-center">
            Nie musisz czekać aż przewoźnik zrobi aplikację.<br/>
            Ktoś dodaje rozkład, inni sprawdzają czy się zgadza, wszyscy korzystają.<br/>
            To jak Wikipedia dla autobusów - każdy może pomóc,
            a system reputacji dba o jakość.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-primary-container)]">
              <FlashOnIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-primary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Zawsze offline</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Pobierz rozkład raz - działa bez internetu.<br/>
              Nie musisz mieć zasięgu na przystanku.
            </p>
          </div>
          
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-secondary-container)]">
              <CloudOffIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-secondary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Tworzysz co potrzebujesz</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Nie ma Twojego rozkładu? Dodaj go.
              Zmienił się na wakacje? Popraw.
              Masz kontrolę.
            </p>
          </div>
          
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-tertiary-container)]">
              <SortIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-tertiary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Społeczność pilnuje jakości</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Głosuj za dobrymi rozkładami, zgłaszaj błędy.
              Im więcej pomagasz, tym więcej możesz -
              zaufani użytkownicy omijają moderację.
            </p>
          </div>

          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-tertiary-container)]">
              <SaveIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-tertiary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Zapisuj ulubione trasy</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Stwórz profil filtrów dla regularnych przejazdów.
              "Dom-praca w dni powszednie" - jeden klik
              i widzisz tylko to co Cię interesuje.
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-3xl mx-auto">
        <div className="p-8">
          <h2 className="md-headline-medium mb-4 text-center">
            O Projekcie
          </h2>
          <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] text-center">
            Amatorski projekt stworzony w celu rozwijania umiejętności programowania i jednocześnie pomagający złapać się na autobus.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <Link 
            href="/contact" 
            className="md-body-medium text-[var(--md-sys-color-primary)] hover:underline"
          >
            Kontakt
          </Link>
          <span className="text-[var(--md-sys-color-outline)]">•</span>
          <Link 
            href="/download" 
            className="md-body-medium text-[var(--md-sys-color-primary)] hover:underline"
          >
            Pobierz
          </Link>
        </div>
        <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
          © 2025 - Projekt niekomercyjny.
        </p>
      </footer>
    </PageWrapper>
  );
}