## 1. Tabele Core

### stops
Slownik unikalnych przystankow.
- id (uuid PK)
- city (text): Miejscowosc
- name (text): Nazwa przystanku/ulica
- is_verified (boolean): Zweryfikowany przez moderatora
- created_at (timestamp)
- created_by (uuid FK -> profiles)
- Unique constraint: (city, name)

### carriers
Przewoznicy autobusowi.
- id (uuid PK)
- name (text UNIQUE): Nazwa firmy
- address (text): Adres siedziby
- contact (text): Telefon/email
- cities_served | text[]: Statyczna lista miast, odświeżana ręcznie przez moderatora narzędziem "Sync Cities"
- status | carrier_status (enum): Status przewoźnika w wsiobus
- logo_url (text): Link do logo w Supabase Storage
- created_at (timestamp)

### lines
Linie autobusowe przypisane do przewoznika.
- id (uuid PK)
- carrier_id (uuid FK -> carriers)
- number (text): Numer linii (np. 101)
- description (text): Opis trasy (np. Nowe - Grudziadz)
- operation_note (text): Ogolna informacja o kursowaniu (np. Pon-Pt)
- created_at (timestamp)
- Unique constraint: (carrier_id, number)

### schedules
Naglowki rozkladow (wersjonowane).
- id (uuid PK)
- line_id (uuid FK -> lines)
- direction (text): Kierunek (np. Nowe do Grudziadz)
- version (integer): Numer wersji
- parent_id (uuid FK -> schedules): Poprzednia wersja
- status (enum): pending, active, flagged, archived
- update_type (enum): fix, season_change
- is_incomplete (boolean): Brakuje godzin w kursach
- is_verified (boolean): Zaufany przez spolecznosc
- days (text[]): Dni kursowania (np. Pon, Wt)
- excludes_holidays (boolean): Nie kursuje w swieta
- season_id (uuid FK -> seasons)
- created_by (uuid FK -> profiles)
- created_at (timestamp)
- last_modified_at (timestamp)
- last_verified_at (timestamp)

### route_stops
Trasa rozkladu z offsetami (wspoldzielona dla kursow).
- id (uuid PK)
- schedule_id (uuid FK -> schedules)
- stop_id (uuid FK -> stops)
- order_index (integer): Kolejnosc na trasie
- offset_minutes (integer): Minuty od startu kursu
- Unique constraint: (schedule_id, order_index)

### courses
Konkretne kursy (godziny startu).
- id (uuid PK)
- schedule_id (uuid FK -> schedules)
- departure_time (time): Godzina startu kursu
- use_offsets (boolean): True = uzywa offsetow, False = reczne godziny
- created_at (timestamp)

### course_times
Reczne godziny przystankow (gdy use_offsets = false).
- id (uuid PK)
- course_id (uuid FK -> courses)
- stop_id (uuid FK -> stops)
- arrival_time (time): Godzina przyjazdu
- order_index (integer): Kolejnosc na trasie
- Unique constraint: (course_id, order_index)

## 2. Tabele Seasons i Overrides

### seasons
Okresy obowiazywania rozkladow.
- id (uuid PK)
- name (text): Nazwa (np. Wakacje 2026)
- valid_from (date): Data rozpoczecia
- valid_to (date): Data zakonczenia
- priority (integer): Wyzszy = wazniejszy
- created_at (timestamp)

### overrides
Reczne wymuszenia (swieta, awarie).
- id (uuid PK)
- name (text): Opis (np. Boze Narodzenie 2026)
- date (date): Konkretny dzien
- force_season_id (uuid FK -> seasons): NULL = brak kursow
- priority (integer): Rozwiazywanie konfliktow
- created_by (uuid FK -> profiles)
- created_at (timestamp)

## 3. Tabele Users i Reputation

### profiles
Rozszerzenie danych uzytkownika z Supabase Auth.
- id (uuid PK FK -> auth.users)
- display_name (text)
- reputation (integer)
- role (enum): viewer, contributor, trusted_editor, super_editor, admin
- status (enum): active, shadow_banned, banned
- created_at (timestamp)
- last_active_at (timestamp)

### user_activities
Historia zmian reputacji (logika punktowa).
- id (uuid PK)
- user_id (uuid FK -> profiles)
- activity_type (enum): schedule_created, upvote_received, itp.
- reputation_change (integer)
- related_schedule_id (uuid FK -> schedules)
- created_at (timestamp)

## 4. Tabele Verification i Moderation

### verifications
Glosy spolecznosci na rozklady.
- id (uuid PK)
- schedule_id (uuid FK -> schedules)
- user_id (uuid FK -> profiles)
- vote_type (enum): positive, negative
- negative_reason (enum): OUTDATED, WRONG_TIME, WRONG_ROUTE, NOT_EXIST, VANDALISM, DUPLICATE, OTHER
- weight (float): Waga glosu
- created_at (timestamp)
- Unique constraint: (schedule_id, user_id)

### reports
Zgloszenia bledow i naduzyc.
- id (uuid PK)
- reason (enum): OUTDATED, WRONG_TIME, WRONG_ROUTE, NOT_EXIST, VANDALISM, DUPLICATE, OTHER
- schedule_id (uuid FK -> schedules)
- reported_user_id (uuid FK -> profiles)
- reporter_id (uuid FK -> profiles)
- description (text)
- status (enum): pending, resolved, dismissed
- resolved_by (uuid FK -> profiles)
- resolved_at (timestamp)
- created_at (timestamp)

## 5. System Logow (Audit)

### audit_logs
Historia wszystkich akcji dla panelu moderatora. Brak możliwości modyfikacji i usuwania logów (Immutability).
- id (uuid PK)
- user_id (uuid FK -> profiles)
- action_type (text): np. LOGIN, SCHEDULE_CREATE, USER_BAN
- entity_type (text): np. schedules, carriers
- entity_id (uuid)
- payload (jsonb): Szczegoly zmiany (JSON)
- ip_address (text)
- user_agent (text)
- created_at (timestamp)

## 6. Enumy

- schedule_status: pending, active, flagged, archived
- update_type: fix, season_change
- user_role: viewer, contributor, trusted_editor, super_editor, admin
- user_status: active, shadow_banned, banned
- vote_type: positive, negative
- report_type / negative_reason: OUTDATED, WRONG_TIME, WRONG_ROUTE, NOT_EXIST, VANDALISM, DUPLICATE, OTHER
- report_status: pending, resolved, dismissed
- carrier_status: unverified, verified, partner

## 7. Funkcje i Widoki

### Funkcje pomocnicze dla RLS (Security Definer, Stable)
Zdefiniowane jako `STABLE`, co pozwala silnikowi PostgreSQL na cachowanie wyników w ramach pojedynczego zapytania (optymalizacja wydajności).
- is_admin_or_super(): Zwraca `true`, jeśli obecny użytkownik to admin lub super_editor i nie jest zbanowany.
- is_admin(): Zwraca `true`, jeśli obecny użytkownik to admin i nie jest zbanowany.
- is_not_banned(): Zwraca `true`, jeśli użytkownik ma status inny niż 'banned' (lub jeśli profil jeszcze nie istnieje).
- is_shadow_banned(check_user_id): Sprawdza, czy wskazany po ID użytkownik ma status 'shadow_banned'.

### Widoki i funkcje biznesowe
Widoki w Supabase działają domyślnie w trybie `SECURITY INVOKER`, co oznacza, że automatycznie dziedziczą polityki RLS z tabel bazowych (np. filtrowanie shadow_banned dla rozkładów).
- Widok active_schedules_view: Łączy schedules, lines i carriers. Zwraca aktywne rozkłady, wylicza net_score (positive - negative) oraz pierwszą godzinę odjazdu.
- Widok verification_stats_view: Agreguje głosy dla rozkładów (positive_count, negative_count, net_score).
- Funkcja easter_date(year): Oblicza datę Wielkanocy dla podanego roku (algorytm Computus).
- Funkcja get_polish_holidays(year): Zwraca listę świąt stałych i ruchomych w Polsce.
- Funkcja is_polish_holiday(date): Sprawdza czy dany dzień jest świętem ustawowym w Polsce (zwraca Boolean).

## 8. Kluczowe mechanizmy i Wyzwalacze (Triggers)

- Immutable Versions: Edycja rozkładu nie zmienia rekordu, lecz tworzy nowy z parent_id. Stary rekord staje się archiwalny.
- Reset przy nowej wersji: Nowa wersja rozkładu startuje z zerową liczbą głosów (czysta karta).
- Auto-rollback: Jeśli net_score spadnie poniżej progu, system automatycznie archiwizuje wersję i przywraca poprzednią (parent_id).
- Smart Merge & Fuzzy matching: Pomoc w unikaniu duplikatów przystanków i ułatwione łączenie ich przez admina.
- Automatyczne swieta: System (np. we frontendzie) ostrzega "Prawdopodobnie nie kursuje", jeśli rozkład ma flagę excludes_holidays w dzień świąteczny.
- Automatyczne tworzenie profilu (Trigger): Funkcja `handle_new_user()` automatycznie wstawia rekord do tabeli profiles (jako `viewer`) po pomyślnym utworzeniu użytkownika przez Supabase Auth.
- Śledzenie aktywności (Trigger): Funkcja `update_last_active()` aktualizuje `last_active_at` w tabeli profiles za każdym razem, gdy użytkownik utworzy rozkład, odda głos lub doda zgłoszenie.

### Mechanizmy Ochronne
- Ochrona pól profilu (Trigger `protect_profile_fields`): RLS działa na poziomie wiersza, co pozwalałoby zalogowanemu użytkownikowi zaktualizować własną rolę lub reputację. Aby tego uniknąć, trigger blokuje zmiany `role`, `status` i `reputation` dla użytkowników bez uprawnień administracyjnych. Posiada on obejście `IF auth.uid() IS NULL THEN RETURN NEW;` pozwalające na bezproblemowe wykonywanie bezpośrednich zapytań SQL przez Administrację w panelu Supabase (gdzie nie ma kontekstu logowania).
- Shadow Banning: Użytkownik shadow_banned widzi aplikację normalnie i może dodawać treści. Dzięki zastosowaniu odpowiednich filtrów w politykach `SELECT`, treści te są całkowicie ukryte dla reszty publiczności. Frontend dodatkowo blokuje dostęp do kreatora rozkładów — zamiast formularza wyświetlany jest ekran „Konto ograniczone" z informacją o ograniczeniach i linkiem do kontaktu.
- Egzekwowanie banu (Frontend): Hook `useBanCheck` odpytuje `profiles.status` przy montowaniu layoutu `/app`. Jeśli status to `banned`, cały content aplikacji zastępowany jest pełnoekranowym ekranem blokady (`BannedScreen`) z informacją o zablokowaniu konta i linkiem do formularza kontaktowego. Sesja nie jest niszczona — użytkownik może się zidentyfikować. Funkcje zapisu (`submitSchedule`, `submitReport`, `voteOnSchedule`, `removeVote`) rozpoznają błędy RLS i zwracają czytelne komunikaty zamiast surowych komunikatów PostgreSQL.

## 9. Scenariusze Dostępu (Model RLS)

- Anonimowy uzytkownik (brak logowania): Przeglądanie aktywnych/oczekujących rozkładów, przewoźników, linii, przystanków, tras i kursów. Brak możliwości głosowania, tworzenia i edycji. Treści od twórców shadow_banned są dla niego ukryte.
- Zalogowany uzytkownik (viewer / contributor / trusted_editor): To co anonimowy, plus dodawanie rozkładów, głosów, przystanków i zgłoszeń. Widzi swoje własne rozkłady niezależnie od statusu. Nie może psuć i edytować cudzych danych.
- Zbanowany uzytkownik: Czyta bazę wyłącznie jako anonimowy. Mechanizm weryfikacji w politykach i wyzwalaczach całkowicie blokuje mu operacje zapisu, edycji i usuwania czegokolwiek (w tym usuwania własnych, wcześniej oddanych głosów). Frontend proaktywnie wykrywa status `banned` i wyświetla ekran blokady zamiast interfejsu aplikacji. Próby zapisu przechwycone przez RLS skutkują komunikatem „Twoje konto nie ma uprawnień do tej operacji" zamiast surowego błędu bazy danych.
- Shadow banned uzytkownik: Może normalnie przeglądać rozkłady i głosować (system nie zwraca błędów RLS), ale jego twórczość jest izolowana. Frontend blokuje dostęp do kreatora rozkładów — wyświetla ekran „Konto ograniczone" z możliwością kontaktu.
- Super Editor: Pełny dostęp do zarządzania domeną (zatwierdzanie rozkładów, przegląd zgłoszeń i logów audytowych). Z poziomu bazy danych ma techniczne prawo modyfikacji profili, ale panel frontendowy blokuje mu możliwość zmieniania ról.
- Admin: Nielimitowany dostęp. Dodatkowo jako jedyny ma uprawnienia bazodanowe do fizycznego usuwania kont (`profiles_delete_admin`).

## 10. Polityki RLS (Row Level Security) per Tabela

Zestawienie przypisanych zasad bezpieczeństwa i dostępności dla konkretnych tabel.

### Tabele bazowe (stops, carriers, lines)
- SELECT: Odczyt dostępny dla wszystkich.
- INSERT: Dozwolony dla zalogowanych i niezbanowanych użytkowników.
- UPDATE, DELETE: Dozwolone wyłącznie dla użytkowników z rangą admin lub super_editor.

### Rozkłady (schedules)
- SELECT: Publiczny dostęp filtruje rekordy o statusie active/pending/flagged i odrzuca te stworzone przez użytkowników z shadow banem. Zalogowany autor widzi swoje rozkłady zawsze. Administracja widzi wszystko.
- INSERT: Zalogowany i niezbanowany użytkownik. Pole `created_by` musi zgadzać się z UID wykonującego zapytanie.
- UPDATE, DELETE: Zastrzeżone dla admina i super_editora.

### Budowa trasy i kursy (route_stops, courses)
- SELECT: Dostęp publiczny.
- INSERT: Atomowość tworzenia rozkładu. Zalogowany, niezbanowany użytkownik może dodać trasę i kursy wyłącznie do rozkładu w tabeli `schedules`, którego jest prawnym autorem (`created_by`).
- UPDATE, DELETE: Tylko admin lub super_editor.

### Godziny (course_times)
- SELECT: Dostęp publiczny.
- INSERT: Użytkownik sprawdza łańcuch powiązań. Można wstawić godzinę tylko wtedy, gdy celowany kurs z tabeli `courses` należy do rozkładu z tabeli `schedules`, którego użytkownik jest twórcą.
- UPDATE, DELETE: Tylko admin lub super_editor.

### Okresy i Wyjątki (seasons, overrides)
- SELECT: Dostęp publiczny.
- INSERT, UPDATE, DELETE: Tylko admin i super_editor.

### Użytkownicy (profiles)
- SELECT: Podstawowe odczyty są publiczne.
- UPDATE: Użytkownik może zaktualizować swój własny profil (trigger zablokuje zmianę rangi/reputacji, pozwalając np. na zmianę `display_name`). Admin może edytować wszystkie profile bez blokad.
- DELETE: Operacja krytyczna - dostęp ma wyłącznie użytkownik z rangą admin (`is_admin()`).

### Aktywności i logika punktowa (user_activities)
- SELECT: Użytkownik widzi tylko swoją historię. Admin i super_editor widzą wszystko.
- INSERT: Systemowe i po stronie zalogowanego użytkownika (tylko na własne konto).
- UPDATE: Całkowicie zablokowane na poziomie polityk.
- DELETE: Tylko admin.

### Głosy i Oceny (verifications)
- SELECT: Dostęp publiczny do zliczania głosów.
- INSERT, UPDATE: Użytkownik zalogowany i niezbanowany operujący na własnym `user_id` (upsert głosu).
- DELETE: Tylko zalogowany użytkownik na własnym rekordzie, pod warunkiem, że nie ma bana.

### Raporty i Zgłoszenia (reports)
- SELECT: Zgłaszający widzi własne raporty, administracja widzi całą tabelę.
- INSERT: Zalogowany, niezbanowany pod własnym `reporter_id`.
- UPDATE: Administracja do zarządzania statusem (np. resolving).
- DELETE: Tylko admin.

### Audyt (audit_logs)
- SELECT: System tylko dla admina i super_editora.
- INSERT: Weryfikacja tożsamości - zalogowany wpisuje pod własne UID.
- UPDATE, DELETE: Zablokowane całkowicie dla zachowania integralności i niezmienności dziennika audytu.

## 11. Przykład użycia SQL

Sprawdzenie czy kurs z danego rozkładu prawdopodobnie nie kursuje z uwagi na to, że dziś wypada w Polsce święto:

```sql
SELECT s.*,
CASE 
    WHEN s.excludes_holidays AND is_polish_holiday(CURRENT_DATE) THEN TRUE 
    ELSE FALSE 
END AS probably_not_running,
get_holiday_name(CURRENT_DATE) AS holiday_name
FROM active_schedules_view s;
```