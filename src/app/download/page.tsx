// src/app/download/page.tsx
import Link from 'next/link';
import DownloadIcon from '@mui/icons-material/Download';
import AndroidIcon from '@mui/icons-material/Android';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function DownloadPage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto pt-12">
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
        <div className="md-card md-elevation-3 p-8 mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-[var(--md-sys-color-primary-container)]">
            <DownloadIcon 
              sx={{ fontSize: 40, color: 'var(--md-sys-color-on-primary-container)' }} 
            />
          </div>
          
          <h2 className="md-headline-medium mb-4">
            Mój Wsiobus v0.3.0
          </h2>
          
          <a
            href="/apk/myvillagebus-v0.3.apk"
            download
            className="md-filled-button inline-flex items-center gap-2 md-elevation-1 mb-4"
          >
            <DownloadIcon />
            Pobierz APK (20 MB)
          </a>
          
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
            Kompatybilne z Android 10.0+
          </p>
        </div>

        {/* Installation Instructions */}
        <div className="md-card md-elevation-1 p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <InfoOutlinedIcon sx={{ color: 'var(--md-sys-color-primary)' }} />
            <h3 className="md-title-large">Instrukcja instalacji</h3>
          </div>
          
          <ol className="space-y-3 md-body-medium text-[var(--md-sys-color-on-surface-variant)] pl-4">
            <li className="flex gap-3">
              <span className="font-bold text-[var(--md-sys-color-primary)]">1.</span>
              <span>Pobierz plik APK</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[var(--md-sys-color-primary)]">2.</span>
              <span>Otwórz plik w menedżerze plików</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[var(--md-sys-color-primary)]">3.</span>
              <span>Zezwól na instalację z nieznanych źródeł (jeśli wymagane)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[var(--md-sys-color-primary)]">4.</span>
              <span>Zainstaluj aplikację</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[var(--md-sys-color-primary)]">5.</span>
              <span>Gotowe!</span>
            </li>
          </ol>
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
      </div>
    </main>
  );
}