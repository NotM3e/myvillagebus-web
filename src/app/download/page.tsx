import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import DownloadIcon from '@mui/icons-material/Download';
import AndroidIcon from '@mui/icons-material/Android';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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
      <div className="md-card md-elevation-3 p-8 mb-8 text-center">
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

      {/* About app */}
      <div className="md-card md-elevation-1 p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <InfoOutlinedIcon sx={{ color: 'var(--md-sys-color-primary)' }} />
          <h3 className="md-title-large">Wsparcie aplikacji</h3>
        </div>
          <p className='space-y-3 md-body-medium text-[var(--md-sys-color-on-surface-variant)] pl-4'>Aplikacja jest wersją demo usługi jaką jest ten projekt. Całość będzie działało na aplikacji przeglądarkowej dostępnej na każdym urządzeniu, a planowany termin publikacji usługi to kwiecień 2026.</p>
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