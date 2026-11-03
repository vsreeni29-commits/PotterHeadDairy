# Implementation notes

The browser is the only place diary plaintext is persisted in application state. React Query holds ciphertext and metadata, never decrypted diary objects. Saving and AI processing use separate routes.

A single serialized save queue writes encrypted recovery data before the network call and then performs optimistic revision updates. A stale revision receives HTTP 409 instead of overwriting another window. Conflicted/recovery text remains available for a fresh-phrase reveal and copy. Opening another page first saves the current page.

The vault key is kept in component memory. Visibility changes and an inactivity timer clear the key, writing state, previews, selected AI context, and report state. Async unlock/reveal/import operations verify that the diary has not been sealed while awaiting crypto/network work. Changing absorption preferences does not reveal already absorbed words.

The Council endpoint authenticates the session and entry owner, requires an explicit consent flag, atomically serializes per-user request claims, limits bursts, and rejects reused request IDs. Only a running request's status is saved; journal text and generated reports are not stored there. The browser encrypts a completed report into the entry. Closing the app during a request may discard its response; the already encrypted draft remains available for a later explicit retry.

The complete supplied constitution is runtime instructions. There is no hidden conversation history or automatic memory. Pattern observations can use only the up-to-three prior entries the user deliberately adds after phrase verification.

A response beginning with `[[SAFETY]]` bypasses playful reveal animation and uses plain, immediate rendering. The prompt explicitly asks the model not to invent local crisis numbers. This reflection feature is not clinical care.

Current operational state: Floot preview available; native publishing and account connection are handled through the publishing card. The GitHub repo is a snapshot, not an automatic two-way sync. Never commit preview bearer tokens, account credentials, or journal data.
