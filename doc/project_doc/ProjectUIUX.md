## 1. Strona Główna (Main View)

Strona główna jest zorientowana na błyskawiczne dostarczenie informacji pasażerowi.

### Nagłówek (Header)

- **WSIOBUS**: Centralny logotyp i nazwa marki.
- **Lewa strona**: Ikona „Hamburger”, otwierająca menu boczne.
- **Prawa strona**: Ikona statusu offline (pobieranie) oraz ikona skrótu do Ustawień.

### Pasek Szybkich Akcji (Action Strip)

Pozioma, przewijalna lista przycisków modyfikujących widok:

- **Teraz**: Odjazdy w najbliższym czasie.
- **Godzina**: Ręczny wybór czasu.
- **Dzień tygodnia**: Wybór trybu kursowania (np. robocze, soboty).
- **Kalendarz**: Wybór konkretnej daty (sezonowość).
- **Pending (Toggle)**: Widoczność rozkładów oczekujących na moderację (wymaga ostrzegawczego koloru tła wyników).

### Sekcja Wyszukiwania

- **Pole Skąd**: Wyszukiwanie przystanku startowego.
- **Pole Dokąd**: Wyszukiwanie celu podróży.
- **Ikona Suwaków**: Obok pola „Dokąd”, rozwija sekcję Zaawansowane (np. Przystanek pośredni, wybór przewoźnika).

### Karta Rozkładu (Schedule Card)

- **Dynamiczny Czas**: Wyświetla godzinę odjazdu z przystanku wpisanego w polu „Skąd”.
- **Weryfikacja**: Kolorowy pasek/tag informujący o statusie (Verified / Unverified / Pending).
- **Interakcje Społecznościowe**: Wyświetlanie `net_score` oraz przyciski kciuk w górę/dół i ikona flagi (Zgłoś).

### Floating Action Button (FAB)

- **Funkcja**: Służy wyłącznie do **zapisywania filtrów**.
- **Logika**: Po kliknięciu, aktualna konfiguracja (Skąd, Dokąd, opcje zaawansowane) zostaje zapisana jako nazwany filtr (np. „Do pracy”) i trafia do Menu Bocznego.

---

## 2. Menu Boczne (Hamburger List)

Panel wysuwany z lewej strony, podzielony na trzy sekcje:

### Sekcja Profilu

- **User Info**: Avatar, nazwa użytkownika, ranga (np. Contributor) i aktualna liczba punktów reputacji.

### Sekcja Zapisanych Filtrów

- **Twoje Trasy**: Lista skrótów utworzonych za pomocą FAB. Kliknięcie natychmiastowo wypełnia wyszukiwarkę na stronie głównej zapisanymi parametrami.

### Sekcja Narzędziowa

- **Zarządzanie Rozkładami**: Wejście do przeglądarki pobranych i dostępnych linii.
- **Dodaj Nowy Rozkład**: Bezpośredni skrót do edytora (Bulk Entry).
- **Ustawienia**: Pełna konfiguracja aplikacji.

---

## 3. Przeglądarka Rozkładów (Schedule Browser)

Moduł zarządzania atomowymi jednostkami danych – **Liniami**.

### Zakładka: Pobrane

- Lista linii aktualnie zapisanych w pamięci offline urządzenia.
- Możliwość usunięcia linii z pamięci podręcznej.
- Weryfikacja spójności (status „Aktualne”).

### Zakładka: Do Pobrania

- Globalna wyszukiwarka linii w chmurze (po przewoźniku lub miejscowościach na trasie).
- Przycisk „Pobierz” (Subskrypcja ID Linii).
- Domyślny pakiet startowy najpopularniejszych linii dla nowych użytkowników.

---

## 4. Punkty Wejścia do Edycji i Tworzenia

System inteligentnie zachęca do współtworzenia bazy danych:

### Tworzenie nowej linii

- **Menu Boczne**: Stały link „Dodaj nowy rozkład”.
- **Zarządzanie Rozkładami**: Przycisk „+ Nowa Linia” na górze listy.
- **Empty State**: Gdy wyszukiwarka nie znajdzie pobranych ani dostępnych linii, pojawia się komunikat: „Brak wyników. Czy chcesz dodać tę trasę?”.

### Edytowanie istniejącej linii

- **Karta Rozkładu**: Przycisk „Edytuj” (dostępny dla zalogowanych). Kopiuje dane do edytora w celu aktualizacji godzin lub przystanków.

---

## 5. Ustawienia (Settings)

Kluczowe opcje konfiguracyjne przechowywane lokalnie:

- **Zarządzanie pamięcią**: Usuwanie wszystkich rozkładów/filtrów.
- **Synchronizacja**: Przycisk „Wymuś synchronizację” (pomijanie blokady Wi-Fi) oraz ustawienie cooldownu.
- **Widoczność**: Przełącznik domyślnego pokazywania danych `Pending` oraz konfiguracja pól widocznych na karcie.
- **Default Start**: Wybór filtru, który ma być aktywny zaraz po wejściu do aplikacji.
- **Linki**: Regulamin, Polityka Prywatności, wsiobus.pl.

---

## 6. Hierarchia zaufania (Statusy Przewoźników)

### System wizualnie rozróżnia wiarygodność danych za pomocą trzech poziomów:

- **Niezweryfikowany (Społeczność):** Brak grafiki w widoku głównym. W szczegółach podpis: "Rozkład dodany przez społeczność".
- **Zweryfikowany przez wsiobus.pl:** Ikona niebieskiej tarczy (Blue Check) w widoku głównym. W szczegółach: ikona + tekst "Dane zweryfikowane przez moderatora".
- **Partner wsiobus.pl:** Ikona złotej gwiazdy/tarczy w widoku głównym. W szczegółach: ikona + tekst "Oficjalny Partner wsiobus.pl - gwarancja aktualności".

### Logika wyświetlania:

1. **Widok listy (karty):** Tylko ikona obok nazwy przewoźnika (oszczędność miejsca).
2. **Widok szczegółów:** Pełny opis statusu pod nazwą linii/przewoźnika, aby budować autorytet źródła.

## 7. Zasady UX i Logika Danych

- **Lokalność wyszukiwania**: Strona główna przeszukuje **wyłącznie** linie znajdujące się w zakładce „Pobrane”.
- **Optymalizacja kciuka**: Wszystkie kluczowe akcje (Filtry, Szukaj, FAB) znajdują się w dolnej i środkowej strefie ekranu.
- **Responsywność**: PWA skaluje się od małych smartfonów po tablety, zachowując czytelność dynamicznych godzin.
---

## 8. Ekrany Blokady i Ograniczeń

System egzekwuje sankcje nałożone przez moderatorów na poziomie interfejsu użytkownika.

### Ekran blokady konta (Permanentny ban)

Wyświetlany zamiast całej treści aplikacji (`/app`) dla użytkowników ze statusem `banned`. Zastępuje layout z nagłówkiem i menu bocznym.

- **Ikona**: `BlockIcon` w kółku z kolorem `error-container` (Material Design 3).
- **Nagłówek**: „Konto zablokowane".
- **Treść**: Informacja o zablokowaniu z powodu naruszenia regulaminu i możliwości kontaktu.
- **Przycisk**: „Skontaktuj się" — link do strony `/contact` (poza scope PWA, normalny `<a>`).
- **Sesja**: Nie jest niszczona — użytkownik pozostaje zalogowany, aby mógł się zidentyfikować na stronie kontaktowej.

### Ekran ograniczonego konta (Shadow ban)

Wyświetlany na stronie tworzenia rozkładu (`/app/create`) zamiast kreatora dla użytkowników ze statusem `shadow_banned`. Pozostałe widoki (przeglądanie, szczegóły, głosowanie) działają normalnie.

- **Ikona**: `VisibilityOffIcon` w kółku z kolorem `tertiary-container`.
- **Nagłówek**: „Konto ograniczone".
- **Treść**: Informacja o ograniczeniu konta z możliwością kontaktu w przypadku pomyłki.
- **Przyciski**: „Skontaktuj się" (link do `/contact`) oraz „Wróć do rozkładów" (link do `/app`).
- **Styl**: Identyczny z istniejącym ekranem „Zaloguj się" (ten sam `PageWrapper`, centrowanie, typografia).

### Komunikaty błędów przy operacjach zablokowanych przez RLS

Gdy backend (polityki RLS) odrzuci operację zapisu, frontend przechwytuje błąd i wyświetla czytelny komunikat zamiast surowego błędu PostgreSQL.

- **Głosowanie**: Alert „Nie masz uprawnień do głosowania." — stan głosu nie zmienia się lokalnie.
- **Tworzenie rozkładu**: Komunikat „Twoje konto nie ma uprawnień do tej operacji."
- **Zgłaszanie**: Komunikat „Twoje konto nie ma uprawnień do zgłaszania."