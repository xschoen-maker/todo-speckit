# Current behavior

Feature 1: register and sign in with username/password, persist session under localStorage key user, welcome the user on the protected home page, sign out and invalidate the server session. Auth pages and home have no MenuBar yet. Required fields, email format, password length and confirmation are validated before submitting. Axios attaches the Bearer token and clears the local session on 401. Unauthenticated navigation redirects to login.

Feature 1's explicit GET /todo/lists acceptance test uses real owned rows; only the signed-in user's lists are returned. Full list management remains Feature 2.
