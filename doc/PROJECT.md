# myVillageBus (Wsiobus)

## O projekcie

Aplikacja PWA do rozkładów autobusów małych przewoźników.
User-generated content z systemem weryfikacji społeczności.
Offline-first - dane przechowywane lokalnie w IndexedDB.

## Tech Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Material Design 3 (custom CSS) |
| PWA | @ducanh2912/next-pwa |
| Ikony | @mui/icons-material |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Auth | Google OAuth (localStorage, nie cookies) |
| Offline | IndexedDB przez Dexie.js |
| Hosting | Vercel (wsiobus.pl) |

## Model biznesowy

- Publiczny dostęp: przeglądanie rozkładów bez logowania
- Google OAuth: wymagane do dodawania/edycji rozkładów
- System reputacji (Wikipedia-style) - wyższa reputacja = więcej uprawnień
- Waga głosów: anonimowy=0.5, zalogowany=1.0, trusted=1.5

## Kluczowe koncepcje

- **1 Schedule = 1 Kurs** - każda godzina odjazdu = osobny rekord
- **Immutable Versions** - edycja tworzy nową wersję z parent_id
- **Offline-first** - IndexedDB jako primary source dla użytkownika
- **3-stopniowy status przewoźników** - unverified / verified / partner

## Zmienne środowiskowe

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_URL=https://wsiobus.pl  # lub http://localhost:3000
```