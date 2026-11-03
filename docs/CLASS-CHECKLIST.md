# Todo rebuild verification

Completed locally on October 23, 2026 using the course Todo specs, Vue 3/Vuetify 4, Express, Sequelize and MySQL (XAMPP).

- [x] Imported the full OC-ComputerScience/todospeckit ZIP with fresh Git history.
- [x] Previewed and applied the reset; main remains the scaffold.
- [x] Created dev and five feature branches in the specified order.
- [x] Feature 1: registration, login, server sessions, route guards and logout.
- [x] Feature 2: private lists, single-view dashboard and list dialogs.
- [x] Feature 3: owned todo items, nested dialogs, completion and list-delete cascade.
- [x] Feature 4: self-only profile API, profile dropdown, edit dialog and single logout entry point.
- [x] Feature 5: optional calendar due dates, edit/clear and overdue styling.
- [x] Updated living API, data-model and behavior reference documents.
- [x] npm test: 63 backend tests and 49 frontend tests pass.
- [x] Production frontend build passes.
- [x] Browser checks: registration, persistence after refresh, logout/login, list creation, item dialogs, task creation/completion, profile save, due-date set and clear.
- [ ] Demonstrate the app to the professor or GA.
- [ ] Submit the repository link when the student decides to turn it in.

Reverified November 2, 2026: all 63 backend tests, all 49 frontend tests, and the production build pass. Features 1–5 are pushed to GitHub on their feature branches and merged into dev; main remains scaffold-only. The Canvas submission is left to the student.

## Specification notes

Feature 1 explicitly requires a real GET /todo/lists ownership acceptance scenario. Its minimal list model/read endpoint was implemented with authentication so the exact scenario passes; full management follows in Feature 2. The detailed Feature 2/3 specs govern the single-view dialog layout instead of the older sidebar wording in the overview.

Test Coverage Map filenames for Feature 3/5 point to Dashboard.items.test.js, which exercises the extracted ItemsDialog component. Acceptance behavior and scenario titles are unchanged. Agility deferred; owner: student. No stories or acceptance scenarios were changed.

## Local runtime notes

Node 24.21 and npm were already installed. Node 24.21 produced Windows file-operation errors in reset and build. The bundled Node 24.19 runtime completes those tasks. Vite's runner configuration loader avoids temporary-config-file errors in the class npm commands. No security settings were changed.

Deployment is optional and local workflow changes require ENABLE_DEPLOYMENT=true before the SSH deployment jobs run. Tests remain enabled. No server credentials were configured.
