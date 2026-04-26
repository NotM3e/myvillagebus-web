Zawsze przed napisaniem kodu zapoznaj się z plikami w folderze `/doc`, w szczególności z `CONVENTIONS.md`. Moje zasady projektowe są w `PROJECT.md`.
Moje instrukcje dotyczą wszystkich plików w repozytorium (`**/*`), więc stosuj się do nich niezależnie od tego, nad którym plikiem pracujesz. Jeśli masz wątpliwości, sprawdź `CONVENTIONS.md` i `PROJECT.md` lub zapytaj mnie o wyjaśnienie.
Moje pomysły na implementację są w `IMPLEMENTATION.md`. Jeśli pracujesz nad funkcją, która jest tam wymieniona, postępuj zgodnie z opisem i oznacz ją jako "Ukończone", gdy skończysz. Jeśli chcesz dodać nową funkcję, dodaj ją do `IMPLEMENTATION.md` z odpowiednim opisem i trudnością.
Wszelkie plany implementacji (wynik działania fazy "brainstorming" lub "writing-plans") zapisuj najpierw jako pliki markdown w folderze `/.ai-plans`. Czekaj na moją weryfikację tego pliku przed pisaniem kodu.

### SUPERPOWERS EXECUTION RULES: GIT COMMITS
When executing tasks via Superpowers (especially during the TDD cycle):
1. NEVER execute `git commit` automatically.
2. When a task or test is passing (Green/Refactor phase) and is ready to be committed, PAUSE your execution.
3. Read the commit message format rules defined in `/doc/CONVENTIONS.md`.
4. Generate a proposed commit message matching my style.
5. Ask me explicitly: "Here is the proposed commit message. Do you approve me to execute this commit?"
6. Wait for my confirmation ("yes", "ok", or specific changes) before running the actual `git commit` command.