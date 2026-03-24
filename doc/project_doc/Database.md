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

---

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

---

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

---

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

---

## 5. System Logow (Audit)

### audit_logs

Historia wszystkich akcji dla panelu moderatora.

- id (uuid PK)
- user_id (uuid FK -> profiles)
- action_type (text): np. LOGIN, SCHEDULE_CREATE, USER_BAN
- entity_type (text): np. schedules, carriers
- entity_id (uuid)
- payload (jsonb): Szczegoly zmiany (JSON)
- ip_address (text)
- user_agent (text)
- created_at (timestamp)

---

## 6. Enumy

- schedule_status: pending, active, flagged, archived
- update_type: fix, season_change
- user_role: viewer, contributor, trusted_editor, super_editor, admin
- user_status: active, shadow_banned, banned
- vote_type: positive, negative
- report_type / negative_reason: OUTDATED, WRONG_TIME, WRONG_ROUTE, NOT_EXIST, VANDALISM, DUPLICATE, OTHER
- report_status: pending, resolved, dismissed
- carrier_status: unverified, verified, partner

---

## 7. Funkcje i Widoki

### Widok: active_schedules_view

Laczy schedules, lines i carriers. Zwraca aktywne rozklady, wylicza net_score (positive - negative) oraz pierwsza godzine odjazdu.

### Funkcja: easter_date(year)

Oblicza date Wielkanocy dla podanego roku (algorytm Computus).

### Funkcja: get_polish_holidays(year)

Zwraca tabele swiat:

- Stale: Nowy Rok, Trzech Kroli, 1 Maja, 3 Maja, 15 Sierpnia, 1 Listopada, 11 Listopada, Boze Narodzenie (2 dni).
- Ruchome: Wielkanoc, Poniedzialek Wielkanocny, Zielone Swiatki, Boze Cialo.

### Funkcja: is_polish_holiday(date)

Zwraca Boolean. Sprawdza, czy dany dzien jest swietem ustawowym w Polsce.

### Widok: verification_stats_view

Agreguje głosy dla rozkładów. Kolumny:

- schedule_id
- positive_count
- negative_count
- net_score (positive - negative)

### Widok: active_schedules_view - szczegóły kolumn

- id, line_id, direction, version, parent_id, status, update_type
- is_incomplete, is_verified, days, excludes_holidays
- season_id, created_by, created_at, last_modified_at, last_verified_at
- line_number, line_description, line_operation_note
- carrier_name, carrier_logo, carrier_status (enum: unverified/verified/partner)
- net_score (z verification_stats_view)
- first_departure (MIN z courses.departure_time)

---

## 8. Kluczowe mechanizmy

- Immutable Versions: Edycja rozkladu nie zmienia rekordu, lecz tworzy nowy z parent_id. Stary rekord staje sie archiwalny.
- Reset przy nowej wersji: Nowa wersja rozkladu startuje z zerowa liczba glosow (czysta karta).
- Auto-rollback: Jesli net_score spadnie ponizej progu, system automatycznie archiwizuje wersje i przywraca poprzednia (parent_id).
- Nullable arrival_time: Pozwala na zapisywanie przystankow na trasie bez znanych godzin (is_incomplete = true).
- Fuzzy matching: Przy dodawaniu przystankow system sugeruje istniejace w bazie, by uniknac duplikatow nazw (np. Mątawy vs Matawy).
- Smart Merge: Admin moze scalic dwa przystanki, co automatycznie aktualizuje wszystkie powiazane trasy.
- Automatyczne swieta: System automatycznie ostrzega "Prawdopodobnie nie kursuje", jesli dzis jest swieto, a rozklad ma flagu excludes_holidays.

---

## 9. Przyklad uzycia SQL

Sprawdzenie czy kurs dzis kursuje:

```sql
SELECT s.\*,
CASE WHEN s.excludes_holidays AND is_polish_holiday(CURRENT_DATE) THEN TRUE ELSE FALSE END AS probably_not_running,
get_holiday_name(CURRENT_DATE) AS holiday_name
FROM active_schedules_view s;
```

---

## 10. Row Level Security (RLS) Policies

### stops

- **stops_select_public**: SELECT dla wszystkich (publiczny odczyt)
- **stops_insert_authenticated**: INSERT dla zalogowanych użytkowników
- **stops_update_admin**: UPDATE tylko dla admin i super_editor
- **stops_delete_admin**: DELETE tylko dla admin i super_editor

### carriers

- **carriers_select_public**: SELECT dla wszystkich (publiczny odczyt)
- **carriers_insert_authenticated**: INSERT dla zalogowanych użytkowników
- **carriers_update_admin**: UPDATE tylko dla admin i super_editor
- **carriers_delete_admin**: DELETE tylko dla admin i super_editor
