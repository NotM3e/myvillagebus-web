# Konwencje projektu

## Git Commits

Format: krótki opis po angielsku, bez prefixów (feat:/fix:), poziom B1+

Przykład:
```bash
git commit -m "Add carrier details modal for admin panel" -m "- Edit carrier name, address, contact
- Three-level status selector
- Sync Cities button
- Audit logging"
```

## Komentarze w kodzie

- Język angielski (B1+)
- Tylko gdy nieoczywiste

## Komponenty

- Funkcyjne (hooks)
- MUI Icons dla ikon
- Tailwind + custom CSS variables (Material Design tokens)

## Nazewnictwo

Zmienne, funkcje - camelCase
Komponenty React - PascalCase
Kolumny w bazie - snake_case
Pliki komponentów - PascalCase.tsx
Pliki lib/hooks - camelCase.ts
