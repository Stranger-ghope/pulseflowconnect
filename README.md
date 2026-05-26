# PulseFlow Connect

PulseFlow Connect is a distinct proof-of-concept platform that demonstrates offline-first community access, moderated engagement, WhatsApp opt-in, reporting workflows, and live operational analytics.

## Why this POC exists

This POC is intentionally not a replica of any client project. It demonstrates the delivery patterns required for a larger digital ecosystem:

- Offline-ready PWA for low-bandwidth environments
- Local service discovery and availability indicators
- Practical resource library with cacheable content
- Access barrier reporting and escalation status
- Moderated topic-based community spaces
- WhatsApp opt-in flow suitable for Meta Business Cloud API integration
- Multi-channel dashboard indicators for PWA, WhatsApp, community, hotline, and campaign activity
- Privacy-conscious messaging approach that avoids sending sensitive details through WhatsApp

## Cross-platform support

The app is built as a Progressive Web App and can run on:

- Android phones through Chrome or supported browsers
- iPhone through Safari with Add to Home Screen
- Laptops and desktops through modern browsers

Android and desktop browsers generally provide the strongest PWA support. iOS supports installable PWAs, with platform-specific limitations for some background behaviours.

## Demo scope

The current version includes a service worker, web app manifest, offline shell caching, local report persistence, a community-facing PWA, a demo admin dashboard, Facebook/Instagram community links, and a small server endpoint for WhatsApp Cloud API testing. If Meta credentials are not configured, the endpoint returns a safe demo response.

## Suggested demo script

1. Open the community app and explain that PulseFlow helps users find nearby support, read saved guides, report access problems, and request safe phone updates.
2. Tap Find services to show service discovery.
3. Tap Read guides to show cacheable learning content.
4. Tap Report issue and save a sample access problem to show local persistence.
5. Tap Get updates, enter a first name and phone number, and explain that WhatsApp is used for neutral reminders that bring users back to the app.
6. Switch to Admin dashboard and use Login as admin.
7. Show the metrics, follow-up queue, Send update buttons, and channel status.
8. Explain that production WhatsApp messages would use Meta Cloud API credentials and approved templates.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

This project is ready for Vercel deployment from GitHub.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Use the Vite framework preset.
4. Confirm the build command is `npm run build`.
5. Confirm the output directory is `dist`.
6. Add WhatsApp environment variables in Vercel only if testing live WhatsApp:

```text
WHATSAPP_API_VERSION=v20.0
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_TOKEN=your_server_side_token
```

Do not commit a real `.env` file. The deployed API route is available at `/api/whatsapp/notify`.

## Preview the installable PWA

```bash
npm run build
npm run preview
```

Open the preview URL in a browser. On Android or desktop Chrome, use the install icon. On iPhone, open in Safari and choose Add to Home Screen.

## Run with the WhatsApp endpoint

```bash
npm run build
npm start
```

The updates form calls:

```text
POST /api/whatsapp/notify
```

Create a local `.env` or set server environment variables using the keys shown in `.env.example`:

```text
WHATSAPP_API_VERSION=v20.0
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_TOKEN=your_server_side_token
```

Do not place Meta tokens in frontend code. Messages in this POC are intentionally neutral and do not include sensitive report details.

For approved WhatsApp templates, use `{{1}}` for the user's first name or nickname. If a name is not supplied, the backend-safe fallback is `PulseFlow user`.

## Suggested proposal framing

The attached POC is a distinct community support platform designed to demonstrate the same delivery capabilities required by a digital ecosystem assignment: offline-first PWA architecture, WhatsApp Cloud API readiness, moderated digital engagement, service access reporting, multi-channel analytics, and privacy-conscious dashboarding. It is intentionally not a replica of the proposed project.

## Submission note

This POC is designed to demonstrate implementation readiness rather than final production scope. The production version would add authenticated user accounts, role-based admin access, database persistence, Meta-approved WhatsApp templates, delivery/read webhooks, content moderation workflows, and deployment monitoring.
