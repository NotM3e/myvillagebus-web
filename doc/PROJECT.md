# myVillageBus (Wsiobus)

## O projekcie

Aplikacja PWA do rozkładów autobusów małych przewoźników.
User-generated content z systemem weryfikacji społeczności.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- Styling: Material Design 3 (custom CSS)
- PWA: @ducanh2912/next-pwa
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Auth: Google OAuth (localStorage, nie cookies)
- Offline: IndexedDB przez Dexie.js
- Hosting: Vercel (wsiobus.pl)

## Model biznesowy

- Publiczny dostęp: przeglądanie bez logowania
- Google OAuth: wymagane do dodawania/edycji
- System reputacji (Wikipedia-style)
- Waga głosów: anonimowy=0.5, zalogowany=1.0, trusted=1.5

## Kluczowe koncepcje

- 1 Schedule = 1 Kurs (każda godzina = osobny rekord)
- Immutable Versions (edycja tworzy nową wersję z parent_id)
- Offline-first (IndexedDB jako primary source dla użytkownika)
