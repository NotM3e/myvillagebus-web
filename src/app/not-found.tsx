import Link from 'next/link';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-32 h-32 mb-6 rounded-full bg-[var(--md-sys-color-error-container)]">
          <ErrorOutlineIcon 
            sx={{ fontSize: 64, color: 'var(--md-sys-color-on-error-container)' }} 
          />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-bold text-[var(--md-sys-color-primary)] mb-4">
          404
        </h1>

        {/* Heading */}
        <h2 className="md-headline-medium mb-4">
          Strona nie znaleziona
        </h2>

        {/* Description */}
        <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8 max-w-lg mx-auto">
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona.
        </p>

        {/* CTA */}
        <Link 
          href="/"
          className="md-filled-button inline-flex items-center gap-2 md-elevation-1"
        >
          <HomeIcon />
          Powrót do strony głównej
        </Link>

        {/* Additional Links */}
        <div className="mt-8 flex justify-center gap-6">
          <Link 
            href="/download" 
            className="md-body-medium text-[var(--md-sys-color-primary)] hover:underline"
          >
            Pobierz aplikację
          </Link>
          <span className="text-[var(--md-sys-color-outline)]">•</span>
          <Link 
            href="/contact" 
            className="md-body-medium text-[var(--md-sys-color-primary)] hover:underline"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </main>
  );
}