# quizkids

## Google Classroom connector

Parents can connect a kid's Google school account at `/dashboard/classroom` (also linked from the topic picker) to see their classes, teachers, topics, assignments, materials, and announcements, and turn any of them into a guide, quiz, or worksheet. Access is read-only.

Setup:

1. In Google Cloud Console, enable the **Google Classroom API** and create an OAuth client (type "Web application").
2. Add the redirect URI `https://<your-domain>/api/classroom/callback` (and `http://localhost:3000/api/classroom/callback` for local dev).
3. Set the env vars `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Optionally set `GOOGLE_REDIRECT_URI` if the app runs behind a proxy where the request origin differs from the public URL.

Notes: tokens are stored in an encrypted httpOnly cookie (no database table). The Classroom scopes are "sensitive", so until the OAuth app passes Google verification only test users added on the consent screen can connect. School Workspace admins may also need to allow the app for student accounts.
