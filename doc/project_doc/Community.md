# Społeczność, Reputacja i Moderacja

Ten moduł definiuje, w jaki sposób użytkownicy budują bazę danych, jak są za to nagradzani oraz jak system broni się przed błędami i trollingiem.

### 1. System Interakcji (Ocenianie)

Każdy rozkład posiada trzy główne akcje dostępne dla zalogowanego użytkownika:

- **Łapka w górę (Aktualny):** Potwierdza, że rozkład jest zgodny z rzeczywistością. Zwiększa `net_score` i reputację autora.
- **Łapka w dół (Nieaktualny):** Sygnalizuje błąd w godzinach lub trasie. Obniża `net_score`.
- **Flaga (Zgłoś):** Służy wyłącznie do raportowania nadużyć (trolling, wandalizm, wulgaryzmy). Kliknięcie otwiera okno z opisem problemu, który trafia bezpośrednio do panelu moderatora.

---

### 2. Role i Progi Reputacji

System automatycznie awansuje użytkowników na podstawie ich wkładu:

- **Viewer (0 pkt):** Może przeglądać i oceniać. Dodane przez niego rozkłady trafiają do kolejki **Pending** i są niewidoczne dla innych do czasu akceptacji.
- **Contributor (10 pkt):** Odblokowuje się po zatwierdzeniu pierwszego rozkładu. Jego wrzutki pojawiają się od razu jako **Active**, ale z banerem "Unverified".
- **Trusted Editor (100 pkt):** Elita. Jego edycje są automatycznie oznaczane jako zweryfikowane (**Verified**).

_Uwaga: Rola Admina i Moderatora jest przypisana na sztywno do właściciela bazy i nie jest częścią automatycznego awansu._

---

### 3. Logika Punktacji (Balans)

Punkty reputacji są przyznawane/odbierane dynamicznie:

- **Utworzenie rozkładu:** +10 pkt (po zatwierdzeniu przez moda lub uzyskaniu statusu Verified).
- **Uzupełnienie brakujących godzin:** +7 pkt (nagroda za pracę nad "niepełnymi" rozkładami).
- **Otrzymany głos pozytywny:** +5 pkt.
- **Otrzymany głos negatywny:** -5 pkt (surowa kara za wprowadzanie w błąd).
- **Potwierdzone zgłoszenie trollingu:** +5 pkt dla zgłaszającego.
- **Odrzucenie wpisu przez moderatora:** -20 pkt (kara za wandalizm).

---

### 4. Obieg Danych i Weryfikacja (Workflow)

Zabezpieczamy jakość danych poprzez trzy statusy rozkładu:

- **Status: Pending (Oczekujący):** Domyślny dla nowych użytkowników. Niewidoczny publicznie (chyba że włączysz filtr "Pokaż Pending"). Twórca zawsze widzi swój rozkład z dopiskiem "Oczekiwanie na weryfikację".
- **Status: Active (Aktywny):** Rozkład zatwierdzony przez moda. Widoczny dla wszystkich, ale jeśli autor ma niską reputację, karta posiada żółty baner "W trakcie weryfikacji społeczności".
- **Status: Verified (Zweryfikowany):** Rozkład, który zdobył odpowiednią liczbę głosów na plus lub został dodany przez Trusted Editora. Najwyższy poziom zaufania.

---

### 5. UI/UX Społecznościowy w PWA

- **Dynamiczna Godzina:** Karta rozkładu oblicza czas odjazdu na podstawie wybranego przystanku w polu "Skąd".
- **Filtr Eksperta:** Opcja w filtrach zaawansowanych pozwalająca zobaczyć rozkłady `Pending` (z czerwonym ostrzeżeniem).
- **Karta Rozkładu:** Wyświetla `net_score` (bilans głosów) oraz przyciski Like/Unlike/Zgłoś w dolnej sekcji.
- **Empty State:** Jeśli brak wyników, system zachęca: "Brak rozkładów w tej relacji. Może chcesz stworzyć własny?".

---

### 6. Mechanizm Rollback

Jeśli nowa wersja rozkładu otrzyma znaczącą przewagę głosów negatywnych (np. net_score spadnie poniżej -10), system automatycznie:

1. Archwizuje obecną wersję.
2. Przywraca poprzednią, poprawną wersję (`parent_id`) jako aktywną.
3. Wysyła powiadomienie (mailowe) do autora o odrzuceniu zmian.