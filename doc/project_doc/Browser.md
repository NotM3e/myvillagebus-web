### 1. Jednostka danych: Linia (Route)

Użytkownik zarządza danymi na poziomie konkretnych linii (relacji). Przewoźnik służy jako nadrzędny filtr i tag informacyjny przypisany do linii (zdenormalizowany w Dexie.js dla wydajności).

### 2. Wyszukiwarka Smart Search

Wyszukiwarka działa globalnie w chmurze, przeszukując dwa parametry jednocześnie:

* **Nazwa Przewoźnika**: Wyświetla wszystkie linie danego operatora.
* **Nazwa Miejscowości/Przystanku**: Wyświetla wszystkie linie, które przejeżdżają przez dany punkt (np. wpisanie „Mątawy” pokaże linię PKS-Grudziądz).

### 3. Zakładka: Do pobrania

* Lista linii dostępnych w chmurze, których użytkownik nie posiada w pamięci offline.
* Domyślne sortowanie według popularności w regionie („Lokalne hity”).
* Przycisk **„Pobierz”**: Inicjuje subskrypcję ID Linii i zapisuje ją w lokalnej bazie danych.

### 4. Zakładka: Pobrane

* Główne centrum zarządzania danymi użytkownika.
* **Logika Wyszukiwania**: Tylko linie znajdujące się w tej zakładce są brane pod uwagę przez algorytm wyszukiwania na Stronie Głównej.
* **Zarządzanie**: Możliwość usunięcia linii z pamięci urządzenia jednym kliknięciem.
* **Status aktualizacji**: System porównuje wersję lokalną z chmurą i wyświetla etykietę „Dostępna aktualizacja”, jeśli dane na serwerze są nowsze.