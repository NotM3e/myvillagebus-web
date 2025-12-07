// src/app/page.tsx
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl mx-auto w-full">
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
            Rozkłady autobusów zawsze pod ręką dla nie wielkich przewoźników
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

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-16">
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-primary-container)]">
              <FlashOnIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-primary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Szybkie</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Natychmiastowy dostęp do rozkładów bez czekania
            </p>
          </div>
          
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-secondary-container)]">
              <CloudOffIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-secondary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Offline</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Działa bez internetu - dane zapisane lokalnie
            </p>
          </div>
          
          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-tertiary-container)]">
              <SortIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-tertiary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Filtorwanie</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Filtorwanie rozkładów wedle własnych preferencji
            </p>
          </div>

          <div className="md-card md-elevation-1 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--md-sys-color-tertiary-container)]">
              <SaveIcon 
                sx={{ fontSize: 32, color: 'var(--md-sys-color-on-tertiary-container)' }} 
              />
            </div>
            <h3 className="md-title-large mb-2">Zapisywanie profii filtrów</h3>
            <p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              Używasz wielu rozkładów? Możesz je profilować aby łatwiej złapać się na autobus
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="md-card md-elevation-2 max-w-3xl mx-auto p-8">
          <h2 className="md-headline-medium mb-4 text-center">
            O Projekcie
          </h2>
          <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] text-center">
            Amatorski projekt stworzony w celu rozwijania umiejętności programowania i jednocześnie pomagający złapać się na autobus.
          </p>
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
      </div>
    </main>
  );
}