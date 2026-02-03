import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function AuthErrorPage() {
  return (
    <PageWrapper maxWidth="max-w-md" className="flex items-center text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center mb-6 mx-auto">
        <ErrorOutlineIcon sx={{ fontSize: 40, color: 'var(--md-sys-color-on-error-container)' }} />
      </div>
      
      <h1 className="md-headline-medium mb-4">Błąd logowania</h1>
      
      <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8">
        Nie udało się zalogować. Spróbuj ponownie.
      </p>
      
      <Link href="/app" className="md-filled-button">
        Powrót do aplikacji
      </Link>
    </PageWrapper>
  );
}