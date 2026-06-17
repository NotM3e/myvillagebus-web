Kreator jest modułem służącym do wprowadzania nowych danych oraz aktualizacji istniejących. Proces opiera się na 3-etapowym formularzu (Stepper), który minimalizuje ryzyko błędów i pozwala na szybkie wprowadzanie masowych danych.

### Zasady ogólne

* **Atomowość Kursu**: Każdy **kurs (przejazd)** jest traktowany jako oddzielny rekord. Pozwala to na pełną niezależność dni kursowania dla każdego odjazdu (np. kurs o 08:00 tylko w dni robocze, a 10:00 dodatkowo w weekendy).
* **Wersjonowanie (Immutable)**: Edycja nie nadpisuje danych. Każda zmiana tworzy nową propozycję z odniesieniem `parent_id` do oryginału.
* **Oznaczenia wizualne**:
1. **Dane Zweryfikowane** (Admin/Verified): Kolor Zielony + symbol tarczy.
2. **Dane Społecznościowe** (Active/Unverified): Kolor Niebieski + symbol ludzika.
3. **Dane Własne/Pending**: Kolor Żółty + symbol wykrzyknika.



---

### Krok 1: Przewoźnik (Carrier)

**Cel:** Określenie podmiotu obsługującego przejazd.

* Wyszukiwarka z autouzupełnianiem przeszukująca bazę `carriers`.
* Przycisk „Dodaj nowego przewoźnika” przy braku wyników.
* **Tryb Edycji**: Pole zablokowane (Read-only), aby zapobiec zmianie właściciela podczas poprawiania godzin.

---

### Krok 2: Linia i Przystanki (Line & Route)

**Cel:** Określenie relacji (skąd-dokąd) oraz sekwencji przystanków.

* Wybór istniejącej linii przypisanej do przewoźnika lub „Utwórz nową linię”.
* **Definiowanie Trasy**: Określenie kolejności przystanków (`route_stops`). Jest to baza, do której Parser w Kroku 3 przypisze godziny.
* **Tryb Edycji**: Pole zablokowane, chyba że użytkownik wybierze opcję „Zmień linię/trasę”.

---

### Krok 3: Kurs i Harmonogram (Course & Schedule)

**Cel:** Zdefiniowanie konkretnych godzin, dat ważności i dni kursowania.

**1. Ważność rozkładu (Sezonowość):**

* **Data rozpoczęcia**: Domyślnie dzisiaj.
* **Data zakończenia**: Przełącznik [Bezterminowo / Konkretna data]. Kluczowe dla linii wakacyjnych lub feryjnych.

**2. Dni kursowania:**

* Niezależne dla każdego kursu. Wybór dni tygodnia + szablony (Robocze, Weekendy, Codziennie).
* Opcjonalne flagi: „Kursuje w święta”, „Dni nauki szkolnej”.

**3. Funkcja „Kopiuj z innego przejazdu”:**

* Przycisk pozwalający załadować strukturę przystanków i godziny z innego kursu tej samej linii w celu szybkiej modyfikacji.

**4. Bulk Entry Parser (Wprowadzanie masowe):**

* Pole tekstowe do wpisywania par: `Przystanek Godzina` (np. `Mątawy 08:15`).
* System automatycznie mapuje wpisy na przystanki z Kroku 2. Błędy (literówki w nazwach) są podświetlane na czerwono.

---

### Logika zapisu i uprawnienia

* **Viewer (0 pkt)**: Status `Pending` (widoczny tylko dla twórcy i moderatora).
* **Contributor**: Status `Active` (widoczny dla wszystkich z tagiem „Unverified”).
* **Admin/Trusted**: Status `Verified` (pełne zaufanie).

---

### UX i Deep Linking

Przy wywołaniu edycji z **Widoku Szczegółowego Kursu**:

1. System przeskakuje bezpośrednio do **Kroku 3**.
2. Dane Kroku 1 i 2 są załadowane w tle i zablokowane do edycji.
3. Pole **Bulk Entry** jest wypełnione aktualnymi danymi edytowanego kursu.
4. Użytkownik widzi informację o tworzeniu nowej wersji rozkładu.
