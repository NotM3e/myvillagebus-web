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

- Edycja rozkładów
- Kalendarz (sezonowość)
- System reputacji: Tabela user_activities istnieje, ale brak triggerów/logiki przyznającej punkty
- Wagi głosów: Kolumna verifications.weight istnieje, ale nie jest automatycznie ustawiana (0.5/1.0/1.5)
- Auto-rollback: Mechanizm przywracania poprzedniej wersji przy net_score < -10 nie jest zaimplementowany
- Shadow ban: Flaga profiles.status='shadow_banned' istnieje, ale brak logiki filtrującej dane shadow-banned użytkowników
- Auto-filter przy starcie
- Formularz kontaktowy (własny, nie Web3Forms)