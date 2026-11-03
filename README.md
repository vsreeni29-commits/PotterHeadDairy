# Potterhead Diary

A quiet, Harry Potter-inspired diary built with Floot: aged parchment, handwritten ink, encrypted private pages, and the user's complete Inner Council constitution.

## What works

- Completed sentences absorb into the page while their underlying text is retained.
- Encrypted draft autosave, an explicit **Save draft** action, and continuation from sealed entries.
- **Submit to Council** alone requests an AI reflection, after a disclosure of what will be shared.
- All nine modes: Diary, Vent, Quick, Roll Call, Council, Judge, Script, Debrief, and Unsent.
- Paragraph-by-paragraph ink emergence, replay/show-all, reduced motion, and immediate rendering of safety responses.
- Chosen name with an optional Potter surname; English or Tanglish reflections.
- Secret-phrase verification before revealing existing writing; auto-lock on backgrounding or five minutes of inactivity.
- Encrypted individual-page export and restore, including restoration into a new vault using the original phrase.
- Responsive web UI, install manifest, and native app metadata for Android/iOS.

## Runtime and source

This repository contains the Floot-native source snapshot, shared UI kit, tests, and migration. Floot supplies the router, serverless endpoint runtime, built-in `@floot/ai` and `@floot/email` modules, hosted Postgres, and Capacitor native builds. This is not an Expo or standalone Vite project; `npm install` alone does not start the app.

Floot project: `e3f29e1a-af28-4068-a58d-30ca5918f420` (Potterhead Diary).

The working app lives in that Floot project. This commit is a source snapshot; edits made directly on GitHub do not automatically update Floot. Apply changes through the Floot MCP, then publish from Floot. Built-in `@floot/*` packages are runtime services and must not be installed from npm.

- `pages/_index.tsx`: diary and sealed-page workflow.
- `helpers/useDiary.tsx`: encrypted state, serialized saves, recovery, and submission.
- `helpers/DiaryCrypto.tsx`: browser encryption and key derivation.
- `helpers/InnerCouncilPrompt.tsx`: complete 39-section runtime constitution.
- `docs/INNER_COUNCIL.md`: readable copy of that constitution.
- `endpoints/diary/`: authenticated vault, entries, and explicit Council submission.
- `migrations/001_diary.sql`: diary schema; Floot's auth provisioning creates the auth schema first.
- `floot-project.json`: non-secret project settings and asset mapping.

## Privacy model

Saved journal text, profile preferences, and reflections are encrypted in the client with AES-256-GCM, fresh 96-bit nonces, and purpose-bound associated data. A non-extractable key is derived from the user's secret phrase using PBKDF2-SHA-256 with 600,000 iterations and a random 128-bit vault salt. The phrase and key are not sent to the server or saved to browser storage. Failed saves keep a ciphertext recovery copy on the device.

Account authentication is separate. The server stores the account email/display name and encrypted diary records, plus timestamps, revision numbers, and minimal AI request status. It checks record ownership on every diary request. The archive does not expose titles, emotion labels, text, or reflection content.

**AI processing is a distinct disclosure:** on explicit Submit, the current entry and up to three prior pages the user deliberately selected are sent as readable text to Floot AI. The app does not persist that readable request or response on its backend. The response uses `store:false`; this is not a guarantee about upstream provider operational retention. Saved reflections are encrypted in the browser. Visitor analytics are disabled.

The secret phrase cannot be recovered. An account password reset does not decrypt the diary. Browser/device access while the diary is open, malicious extensions, and changed client code remain outside the protection offered by saved-data encryption.

## Account setup

Open the app and sign in or create an account. Floot's provisioned owner account initially has no password: use **Forgot password?** with the email used for Floot, complete the emailed-code reset, then sign in. Choose a separate diary secret phrase of at least 16 characters.

Before general public password-reset email is needed, verify a sender domain in Floot's Email service and configure the sender in the seeded reset endpoint. Without a verified domain, the default reset sender can deliver only to the project owner.

## Verification completed

- Floot TypeScript check: clean.
- 2 Jasmine spec files pass: crypto round-trip/Unicode, non-extractable key, randomized nonces, wrong-phrase rejection, tamper detection, associated-data isolation, minimum phrase length, and sentence boundaries.
- 15 live backend checks pass: unauthenticated rejection; separate vaults; duplicate-vault protection; ciphertext draft saving; plaintext-free metadata; cross-account read/write/AI denial; optimistic revision checks; plaintext payload rejection; explicit AI consent; live Quick reflection; and duplicate-request protection.
- Disposable synthetic test accounts and their data were removed.
- Desktop rendering inspected. Real-device sign-in, soft-keyboard behavior, and native distribution still require device verification.

## Android and iPhone distribution

Floot wraps this web UI with Capacitor. Bundle ID: `com.sreeni.potterheaddiary`. The app icon, manifest, system-bar colors, and responsive UI are configured.

No APK or iOS distribution artifact is included in this source snapshot. Start the native publishing flow in Floot and connect the requested app-store/developer accounts. Native test builds are initiated in Floot's web UI. iPhone distribution proceeds through Apple's supported signing/TestFlight/App Store flow; an unsigned IPA is not a generally installable download.

Do not add a custom service worker: Floot does not support it. Native builds and web publishing are handled by Floot.
