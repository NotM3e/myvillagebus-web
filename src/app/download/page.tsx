import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import DownloadIcon from '@mui/icons-material/Download';
import AndroidIcon from '@mui/icons-material/Android';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pobierz Wsiobus na Android | Aplikacja rozkładów autobusów",
  description: "Pobierz darmową aplikację Wsiobus v0.3 (42 MB) na Androida. Rozkłady lokalnych autobusów offline. Wersja web PWA wkrótce także na iOS.",
  openGraph: {
    title: "Pobierz Wsiobus na Android",
    description: "Darmowa aplikacja do rozkładów lokalnych przewoźników. Działa offline.",
    url: "https://wsiobus.pl/download",
    siteName: "Wsiobus",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pobierz Wsiobus na Android",
  },
};

export default function DownloadPage() {
  const APP_VERSION = "0.3";
  const APK_SIZE = "42 MB";

  const APK_URL = `https://github.com/NotM3e/myVillageBus/releases/download/v${APP_VERSION}/myvillagebus-v${APP_VERSION}.apk`;

  return (
    <PageWrapper maxWidth="max-w-3xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-[var(--md-sys-color-tertiary-container)]">
          <AndroidIcon 
            sx={{ fontSize: 48, color: 'var(--md-sys-color-on-tertiary-container)' }} 
          />
        </div>
        
        <h1 className="md-headline-large mb-4">
          Pobierz aplikację Android
        </h1>
        
        <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
          Najnowsza wersja aplikacji Mój Wsiobus dla Androida
        </p>
      </div>

      {/* Download Card */}
      <div className="p-8 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-[var(--md-sys-color-primary-container)]">
          <DownloadIcon 
            sx={{ fontSize: 40, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
        </div>
        
        <h2 className="md-headline-medium mb-4">
          Mój Wsiobus v{APP_VERSION}
        </h2>
        
        <a
          href={APK_URL}
          download={`myvillagebus-v${APP_VERSION}.apk`}
          className="md-filled-button inline-flex items-center gap-2 md-elevation-1 mb-4"
        >
          <DownloadIcon />
          Pobierz APK ({APK_SIZE})
        </a>
        
        <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
          Kompatybilne z Android 10.0+
        </p>
      </div>

      {/* Why Web Version */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
        <p className="md-body-medium">
          ⚠️ Aplikacja jest wersją demo usługi jaką jest ten projekt. Całość będzie działało na aplikacji przeglądarkowej dostępnej na każdym urządzeniu, a planowany termin publikacji usługi to kwiecień 2026.
        </p>
      </div>

      <div className="md-card md-elevation-1 p-6 mb-8">
        <h3 className="md-title-large mb-4">
          Czemu przenosimy to do przeglądarki?
        </h3>
        
        <ul className="space-y-3 md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
          <li className="flex gap-3">
            <span><strong>Jedno miejsce, wszystkie urządzenia:</strong> Android, iOS, komputer - zainstaluj PWA i masz ikonę na ekranie głównym</span>
          </li>
          <li className="flex gap-3">
            <span><strong>Szybsze aktualizacje:</strong> Poprawki wchodzą od razu, nie czekasz na sklep Google Play</span>
          </li>
          <li className="flex gap-3">
            <span><strong>Automatyczna synchronizacja:</strong> Zmiany w rozkładach pojawiają się u wszystkich natychmiast</span>
          </li>
        </ul>
      </div>

      {/* What works now */}
      <div className="md-card md-elevation-1 p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <InfoOutlinedIcon sx={{ color: 'var(--md-sys-color-primary)' }} />
          <h3 className="md-title-large">Co już działa?</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="md-label-large mb-2">✅ Dostępne teraz:</p>
            <ul className="md-list md-list-disc space-y-1 md-body-medium text-[var(--md-sys-color-on-surface-variant)] ml-3 pl-6">
              <li>Przeglądanie rozkładów</li>
              <li>Filtrowanie po dniach i godzinach</li>
              <li>Profile filtrów (zapisywanie ulubionych tras)</li>
              <li>Tryb offline</li>
            </ul>
          </div>
          
          <div>
            <p className="md-label-large mb-2">🚧 W wersji web:</p>
            <ul className="md-list md-list-disc space-y-1 md-body-medium text-[var(--md-sys-color-on-surface-variant)] ml-3 pl-6">
              <li>Tworzenie rozkładów przez użytkowników</li>
              <li>System głosowania i reputacji</li>
              <li>Wsparcie dla iOS (PWA)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Link 
          href="/"
          className="md-outlined-button inline-flex items-center gap-2"
        >
          <HomeIcon />
          Powrót do strony głównej
        </Link>
      </div>
    </PageWrapper>
  );
}