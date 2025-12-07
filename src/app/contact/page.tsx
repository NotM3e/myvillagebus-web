'use client';

import { useState } from 'react';
import Link from 'next/link';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-[var(--md-sys-color-secondary-container)]">
            <EmailIcon 
              sx={{ fontSize: 48, color: 'var(--md-sys-color-on-secondary-container)' }} 
            />
          </div>
          
          <h1 className="md-headline-large mb-4">
            Kontakt
          </h1>
          
          <p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
            Masz pytania? Napisz do mnie!
          </p>
        </div>

        {/* Contact Form */}
        <div className="md-card md-elevation-2 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input 
              type="hidden" 
              name="access_key" 
              value="b32c3e2c-1326-49c6-b6fe-a6f960867882" 
            />

            {/* Name Field */}
            <div>
              <label 
                htmlFor="name" 
                className="block md-body-medium text-[var(--md-sys-color-on-surface)] mb-2"
              >
                Imię
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:outline-none transition"
              />
            </div>

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block md-body-medium text-[var(--md-sys-color-on-surface)] mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:outline-none transition"
              />
            </div>

            {/* Message Field */}
            <div>
              <label 
                htmlFor="message" 
                className="block md-body-medium text-[var(--md-sys-color-on-surface)] mb-2"
              >
                Wiadomość
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full px-4 py-3 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:outline-none transition resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full md-filled-button inline-flex items-center justify-center gap-2 md-elevation-1 disabled:opacity-50"
            >
              <SendIcon />
              {status === 'sending' ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            </button>

            {/* Success Message */}
            {status === 'success' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
                <CheckCircleIcon />
                <span className="md-body-medium">Wiadomość wysłana pomyślnie!</span>
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
                <ErrorIcon />
                <span className="md-body-medium">Wystąpił błąd. Spróbuj ponownie.</span>
              </div>
            )}
          </form>
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