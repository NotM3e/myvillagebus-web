## 1. Architektura i Dostep

### Autoryzacja i Routing

- Sciezka dostepu: `/manage` (sciezka niepubliczna, niepodlinkowana w menu dla zwyklego uzytkownika).
- Guard Dostepu: Komponent ladowany na tej sciezce musi sprawdzac role zalogowanego uzytkownika (z tabeli profiles). Dostep maja wylacznie role: super_editor, admin.
- Bezpieczeństwo: Kazde zapytanie z poziomu panelu jest weryfikowane przez Supabase RLS (Row Level Security). Brak odpowiedniej roli skutkuje brakiem danych, nawet jesli uzytkownik wejdzie pod adres URL.

### Zasada Akcji

Kazda zmiana dokonana w panelu (zatwierdzenie, ban, edycja) musi wywolywac funkcje Audit Log, ktora zapisuje zdarzenie w tabeli audit_logs przed dokonaniem faktycznej zmiany w bazie.

---

## 2. Modul: Centrum Moderacji (Kolejka Zgloszen)

Jest to glowny widok pracy moderatora, agregujacy dane z tabeli reports.

### Filtrowanie i Sortowanie

Zgloszenia sa sortowane wedlug wagi:

- Priorytet 1 (Krytyczny): VANDALISM, NOT_EXIST.
- Priorytet 2 (Standardowy): WRONG_TIME, OUTDATED, WRONG_ROUTE.
- Priorytet 3 (Porzadkowy): DUPLICATE, OTHER.

### Widok Porownywarki (Comparison View)

To kluczowe narzedzie do weryfikacji propozycji zmian (status pending) oraz raportow bledow.

**Struktura interfejsu:**

- Lewa strona (Stan Aktualny): Wyswietla dane kursu obecnie oznaczonego jako active.
- Prawa strona (Propozycja/Zgloszenie): Wyswietla nowe dane przeslane przez uzytkownika.
- Highlighting (Diff): System podswietla na czerwono/zielono konkretne pola, ktore sie roznia (np. inna godzina przyjazdu na konkretny przystanek).

**Akcje w porownywarce:**

- Przycisk Akceptuj: Nadaje nowej wersji status active, archiwizuje stara, przypisuje punkty reputacji autorowi i zamyka zgloszenie.
- Przycisk Odrzuc: Zmienia status propozycji na archived, zamyka zgloszenie jako dismissed, opcjonalnie naklada kare punktowa.
- Przycisk Edytuj i Zatwierdz: Otwiera kreator z danymi propozycji, pozwalajac moderatorowi naniesc drobne poprawki przed publikacja.

---

## 3. Modul: Zarzadzanie Spolecznoscia

Narzedzie do nadzoru nad uzytkownikami i ich wplywem na ekosystem.

### Kartoteka Uzytkownika

Widok szczegolowy profilu zawierajacy:

- Statystyki: Liczba dodanych rozkladow, stosunek upvoty/downvoty, liczba odrzuconych zgloszen.
- Historia Aktywnosci: Lista ostatnich akcji pobrana z user_activities.
- Logi Systemowe: Ostatnie logowania i adresy IP powiazane z profilem (z audit_logs).

### Narzedzia Dyscyplinarne

- Zmiana rangi: Mozliwosc awansowania Contributora na Trusted Editora.
- Shadow Ban: Flaga w tabeli profiles. Uzytkownik widzi swoje zmiany, ale nie sa one propagowane do innych uzytkownikow ani do kolejki moderacji.
- Ban Permanentny: Blokada mozliwosci logowania przez OAuth.

---

## 4. Modul: Higiena Danych (Słowniki)

Zarzadzanie danymi bazowymi, ktore nie sa bezposrednio rozkladami. Dostep przez `/manage/data`.

### Zarzadzanie Przystankami (Stops)

**Lista przystankow:**

- Wyszukiwarka po miejscowosci i nazwie.
- Filtr "Tylko niezweryfikowane".
- Selekcja wielu przystankow (max 2) do operacji merge/weryfikacji.

**Operacje grupowe:**

- Weryfikacja: Oznaczanie wybranych przystankow flaga is_verified.
- Merge: Scalanie dwoch przystankow w jeden (pierwszy zaznaczony = docelowy). System automatycznie aktualizuje stop_id we wszystkich tabelach route_stops i course_times.

**Modal szczegółów przystanku (kliknięcie na przystanek):**

- Edycja: Zmiana miejscowosci (city) i nazwy (name) z walidacja unikalnosci.
- Podglad uzycia: Lista rozkladow gdzie przystanek wystepuje wraz z pozycja na trasie.
- Statystyki: Liczba rozkladow i linii uzywajacych przystanku.
- Usuwanie: Mozliwe z ostrzezeniem jesli przystanek jest uzywany w rozkladach. Usuniecie powoduje skasowanie powiazanych rekordow route_stops i course_times.

### Zarzadzanie Przewoznikami (Carriers)

**Lista przewoznikow:**

- Wyszukiwarka po nazwie.

**Modal szczegółów przewoźnika (kliknięcie na przewoźnika):**

- Edycja metadanych: Nazwa, adres siedziby, kontakt (telefon/email), URL logo.
- Podglad linii: Lista linii nalezacych do przewoznika wraz z liczba rozkladow.
- Statystyki: Laczna liczba linii i rozkladow.
- Weryfikacja: Nadawanie statusu.

**Edycja Statusu:**

Trzystopniowy przełącznik statusu: [Społeczność] | [Zweryfikowany] | [Partner]. Zmiana statusu automatycznie loguje akcję w audit_logs.

**Narzędzie "Sync Cities" (Aktualizacja miast):**

Przycisk: "Aktualizuj listę obsługiwanych miejscowości".
Logika: System skanuje wszystkie aktywne rozkłady danego przewoźnika, wyciąga unikalne nazwy miejscowości z powiązanych przystanków (stops.city) i nadpisuje pole cities_served.
Zastosowanie: Pozwala na błyskawiczne odświeżenie indeksu wyszukiwarki po dodaniu nowych linii przez użytkowników.

---

## 5. Modul: Dziennik Zdarzen (Audit Trail Viewer)

Przegladarka tabeli audit_logs w formacie czytelnym dla czlowieka.

- Interfejs: Chronologiczna lista wszystkich akcji w systemie.
- Payload Explorer: Mozliwosc rozwiniecia szczegolow JSONB, aby zobaczyc co dokladnie zostalo zmienione (np. zmiana roli uzytkownika X przez administratora Y).
- Filtracja: Wedlug uzytkownika, typu akcji (np. tylko BANY) lub ID obiektu (np. cala historia zmian konkretnej linii).

---

## 6. Wytyczne Implementacyjne dla Dewelopera

Aby panel byl latwy w utrzymaniu, nalezy zastosowac nastepujace zasady:

- Modulowosc: Panel `/manage` powinien byc osobnym pakietem (chunk), ladowanym tylko gdy uzytkownik ma uprawnienia, aby nie obciazac aplikacji pasazera.
- Komponenty UI: Uzycie gotowej biblioteki komponentow (np. Shadcn UI lub Tailwind), aby skupic sie na logice danych, a nie na stylistyce panelu.
- Feedback: Kazda akcja moderatora musi konczyc sie powiadomieniem (Toast) o sukcesie lub bledzie operacji w bazie.
