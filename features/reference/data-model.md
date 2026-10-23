# Current data model

- users: id, fName, lName, unique email, unique lowercase username (100), bcrypt password (255), role (default worker), timestamps. Password is excluded by default scope.
- sessions: id, token, email, expirationDate, userId, timestamps. Belongs to User; expires in 24 hours.
- lists: id, name (100), userId, timestamps. Belongs to User. Present for Feature 1's required real list-isolation test; management comes in Feature 2.

Associations are registered in backend/app/models/index.js. Local runtime and test databases are separate.
