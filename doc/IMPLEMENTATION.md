# Stan implementacji

## Ukończone

- Przeglądanie rozkładów offline
- Filtrowanie (dni, godziny, przystanki)
- Zapisywanie filtrów (FAB)
- Pobieranie/usuwanie linii
- System głosowania (upvote/downvote)
- Zgłaszanie problemów
- Panel moderatora:
    - Dashboard ze statystykami
    - Zarządzanie zgłoszeniami
    - Zarządzanie rozkładami (approve/reject/compare)
    - Zarządzanie użytkownikami (role, bany)
    - Słowniki (przystanki + przewoźnicy z modalami)
    - Audit Trail Viewer (filtrowanie, paginacja, payload explorer)
- 3-stopniowy status przewoźników (unverified/verified/partner)
- CarrierBadge z ikonami

## Placeholder / TODO



| # | Tytul | Kategoria | Opis | Trudnosc |
|---|-------|-----------|------|----------|
| 1 | Walidacja inputow w mutations.ts | Backend | Zagrozenie KRYTYCZNE - brak limitow na dlugosc tekstow, liczbe przystankow (max 50), liczbe kursow (max 50), dozwolone wartosci dni. Uzytkownik moze zapelnic baze smieclowymi danymi lub wywolac DoS | Srednia |
| 2 | Usuniecie hardcoded Web3Forms API key | Frontend | Zagrozenie WYSOKIE - klucz publiczny w kodzie zrodlowym, kazdy moze go uzyc do wysylania maili/spamu | Mala |
| 3 | Rate limiting | Backend / Baza danych | Zagrozenie WYSOKIE - brak limitow na tworzenie rozkladow, glosowanie, zgloszenia. Mozliwe zalewanie bazy i kolejki moderatora | Srednia |
| 4 | Security headers (CSP, X-Frame-Options) | Konfiguracja | Zagrozenie SREDNIE - brak Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy w next.config.mjs | Mala |
| 5 | Audit logs - IP i user_agent | Backend | Zagrozenie SREDNIE - kolumny istnieja w schemacie ale nie sa wypelniane, brak mozliwosci identyfikacji zrodla przy incydencie. Wymaga server action lub edge function | Srednia |
| 6 | Shadow ban filtrowanie | Backend / Baza danych | Rozwija bezpieczenstwo - flaga shadow_banned istnieje ale brak logiki ukrywajacej dane tych uzytkownikow przed innymi | Srednia |
| 7 | Walidacja reported_user_id w zgloszeniach | Backend | Rozwija jakosc danych - submitReport nie ustawia reported_user_id (created_by z schedule), moderator nie wie kogo dotyczy zgloszenie | Mala |
| 8 | Trigger last_active_at | Baza danych | Rozwija jakosc danych - kolumna istnieje ale nie jest aktualizowana, wymaga triggera Supabase przy INSERT do schedules, verifications, reports | Mala |
| 9 | Edycja rozkladow (kreator w trybie edit) | Frontend / Backend | Rozwija funkcjonalnosc - przycisk "Edytuj" na schedule/[id], kreator z pre-filled danymi, parent_id, version+1, status na podstawie roli | Duza |
| 10 | Kalendarz / sezonowosc | Frontend / Backend | Rozwija funkcjonalnosc - UI dla tabel seasons i overrides, ActionStrip "Kalendarz" (obecnie disabled), filtrowanie rozkladow po dacie waznosci | Duza |
| 11 | System reputacji - logika punktowa | Baza danych | Rozwija funkcjonalnosc - tabela user_activities istnieje ale brak triggerow przyznajacych punkty (+10 za rozklad, +5 za upvote, -5 za downvote, -20 za odrzucenie) | Srednia |
| 12 | Wagi glosow | Baza danych | Rozwija funkcjonalnosc - kolumna verifications.weight istnieje ale nie jest ustawiana automatycznie (viewer=0.5, contributor=1.0, trusted=1.5) | Mala |
| 13 | Auto-rollback przy net_score < -10 | Baza danych | Rozwija funkcjonalnosc - archiwizacja wersji i przywrocenie parent_id jako aktywnej, powiadomienie autora | Srednia |
| 14 | Drawer - reputacja z profilu | Frontend | Rozwija UX - obecnie hardcoded "Viewer - 0 pkt", powinno pobierac role i reputation z tabeli profiles dla zalogowanego | Mala |
| 15 | Auto-filter przy starcie | Frontend | Rozwija UX - ladowanie defaultFilterId z ustawien po otwarciu aplikacji | Mala |
| 16 | Offset minutes w kreatorze | Frontend | Rozwija UX - brak UI do ustawiania offsetow per przystanek, obecnie zawsze 0 co powoduje ze przystanki posrednie pokazuja te sama godzine co start | Srednia |
| 17 | Course times w kreatorze (use_offsets=false) | Frontend | Rozwija UX - tryb recznych godzin per przystanek, obecnie kreator obsluguje tylko use_offsets=true | Srednia |
| 18 | Poprawa informacji przy instalacji PWA | Frontend | Rozwija UX - wykrycie Brave i wyswietlenie instrukcji manualnej zamiast niedzialajacego przycisku instalacji | Mala |
| 19 | Formularz kontaktowy (wlasny backend) | Backend / Frontend | Rozwija niezaleznosc - zastapienie Web3Forms wlasnym rozwiazaniem (Supabase Edge Function lub Next.js API route) | Srednia |
| 20 | Regulamin uzytkowania | Tresc / Prawne | Rozwija zgodnosc prawna - wymagany dla uslugi publicznej, zasady korzystania, odpowiedzialnosc za tresci uzytkownikow | Mala |
| 21 | Polityka prywatnosci | Tresc / Prawne | Rozwija zgodnosc prawna - wymagana przy zbieraniu danych (Google OAuth, IndexedDB), informacja o cookies, RODO | Mala |
| 22 | Cleanup deprecated plikow | Frontend | Porzadkowanie - usunac dummy-schedules.ts, types/schedule.ts, ScheduleCard.tsx, toggleFavorite z queries.ts, console.log z manage/schedules | Mala |
| 23 | Admin nie może edytować admina | Frontend | Warunek `>=` w hierarchii blokuje admin→admin. Rozważyć: wyjątek dla "owner" albo pozwolić admin edytować admin | Mała |