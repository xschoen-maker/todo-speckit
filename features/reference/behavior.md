# Current behavior

Feature 1: register and sign in with username/password, persist session under localStorage key user, welcome the user on the protected home page, sign out and invalidate the server session. Auth pages and home have no MenuBar yet. Required fields, email format, password length and confirmation are validated before submitting. Axios attaches the Bearer token and clears the local session on 401. Unauthenticated navigation redirects to login.

Feature 1's explicit GET /todo/lists acceptance test uses real owned rows; only the signed-in user's lists are returned. Full list management remains Feature 2.

Feature 2: lists are shown in one My Lists view with + New List, Edit list and Delete list actions. Create/rename/delete use dialogs with validation, loading and error states. MenuBar shows the signed-in name and Sign out, hidden on auth pages. Lists are ordered alphabetically.

Feature 3: each list row has an Items icon. Its dialog fetches only that list's tasks, with nested add/edit/delete dialogs. Completion persists; completed titles are struck through. Tasks sort incomplete first then creation time. Deleting a list removes all its tasks. Empty/loading/error states are displayed. Add Item is absent from the main lists view.
