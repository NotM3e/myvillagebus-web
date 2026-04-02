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

### SUPERPOWERS EXECUTION RULES: GIT COMMITS
When executing tasks via Superpowers (especially during the TDD cycle):
1. NEVER execute `git commit` automatically.
2. When a task or test is passing (Green/Refactor phase) and is ready to be committed, PAUSE your execution.
3. Read the commit message format rules defined in `/doc/CONVENTIONS.md`.
4. Generate a proposed commit message matching my style.
5. Ask me explicitly: "Here is the proposed commit message. Do you approve me to execute this commit?"
6. Wait for my confirmation ("yes", "ok", or specific changes) before running the actual `git commit` command.