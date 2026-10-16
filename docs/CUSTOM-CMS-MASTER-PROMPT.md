# Master Prompt — Custom Git-Backed CMS (driven by `.pages.yml`)

Paste everything below the line into Claude Code at the root of the target repo. **Companion files required in the workspace:** `docs/PAGES-CMS-ALL-IN-ONE-MASTER-PROMPT.md` and `pages-yml-sample.yml`. This CMS is driven entirely by `.pages.yml`. If the site doesn't have one yet (it was never set up for Pages CMS), Step 0 builds it first with the all-in-one prompt. Either way, the custom CMS ends up exposing, locking and committing exactly what Pages CMS would, so the two editors always agree.

---

Build a fully custom, database-free CMS inside this Astro repo, at `/admin`. It edits the repo's content JSON and images and commits straight to GitHub. It must show **exactly** what the repo's `.pages.yml` (Pages CMS config) exposes: same entries, same arrangement, same labels and descriptions, same read-only fields and list limits. It needs:

- a **login gate** with per-person accounts (managed inside the CMS), not a shared password;
- a split-screen editor with a Payload-style live preview of the **real** page;
- **image uploads** through a media library, not typed image paths;
- one branded **confirmation dialog** for every "are you sure?";
- styling with the site's own brand tokens.

## Ground rules

- **Do not `git commit` or `git push` unless I explicitly ask in that turn.** Leave all changes uncommitted and tell me what changed.
- Read before you change anything: `.pages.yml` (including its `media:` root), `src/content.config.ts`, the routes that render each exposed file, `src/config/site.ts` (token replacement such as `localizeData`), `src/middleware.ts`, `astro.config.*` (and Astro's built-in `security.checkOrigin`), `src/styles/global.css` (brand tokens), and the deploy config (`vercel.json`, `wrangler.*`, …).
- No database, no external CMS or auth service. GitHub API + files in the repo only.
- `.pages.yml` is the single source of truth for what is editable. **Never** hardcode a field list in the CMS, and never expose a file, key or section that `.pages.yml` doesn't.
- Keep diffs minimal. Use Node's stdlib (`node:crypto` scrypt/HMAC) and installed packages (e.g. `js-yaml`, `@octokit/rest`). No auth or upload libraries. Match the surrounding code style. No abstractions with one user.

## Step 0 — Make sure the site is set up for `.pages.yml` first

The custom CMS has no field list of its own, so `.pages.yml` has to be correct before anything below is built.

1. **No `.pages.yml` (or `.pages.yaml`)?** The site was never set up for Pages CMS. Run **all of** `docs/PAGES-CMS-ALL-IN-ONE-MASTER-PROMPT.md` (Phases 0–4, its Final verification and its Final report) in this session before Step 1. Follow its ground rules exactly. It also makes the site's code changes the CMS depends on: content moved out of hardcoded literals into JSON, global singletons and placeholder blocks, the `<p>` unwrap in `localizeData()`, the `\n` → `<br>` helpers, `pageUrl` backfill, the franchise-lock array split and the global CTA/map fallbacks.
2. **`.pages.yml` exists?** Audit it against the all-in-one prompt's **Final verification**, items 1–6: it parses, no nameless fields, every rich-text field has `format: html`, `order` is declared on every sorted block, collections have `filename`, the placeholders are complete and `pageUrl` is backfilled. Also check whether the franchise lock has been applied. If anything fails or is missing, run only the all-in-one phases that fix it. Rebuilding a working config from scratch is not needed.
3. Ask the all-in-one Phase 0 business questions together with this prompt's Step 1.5 questions, in **one** message.
4. Treat the all-in-one prompt's **Phase 2 regression script and repair steps** as applying to this CMS's commits too (`Update <path> (via custom CMS by <email>)`). The lock below makes dropped keys impossible, but content damaged before the lock existed still needs repairing.

Only continue to Step 1 once `.pages.yml` passes that verification.

## Step 1 — Inventory, then confirm with me

1. List every `.pages.yml` entry as it will appear in the sidebar: groups (nested groups as `Pages → Indoor Billboards`), `type: file` entries, and each `type: collection` expanded into its files (honouring `exclude`, `filename`/`extension` and `subfolders`; sorted by `view.sort` / `view.default.sort`, e.g. `navOrder`; labelled by the `view.primary` field, e.g. `navLabel`, falling back to `title`). Add a final **CMS** group: **My account** (everyone) and **Accounts** (admins only).
2. Note which files are shared by several entries (e.g. `site.json` behind Site Settings, Popup and Map).
3. Note the hosting target. The API routes and `/admin` itself need an adapter (e.g. `@astrojs/vercel`) and `export const prerender = false`. Every site page must stay static.
4. Check whether the repo is private (an unauthenticated `GET https://api.github.com/repos/<owner>/<repo>` returns 404). Accounts are stored hashed in the repo; tell me if it's public.
5. Ask me only what you can't verify yourself: which branch commits should go to, and the owner email.

## Step 2 — Files to create or update

| File | Purpose |
|---|---|
| `src/lib/cms.ts` | Pure, framework-free logic: `parseConfig(yaml)` → flat entries with their group path; `fieldsFor(entries, path)` → the **union** of fields from every entry that owns the path (or `undefined` = not editable); `mergeFields(fields, current, incoming)` → the server-side lock (Step 3); `parseMedia(yaml)` → the `media:` root; `sniffImage(bytes)` and `safeImageName(name, ext)` for uploads; `MAX_UPLOAD_BYTES`. |
| `src/lib/cms-server.ts` | Server-only: `env()`, `HttpError` + `handle()` (uniform JSON errors), `github()` (read / exists / listFiles via one recursive tree call / write, authored by the token owner, returning `{ sha, commit }` / `deployStatus(ref)`), scrypt password hashing, HMAC-signed sessions, account loading/saving, `login()`, `currentUser()`, `requireUser(ctx, role?)`. Write it so `node` can import it directly: no path aliases, no TS parameter properties. |
| `src/lib/cms.test.ts` | One `node:assert` self-check that runs against the **real** `.pages.yml` and content (`node src/lib/cms.test.ts`). |
| `src/pages/api/auth.ts` | `GET` → current user · `POST { email, password }` → sign in (sets cookie) · `DELETE` → sign out. |
| `src/pages/api/users.ts` | `GET` list (admin) · `POST` add/update (admin) · `PATCH` change my own password · `DELETE` remove (admin). |
| `src/pages/api/media.ts` | `GET` → images under the media root · `POST` multipart `file` → validated upload, committed to the repo; returns `{ path, commit }`. |
| `src/pages/api/deploy.ts` | `GET ?ref=<40-hex commit sha>` (anything else → the branch head) → `{ commit, state, description, url }`: the deploy status the host posts to GitHub for that commit (Step 6, **Deploy status**). Signed-in users only. |
| `src/pages/api/save.ts` | `GET ?path=` → `{ content, sha }` read fresh from GitHub. `POST { path, content, sha }` → merge through the lock, then commit; returns `{ sha, commit }` (the file's new blob sha for the next save, and the commit sha for deploy tracking). |
| `src/pages/admin/index.astro` | On-demand, `noindex`, `Cache-Control: no-store`. Checks the session on the server and redirects to `/admin/login` before sending any HTML. Reads `.pages.yml?raw` to build the sidebar and passes `{ items, user, maxUpload }` to a vanilla-TS client script. |
| `src/pages/admin/login.astro` | Static, `noindex` sign-in page. |
| `src/styles/cms.css` | Shared admin theme (tokens, inputs, buttons, dialogs) for both admin pages. |
| `src/middleware.ts` | `X-Frame-Options: SAMEORIGIN` (not `DENY`) so `/admin` can frame the real pages. Still blocks cross-origin framing. |
| `astro.config.*` | Adapter (if needed) and `/admin` excluded from the sitemap. |
| `.gitignore` | Adapter output (e.g. `.vercel/`). |
| `.env.example` | Document `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN` (fine-grained, this repo only: **Contents: Read and write** + **Commit statuses: Read**), `GITHUB_OWNER`, `GITHUB_REPO` and optional `GITHUB_BRANCH`. **Placeholders only.** This file is committed, so real values go in the host's env vars (and an untracked `.env`). Before reporting, check that it contains no real token, password or secret. |

## Step 3 — The lock (server-side, never trust the browser)

The client sends the whole object it edited, and the server rebuilds the file from the **current GitHub version**:

- Start from `current`. Copy over only keys whose field `.pages.yml` exposes. Unexposed top-level keys, unexposed keys inside objects (e.g. `metadata.openGraph`) and unexposed keys inside list items are always kept from `current`. This mirrors Pages CMS `merge: true`, and is stricter inside arrays.
- `readonly: true` fields: always taken from `current` (e.g. `order`, `pageUrl`, a Map section's heading).
- `type: block` lists: a section's `blockKey` value (e.g. `section: "Hero"`) comes from `current` and can't be changed. Apply that block's own fields only.
- `list: { min, max }`: reject with 400 when the submitted length is outside the limits (`min = max` means a fixed section count).
- `required` strings can't be blank. `select` values must be in `options.values`. `number` must be finite (empty removes the key). `boolean` is coerced.
- Paths: only `src/content/**.json` matching `^src/content/[a-z0-9-]+(/[a-z0-9-]+)*\.json$` **and** owned by a `.pages.yml` entry. Collections honour `subfolders: false`. Anything else returns 403. The accounts file is outside `src/content`, so the content editor can never touch it.
- Concurrency: the client sends the `sha` it loaded. If GitHub's current sha differs, return 409 ("changed since you opened it, reload"). Pass the sha to `createOrUpdateFileContents` as well.
- Output: `JSON.stringify(merged, null, 2)`, keeping the file's existing trailing newline (or lack of one) so unchanged saves are byte-identical. If nothing changed, return `{ unchanged: true }` without committing.
- Every commit names the signed-in CMS user in the message, so git history is the audit log. **Don't set the commit `author`** to the CMS user. Leave it out so the token's owner is the author. Vercel (and similar hosts) block deploys of commits whose author email isn't a member of the hosting team. The commit still lands on GitHub, but the site silently never updates. If the owning entry has `commit.templates.update` (from all-in-one Phase 3), render it with `{path}` and `{name}` and replace `(via Pages CMS)` with `(via custom CMS by <email>)`, so the live-URL link stays in the message. Otherwise use `Update <path> (via custom CMS by <email>)`. Image uploads use `Upload <path> (via custom CMS by <email>)`.
- Read env with `process.env[key] ?? import.meta.env?.[key]` so it works in dev, on serverless and under plain `node` (tests).

## Step 3b — Parity: honour every key the all-in-one `.pages.yml` uses

The custom CMS must behave like Pages CMS for every construct the all-in-one prompt writes. Where Pages CMS has a known flaw that the all-in-one prompt works around, keep the workaround's *result* but don't copy the flaw.

| `.pages.yml` construct | Custom CMS behaviour |
|---|---|
| `settings.content.merge: true`; several `type: file` entries on one path | The lock (Step 3) unions the fields of every entry that owns the path and keeps everything else from `current`. Each entry's form shows only its own fields. |
| `type: block` + `blockKey`, YAML anchors/aliases | `js-yaml` resolves the anchors. The block type is fixed (Step 3), and each section gets only its own block's fields, so undeclared keys can never be dropped (all-in-one Phase 2's "dropped field" bug is impossible here). |
| `rich-text` + `options: { format: html }` | The rich-text editor (Step 6), which stores the value as HTML: no markdown, no added `<p>` wrapper, and existing `style`/`class` attributes are kept. `cms.test.ts` fails if any rich-text field lacks `format: html`, because Pages CMS would still corrupt it. |
| `text` fields that the site renders with `\n` → `<br>` | A textarea that saves real newlines. The preview converts `\n` → `<br>` before matching, like the component does. |
| `list.collapsible.summary` | The card title renders `{index}` / `{fields.x}` with **HTML tags stripped** (better than Pages CMS, which shows raw `<p>`). |
| `list: true` (string arrays), `list: { min, max }` | Same add/remove limits as Step 6. `min = max` shows "N (fixed)". |
| `readonly: true` (`order`, `pageUrl`, locked Map headings) | Disabled control + "Read-only" badge + verbatim `description`. The server always keeps the value from `current`. |
| `hidden: true` | Not rendered. The value is always kept from `current`. |
| Placeholder blocks (`_managed`, `label: " "`) | Show the block's `description` only, with no input. `_managed` is never written to the JSON. |
| The franchise lock's `editableSections` split | Just another block list field. `sections` isn't exposed, so the lock keeps it from `current`. |
| Verbatim franchise descriptions (⚠ shared-section, read-only `order`) | Rendered character-for-character under the field label. Never rephrased. |
| Collection `filename` / `extension` / `exclude` / `subfolders: false` | Decide which files are listed **and** which paths `/api/save` accepts. |
| Collection `operations: { create/rename/delete: false }` | Matches the default: this CMS never creates, renames or deletes entries. If an entry allows any of them, report it as not built. |
| `view.primary` / `view.sort` (`navLabel`, `navOrder`) | Sidebar label and order (Step 1). |
| `commit.templates` | Commit message (Step 3). |
| `media: { input, output }` | Media library root and stored paths (Step 5). |
| Field with no `name` | `parseConfig` throws a clear error naming the entry, instead of rendering a broken form. |

## Step 4 — Login gate and accounts (no database)

**Accounts:**
- **Site owner:** `ADMIN_EMAIL` + `ADMIN_PASSWORD` from env. Always an admin. It can't be edited, demoted or removed in the CMS, and its password is changed only in env. This is the bootstrap account.
- **Everyone else:** `.cms/users.json` in the repo (`[{ email, name, role: "admin" | "editor", hash, createdAt }]`). Not under `src/content` or `public/`, so the site never serves it and the content editor can't write it. It's created on the first account added and committed through the GitHub API with sha checks.
- Emails are trimmed and lowercased. Passwords need 10+ characters. Hashes use `scrypt$<salt b64>$<key b64>` (16-byte salt, 64-byte key) and are verified with `timingSafeEqual`.
- **Roles:** editors edit content and upload images. Admins also manage accounts. An admin can't change their own role or remove themselves. Adding someone whose email already exists returns 409. Unknown roles return 400.

**Sessions:**
- Stateless, signed with `SESSION_SECRET` (32+ chars; refuse to issue sessions without it). The token is `base64url({ e: email, f: fingerprint, x: expiry }).HMAC-SHA256`, valid for 8 hours.
- The fingerprint is a short SHA-256 of the user's password hash (`owner:<ADMIN_PASSWORD>` for the owner), so **changing or resetting a password signs that person out everywhere**. Changing your own password re-issues your cookie.
- Cookie `cms_session`: `HttpOnly`, `SameSite=Strict`, `Secure` on https, `Path=/`.
- `currentUser()` re-checks the account on every request (30s per-instance cache, refreshed on every accounts write), so removed accounts lose access. Mark the cache ceiling with a `ponytail:` comment.
- `requireUser()` returns 401 when signed out, 403 when the role is too low, and 403 for non-GET requests whose `Origin` doesn't match. Astro's own `checkOrigin` also rejects cross-site form posts.
- Login: when the email doesn't exist, still run one scrypt hash so response times don't reveal valid emails. Return the same "Wrong email or password" either way. There's no lockout (no database); note it with a `ponytail:` comment and suggest a WAF rate-limit rule on `/api/auth`.

**Pages:**
- `/admin/login`: brand mark (the site logo at ~64px tall, with `width`/`height` attributes matching its aspect ratio, so it's legible rather than a 40px smudge), Email, Password, a gold **Sign in** button with spinner, inline error (`role="alert"`), and "Forgot your password? Ask an admin to reset it." If already signed in, go straight to `/admin`.
  - The **Password** field has a **Show / Hide** toggle: a `type="button"` text button inside the field's right edge (wrapper `position: relative`, input `padding-right` so typed text never runs under it), with `aria-controls="password"` and `aria-pressed`, swapping the input between `type="password"` and `type="text"`. Use a plain text button in the accent colour, not an icon: no asset needed and it reads clearly.
- `/admin`: the server redirects to `/admin/login` when there's no valid session. Any API call that later returns 401 opens the confirmation dialog ("Session expired", **Sign in** / **Stay here**). Never redirect silently and drop unsaved work.
- **My account and Accounts open as modals, not pages.** Clicking either sidebar item opens one reusable panel `<dialog class="cms-dialog cms-item-dialog cms-panel">` (~760px wide, `max-height: 85vh`, a scrolling body). It has a header with the title, an optional description and a **✕** close button, and Esc closes it. `navigate()` handles the two `cms:` keys **before** the unsaved-changes check, and never changes `activeNav`, the URL hash or the preview. The entry being edited, and any unsaved work in it, stays exactly as it was underneath. Don't deep-link `#cms:…` on load; fall back to the first entry.
  - Why: as full-width pages they were either cramped (squeezed into the 460px form column beside an empty "no preview" pane) or far too spacious (stretched across the screen). A modal fits the content.
  - Inside the panel, the **Add account** form spans the full panel width so it lines up with the accounts table: a two-column grid (`.cms-form-grid`, `align-items: start`; put a field's help text **under** its control, e.g. the Role description, so labels and inputs in both columns stay level) with Name | Email and Role | Temporary password, the heading and error spanning both columns, **Add account** right-aligned, and one column under 640px. A narrow capped form under a full-width table looks misplaced. My account's change-password form uses the same grid: **Current password** across both columns (`.cms-span`), **New** | **Confirm** side by side, and the "At least 10 characters…" note spanning below them. Selects in the accounts table are compact (`width: auto`, ~96px min, the same padding and font size as `.cms-btn-sm`), so they line up with Rename / Reset password. My account's name/email/role `<dl>` is a two-column grid (`max-content 1fr`, `dd { margin: 0 }`); without it, browser defaults indent each value 40px under its label.
  - Confirmations (`ask()`) and the password share dialog stack on top of the panel. Toasts must too: a modal `<dialog>` is in the top layer, above any `position: fixed` toast stack, so `toast()` moves the toast container into the topmost `dialog[open]` (or back to `body`) before appending.
- **CMS → My account:** name, email and role, plus a change-password form (current, new, confirm). The owner sees a note that their credentials live in env vars.
- **CMS → Accounts** (admins): every account with an inline role select (confirmed in the dialog) and **Rename**, **Reset password** (dialog with a generated password field) and **Remove** (danger dialog). The owner row is locked and says why. There's also an **Add account** form: name, email, role, and a temporary password with a **Generate** button, confirmed in the dialog, with a reminder to share the password securely.
- **Passwords are never shown after the fact.** Only the scrypt hash is stored, and `.cms/users.json` is committed to the repo, so there's no "current password" to display. Never store passwords in plaintext or reversibly to make them viewable. Instead, after **Add account** and after **Reset password** succeed, open the confirmation dialog once as a **share** step: title "Password for <name>", a **read-only** input holding the password (add `readonly` to `ask()`'s input options), the message that it can't be shown again and should be shared securely, and **Copy password** (`navigator.clipboard.writeText`, toast "Password copied.", or reopen the dialog if copying fails) / **Done**. Only open it when the save succeeded. If a password is lost, the answer is **Reset password**.
- **Hide stored rows with the owner's email** in `GET /api/users` (e.g. a row added before `ADMIN_EMAIL` changed). Login always matches the owner first, and edits to the owner's email are refused, so such a row can't be used or managed and would only show up as a duplicate "(you)".

## Step 5 — Media uploads (no typed image paths)

- `type: image` fields show a thumbnail, **Choose image** / **Replace image** and **Remove** (danger dialog, hidden when `required`), with the stored path as a small caption. There's no free-text path input.
- **Media library dialog:** a searchable grid of every image under the `.pages.yml` media root (`GET /api/media`, one recursive git-tree call, mapped `input` → `output` paths), plus an **Upload image** button. Clicking an image selects it. Images not deployed yet show "Available after the next deploy" instead of a broken thumbnail.
- **Upload rules (server):** max 3 MB (base64 adds ~33%, so this stays under Vercel's 4.5 MB request limit; also check on the client first). Detect the type from the file's **magic bytes** (PNG, JPG, GIF, WebP, AVIF), never from the name or MIME type. **Refuse SVG**: it can carry scripts and would be served from the CMS's own origin. Slugify the name, save to `<media input>/uploads/`, and never overwrite an existing file (add `-2`, `-3`, …). Commit it immediately, naming the user in the message.
- After an upload, use a `blob:` URL of the local file for the thumbnail and the live preview until the deploy serves the real path.

## Step 6 — The editor (`/admin`)

**Layout:** a three-column grid on `lg+`: sidebar | form | preview. It stacks on small screens with 16px gutters and no horizontal scroll.

Header: brand mark (the logo at 40px tall, with the header's vertical padding trimmed to ~7px so the header keeps the height the layout's `calc(100vh - <header>)` assumes), "Content Editor", an "Unsaved changes" pill, the signed-in name / email · role, a **deploy status** pill (below), dark/light toggle, **Sign out** (confirmed; it becomes a danger dialog when there are unsaved changes), and a gold **Publish to GitHub** button. Publish is disabled until something changes and is confirmed in the dialog ("Publish "<page>"? … goes live once the site finishes deploying"). It shows a spinner while saving and reports the result in a toast.

**Deploy status (is it live yet?):** don't make editors guess whether a publish reached the site. Hosts like Vercel post a **commit status** to GitHub for every deploy (context `Vercel`; `pending` while building, `success` "Deployment has completed", `failure` "Deployment was blocked" or a build error, `error`), so the CMS reads it with the GitHub token it already has. No host token or webhook is needed.
- Server: `github().deployStatus(ref = branch)` calls `GET /repos/{owner}/{repo}/commits/{ref}/status` and picks the status whose context starts with `Vercel` (skipping "Vercel Preview Comments"), returning `{ commit, state | null, description, url: target_url }`. `/api/deploy` only accepts a full 40-hex sha as `ref`; anything else means the branch head.
- Client: a pill in the header, next to "Unsaved changes", rendered as an `<a target="_blank" rel="noopener" role="status" aria-live="polite">` that opens **the live page being edited**: `new URL(<previewed path>, location.origin)`, the same path as the preview (the entry's `pageUrl` pathname, `/` for settings and CMS views), on the site the CMS is deployed on. **Never link it to the host's dashboard** (Vercel); editors want to see their page, not a build log. Update the link whenever another entry opens. Keep the pill's declaration and the previewed path next to the preview code, because `showPreview` runs before the deploy section. It has a coloured dot (pulsing while running, no pulse under `prefers-reduced-motion`) and its `title` shows the status description plus the short commit, followed by "Opens <url>". Keep the status text in a `data-info` attribute and rebuild the `title` from it, so switching entries doesn't keep appending:
  - **Deploying…** (`pending`, gold), polled every 10s;
  - **Waiting for Vercel…** (no status yet, up to 3 minutes after a publish), polled every 10s;
  - **Live** (`success`, a green `--ok` token, since the site has no green; define it for light and dark);
  - **Deploy blocked** / **Deploy failed** (`failure`/`error`, red; "blocked" when the description says so).
- On page load, show the branch head's status, so a deploy started elsewhere (an IDE push, another editor) is visible too. Hide the pill when there's no status at all (host not connected, or an old commit).
- After every publish and every image upload, track **that** commit (the `commit` returned by `/api/save` / `/api/media`), not the head. Otherwise a stale head status could falsely say "Live".
- Stop polling once the state is final. When a run you watched finishes, tell the editor with the **centered confirmation dialog, not a corner toast**. A toast fading in a corner is easy to miss, and "is it live?" is the one moment editors are waiting for.
  - On **Live**: reload the preview iframe so it shows the deployed page. Then open the dialog with a ✓ icon, the title "Your changes are live!" and the message "The site finished deploying, so visitors can see your edits now." Its buttons are **View live page** (opens the pill's live URL in a new tab with `noopener`) and **Close**.
  - On blocked/failed: open a **danger** dialog titled "Deploy blocked" or "Deploy failed". The message is "Your changes were saved to GitHub but aren't live yet.", followed by the host's description on the next line. It has a single **OK** button.
  - The result can arrive while another dialog is open (the media library, a confirmation), and `showModal()` on an already-open dialog throws. Route these through a small `notify(opts)` that falls back to a toast when `#cms-dialog` is already `open`. **Never fail silently.** If `/api/deploy` errors, show a dashed **Deploy status unavailable** pill whose `title` is the error, and retry every 60s; on 401 stop (the session-expired dialog takes over). The usual cause is the token: `deployStatus` turns GitHub's 403/404 on the status endpoint into "The GitHub token can't read deploy statuses. Give GITHUB_TOKEN "Commit statuses: Read" (fine-grained) or the repo scope (classic)." Document that permission next to `GITHUB_TOKEN` in `.env.example` (fine-grained: **Contents: Read and write** + **Commit statuses: Read**).
- The pill sets `display: inline-flex`, so add `.cms-deploy[hidden] { display: none }`. Author `display` rules beat the `hidden` attribute.
- Mention the deploy status in the publish toast ("Published. The deploy status is shown at the top.").

**Confirmation dialog (one for the whole CMS):** a native `<dialog>` with `showModal()`, so you get focus trapping, Esc to cancel and a dimmed, blurred backdrop for free. It has a title, message, icon, **Cancel** and a confirm button. Its tones are **primary** (gold button, "?" icon) and **danger** (red button, "!" icon, focus starts on Cancel). An optional single input with min-length validation is used for rename and reset password. Expose it as `ask({ title, message, confirmText, cancelText, tone, icon, input }) → Promise<false | true | string>`. `icon` overrides the "?"/"!" glyph (e.g. "✓" for the live notice). `cancelText: ""` hides **Cancel** for a single-button notice; focus then goes to the confirm button, even with the `danger` tone. Use it for discarding unsaved changes when switching entries, removing list items or sections, removing an image, publishing, signing out, session expiry and every account action. **Never call `window.confirm/alert/prompt`.** The only exception is the browser's own `beforeunload` prompt, which can't be styled.

**Theme:** only the site's own tokens from `global.css` (`--color-primary*`, `--color-neutral*`, `--color-gold` for primary actions only), mapped in `cms.css` to semantic variables (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`, `--danger`). Use shared `.cms-input`, `.cms-btn`, `.cms-btn-primary`, `.cms-btn-danger` and `.cms-dialog` classes and the site font.
- **Light by default; dark only when the editor picks it.** Dealer logos are almost always drawn for a light background, and a dark navy mark vanishes on a dark card. So **don't** follow `prefers-color-scheme`:
  - Put the dark overrides under `:root[data-theme="dark"]` only.
  - Set `data-theme` before first paint from `localStorage`, wrapped in try/catch.
  - Make the ◐ toggle decide on `dataset.theme === "dark"` alone, with no `matchMedia`.
  - If a site already shipped the OS-following version, rename the storage key (e.g. `cms-theme` → `cms-theme-v2`). Otherwise editors who once clicked the toggle stay stuck on a stale "dark".
- **The logo must stay visible in both themes.** In dark mode, give the header and login logos a white backing: `:root[data-theme="dark"] :is(.cms-brand, .cms-login) img { background: #fff; padding: 4px 8px; border-radius: 6px }`. With global `box-sizing: border-box` the padding sits inside the set height, so the header doesn't grow. Use a light logo variant instead only if the site has a genuinely different file; `site.json`'s `whiteSrc` often points at the same dark image.
- **`.cms-btn` on `<a>`:** add `text-decoration: none`, so link-buttons (Open ↗, View live page) look like the other buttons.
- **Scroll containers clip focus rings.** Any `overflow: auto` box that holds inputs (e.g. the add-item modal body) needs a few px of inner padding, cancelled by a matching negative margin. Otherwise the focused field's outline is cut off at the edge and the field looks broken.
- **The site's own CSS leaks into `/admin`.** With `cssCodeSplit: false` (or any shared layout CSS), the site's bundled stylesheet, including Tailwind's preflight, also loads on the admin pages. It caused three real bugs. Guard against all of them in `cms.css`:
  - Preflight's `* { margin: 0 }` kills native `<dialog>` centering, which relies on `margin: auto`, so every modal sticks to the top-left corner. Fix: `.cms-dialog { margin: auto }`.
  - The site's `h1, h2 { text-transform: uppercase }` turns dialog and view titles into `PUBLISH "ABOUT US"?`. Fix: `.cms h1, .cms h2, .cms h3 { text-transform: none }`.
  - Author `display` rules on `.cms-btn`, `.cms-input` and similar classes beat the `hidden` attribute. Fix: `.cms [hidden] { display: none !important }`.

  Unlayered rules in `cms.css` beat anything inside Tailwind's layers, so the first two fixes need no `!important`. Also watch for unlayered global rules (e.g. `main { display: block }`) beating Tailwind utilities. Before reporting, check in a browser that every modal (confirm, media library, add item) is centered.

**Sidebar:** same grouping and order as `.pages.yml`. Top-level entries with no group go under "Settings". Collections are expanded into their files. The **CMS** group comes last.

**Form:** generated recursively from the field definitions:

| `.pages.yml` | Control |
|---|---|
| `string` | a **single-line field that wraps instead of clipping**: a `rows="1"` textarea (`.cms-line`: `field-sizing: content`, `resize: none`, `overflow: hidden`, no min-height). A long subtitle or SEO title is then fully readable, never cut off at the box edge the way an `<input>` cuts it. Enter is blocked (`preventDefault`) and pasted newlines become spaces, so the stored value stays one line. A read-only `string` whose value is an `http(s)://` URL (e.g. **Live Page URL** / `pageUrl`) gets an **Open ↗** link-button beside it (`target="_blank" rel="noopener"`) that jumps to the live page |
| `image` | media picker (Step 5) |
| `text` | textarea that **grows to fit its content** (`field-sizing: content`, `min-height` ~5.5rem, `max-height` ~28rem, then it scrolls), never a fixed 3-row box with an inner scrollbar. Browsers without `field-sizing` (check with `CSS.supports`) get one document-level `input`/`focusin` listener that sets `height` to `scrollHeight`. The same applies to the rich-text HTML source view |
| `rich-text` | the built-in **rich-text editor** (below): a toolbar plus a WYSIWYG box, with an **HTML** source toggle. The value is stored as HTML, matching how routes render it with `set:html` |
| `number` / `boolean` / `select` | number input / checkbox / select (with an empty option unless `required`) |
| `object` | fieldset; a blank `label: " "` hides the legend, as Pages CMS does |
| `block` | collapsible card per section, titled from `list.collapsible.summary` (`{index}`, `{fields.x}`) plus the section title; fields come from the matching block |
| `list` | items with **Remove** only above `min` and **+ Add** only below `max` (a block picker for block lists); shows "N (fixed)" when `min = max`. On object and block lists, **+ Add never appends an empty item.** It opens a modal (`addItemDialog`) created per use: `<dialog class="cms-dialog cms-item-dialog">`, ~640px wide, `max-height: 85vh`, with the field area scrolling. The title is "Add <block label>" or "Add to <list label>". It renders the item's fields (or the chosen block's) into a draft object with the normal `renderFields`, so images, rich text and nested lists all work, and focus starts on the first input. **Add** checks the `required` scalar fields first ("Please fill in: Name, Address."), then pushes the draft and re-renders. **Cancel** or Esc discards the draft, restores the previous dirty state and re-renders the form so the draft's registry entries don't linger. Plain string lists still add an empty row inline, since a modal for one text box is overkill. | **Remove** is a small `.cms-btn .cms-btn-sm .cms-btn-remove` button (red text, transparent until hover, then a red border, `aria-label="Remove item N"`), **vertically centered** with its input (`.cms-row { align-items: center }`), never a bare text link pinned to the row's top edge. It's confirmed in the danger dialog. |

**Rich-text editor (no new dependency):** a `contenteditable` box with a small toolbar, built on the browser's own `document.execCommand`. Mark it with a `ponytail:` comment saying execCommand is deprecated but universally supported, and that the upgrade path is a real editor (e.g. TipTap with HTML output) only if editors need lists, headings or tables.
- **Toolbar** (`role="toolbar"`, `.cms-btn-sm` buttons): **B**, *I*, **Link**, **Unlink**, and on the right an **HTML** toggle (`aria-pressed`) that swaps the box for a monospace source textarea. While the source view is open the formatting buttons are disabled; switching back re-renders the edited HTML. Toolbar buttons call `preventDefault()` on `mousedown` so the editor keeps its selection, and each editor saves its last selection on its own `keyup`/`mouseup`/`input` events. Don't use a document-level `selectionchange` listener, because re-rendered forms would pile up listeners.
- **Stored HTML stays the site's HTML.** Write the value only on a real edit (`input`). On serialize, turn `<b>`/`<i>` into `<strong>`/`<em>` (what the content uses) and keep every attribute. Run `execCommand("styleWithCSS", false, "false")` so bold doesn't become `<span style>`. **Enter** inserts a `<br>` (`insertLineBreak`) instead of a new `<div>`/`<p>`, so inline values stay inline. An empty box (`<br>`) is stored as `""`. **Paste is plain text only** (`insertText` of `text/plain`), so Word/Docs styling never lands in the content.
- **Links:** **Link** needs a text selection (otherwise show the toast "Select the text to link first."). It asks for the URL in the confirmation dialog's input and only accepts `/path`, `#anchor`, `https?://`, `mailto:` and `tel:`. A new link **copies the `class` of an existing link in the same field**, so it gets the same brand styling on the site. This replaces Pages CMS's "use the Source tab for styled links" caveat.
- **Safety (trust boundary):** before putting stored HTML into the editor, parse it inertly (`DOMParser`) and drop `script`, `style`, `iframe`, `object`, `embed`, `link`, `meta`, `base`, form controls, every `on*` attribute and `javascript:`/`data:`/`vbscript:` URLs. Stored content written by one editor must never run script in another admin's session. This only cleans what's *displayed*; nothing is rewritten unless the editor actually edits.
- `readonly` rich-text: `contenteditable="false"`, toolbar disabled. The editor gets `role="textbox"`, `aria-multiline` and an `aria-label` from the field label. Live preview patching and "click a field to scroll the preview" work the same as for other text fields (`html = true`).
- Theme: `.cms-rich` (min/max height with scroll, the accent focus outline, `p` margins, underlined links in the accent colour), plus explicit `[hidden] { display: none }` for the box and the source textarea, since `.cms-input` sets a display.

Show `required` with an asterisk, `readonly` as a disabled control with a "Read-only" badge, and every `description` verbatim under its label. The entry's own `description` (which Pages CMS doesn't display) goes in the form header, with the file path. Never write a key the editor didn't touch, so untouched optional fields don't appear in the JSON.

**Live preview:** the right pane is an `<iframe>` of the real page, using the entry's `pageUrl` pathname (settings entries use `/`; the account views are modals, so the preview keeps showing the current entry). It's same-origin, so the parent patches `iframe.contentDocument` directly. No changes to the site's routes or components are needed.
- On every text, rich-text or image edit, run the old and new value through the site's own token replacement (`localizeData`, which also unwraps a lone `<p>`). Normalise the old HTML through a `<template>`, then replace every element whose `innerHTML` equals it. Fall back to text nodes for plain labels next to icons, and for images match `img[src]` (or the optimised URL containing the encoded path) and drop `srcset`. Briefly outline the patched element and scroll it into view only if it's off-screen. Outline the first **visible** match (`getClientRects().length > 0`), skipping hidden copies such as a closed mobile menu. Re-flashing an element mid-flash must restore its original outline, not the yellow one (keep the saved outline in a `WeakMap` per element).
- **Clicking into a field scrolls the preview to it.** On `focus` of a text/rich-text input, and on `focusin` of an image field or a click on its thumbnail, find where the preview shows the field's **current** value. Use the same matcher as the patcher: one shared `findText(value, html)` / `findImages(path)`, never a second copy. Then outline it and scroll it into view if it's off-screen. A miss does nothing; don't show the "can't be shown" notice, because nothing was edited. Hidden elements (e.g. a closed popup) are skipped, so their fields simply don't scroll.
- Edits the preview can't show (added or removed items, toggles, selects, numbers, a removed image, previously empty fields, unmatched text) display a notice that **names the fields**: "Not shown in the preview until published: Image, Enable Popup." Collect the labels in a set and clear it whenever the preview reloads or another entry opens. A bare "some changes" message leaves editors guessing which edit it means. **Never fake it.**
- **Shared entries jump to their section.** Entries with no `pageUrl` (Global Bottom CTA, Global Map) preview on `/`, where their section usually sits near the bottom. After each load and `mapFields()`, scroll the first visible `[data-cms-field]` element into view (instant, `block: "center"`, only if it's off-screen), so the editor doesn't have to scroll the whole home page to find it. Skip this for the popup's own entry, which opens the popup instead.
- Desktop / Tablet / Mobile width buttons and a reload button. Mark the site's lead popup as already shown in `sessionStorage` so it doesn't cover the preview. The exception is the popup's own entry (e.g. Popup Modal), which opens the popup in the preview so its fields can be seen and clicked.

**Click-to-edit in the preview:** the editor can click text or an image in the preview to open a small action menu for its field. Nothing is ever edited by the click itself; the editor picks an action first, and the value always lands in the matching form field. It's built with the same matching as the live patching above and the same same-origin `contentDocument` access, so **no changes to the site's routes or components are needed**.
- **Map fields to elements** after every preview load. For each field of the open entry that's visible and not `readonly`/`hidden`, match its current rendered value (through `localizeData`) to elements the same way the patcher does: `innerHTML` for rich-text, text nodes for plain labels, `img[src]` or the optimized URL for images. Tag the matches **in the iframe DOM only** (`data-cms-field="<field path>"`, e.g. `sections.2.cards.1.title`). A field that matches several elements tags all of them. If one element matches several fields, the action menu lists one group of actions per field. Fields with no match aren't clickable. **Never guess.**
- **The live-patch highlight is clickable too.** Whenever the patcher replaces an element for a field and flashes its outline (above), it also tags that element with the field's `data-cms-field`, replacing any older tag. That match is certain, because the CMS just wrote the value there. It keeps the element clickable after its text changes, and it makes elements the initial matching missed clickable from their first form edit on. While a field's form control has focus, keep its elements outlined in the same highlight color, so the editor can see the link both ways. Clicking the highlighted element behaves like any tagged element (below).
- **Edit mode toggle** (an "Edit on page" / "Browse" button next to the width buttons, on by default). In edit mode, tagged elements get a dashed outline and a small field-label chip on hover, injected through one `<style>` tag in the iframe. Clicks on links and buttons inside tagged elements are cancelled so the preview doesn't navigate. In Browse mode, the injected style and listeners are removed and the page behaves normally.
- **Clicking a tagged element opens a small action menu; it doesn't edit anything yet.** Clicking an element does three things:
  - Outlines the element in the highlight color.
  - Opens a compact popover anchored to the element, flipping above or below to stay inside the iframe viewport. It's drawn by the parent page on top of the iframe, not injected into the site.
  - Shows the field's label as the popover's header (e.g. "Badge Text · Popup Modal").

  The popover only offers actions that apply to that field:
  - **Edit here** — only for `string` / `text` fields whose raw value has no `{token}`. Makes the element `contenteditable="plaintext-only"` in place and selects its text. Every keystroke writes back to the form field and marks the entry dirty, the same as typing in the form; typing in the form updates the element in turn. In `text` fields, Enter inserts a line break, stored as `\n`; elsewhere Enter finishes. Esc restores the value from when editing started and finishes. Clicking outside finishes and keeps the change.
  - **Edit in form** — for every field type. Scrolls the form to the field, opens any collapsed section card or list item on the way, focuses the control and briefly highlights it. For rich-text fields and values containing a `{city}`-style token, this is the **only** text action. The menu shows a one-line note ("Contains HTML/placeholders, edit it in the form"), because the rendered text can't be mapped back to the stored value without losing tokens or markup.
  - **Change image** / **Remove image** — only for `image` fields. Change opens the media library (Step 5). Remove uses the danger confirmation dialog, and is hidden when the field is `required`.
  - **Copy text** — copies the rendered text to the clipboard.

  The popover is keyboard-accessible: focus moves to its first item, arrow keys move between items, and Esc or a click outside closes it. Clicking a different tagged element moves it there. Only one popover or inline edit is open at a time.
- **`readonly` fields, and the franchise-lock sections that aren't exposed,** are never tagged. Hovering shows nothing and clicking opens no menu, so locked template content can't look editable.
- **List limits still apply.** Click-to-edit only changes existing values. It never adds, removes or reorders items or sections; those stay in the form with their `min`/`max` limits.
- The lock on the server (Step 3) is unchanged. An inline edit is just a form edit, so a tampered `data-cms-field` can't reach a field `.pages.yml` doesn't expose.
- Mark the ceiling with a `ponytail:` comment: matching is by rendered value, so two fields holding identical text, and text a component transforms (truncation, uppercase via JS, `\n` → `<br>` it adds itself), may not map. These fall back to "edit in the form". The upgrade path is `data-cms-field` attributes rendered by the components, but only if the site owners accept component changes.

## Verification (do all of these before reporting)

1. `node src/lib/cms.test.ts` passes. It must cover:
   - **Lock:** non-exposed files rejected (navbar, a solutions page, `..` traversal, a nested collection path); an unchanged save is a no-op for every exposed file; an exposed edit applies; block type, read-only `order`, unexposed top-level keys and unexposed nested keys can't be changed; a fixed section count can't change; required fields can't be blanked.
   - **Media:** `parseMedia` matches `.pages.yml`; PNG and AVIF are detected; SVG and HTML are refused; file names are slugified, including traversal attempts and accented characters.
   - **Auth:** correct and wrong passwords; a non-scrypt hash fails; a session with the wrong secret, a tampered payload or an expired timestamp is rejected; re-hashing the same password changes the fingerprint.
   - **Parity (Step 3b):** every `.pages.yml` entry appears in the sidebar list exactly once, in config order; every rich-text field has `format: html`; no field lacks `name`; `hidden` and `_managed` values survive a save untouched; collection listing honours `filename`/`exclude`/`subfolders`; a `commit.templates.update` renders with the path, name and user email.
2. `astro build` succeeds, every site page is still prerendered, and `/admin/login` is static.
   - `tsc --noEmit` may not cover the client script, so also confirm that it parses on its own: `npx esbuild src/scripts/cms-admin.ts --log-level=error > /dev/null`.
   - Scripted edits (Python or sed heredocs) have turned an escaped `\r\n` inside a regex literal into real line breaks. The result was an "Unterminated regular expression" that only showed up as Astro's error overlay on `/admin`. Prefer the Edit tool for lines that contain backslash escapes.
3. Against a dev server started with test env vars (Astro won't start a second dev server while an AI agent is detected; use `--ignore-lock` in the foreground with the agent env vars unset, on another port, and never stop my own server). Send an `Origin` header on POST/DELETE, as browsers do:
   - `/admin` signed out → 302 to `/admin/login`; `/api/save` signed out → 401;
   - wrong password → 401 with the generic message; login with a foreign `Origin` → 403;
   - owner login (email in different case) → cookie is `HttpOnly`; `/admin` → 200;
   - non-exposed path → 403; SVG upload → 415; a valid request reaches GitHub;
   - sign out → `/admin` redirects again.
4. In a browser (stub `fetch` for the GitHub-backed endpoints with the local files if no token is available):
   - sign in through the form; every sidebar entry loads, and the fields, badges and limits match `.pages.yml`;
   - editing a title, a rich-text field and an image updates the iframe instantly;
   - rich text:
     - Bold/italic on a selection is stored as `<strong>`/`<em>`.
     - **Link** on a selection asks for a URL, rejects `javascript:`, and copies the field's existing link class.
     - Enter adds `<br>`, and pasting rich content inserts plain text.
     - The **HTML** toggle round-trips without changes.
     - Opening a field and leaving it untouched writes nothing.
     - A stored `<img src=x onerror=alert(1)>` doesn't fire in the editor;
   - click-to-edit:
     - Clicking a heading opens the action menu and changes nothing by itself.
     - **Edit here** edits it in place; typing updates the form field and the "Unsaved changes" pill, and Esc restores the old value.
     - **Edit in form** scrolls to and focuses the field.
     - A rich-text paragraph or a `{token}` value offers no **Edit here**.
     - An image offers **Change image** (opens the media library) and **Remove image** (danger dialog).
     - Esc and clicking outside close the menu.
     - Read-only and locked sections show no outline.
     - Links don't navigate in edit mode, and Browse mode restores normal behaviour.
     - The popup's entry shows the popup and its text is clickable.
     - After editing a field in the form, its highlighted element in the preview is clickable and leads back to that field. Focusing a form field outlines its element;
   - the media library opens, and picking an image updates the field and the preview;
   - publish asks first, then sends `{ path, content, sha }`;
   - after publishing, the deploy pill shows **Waiting for Vercel…** → **Deploying…** → **Live** (stub `/api/deploy` through `pending` → `success`, then `failure` with "Deployment was blocked"). **Live** reloads the preview and opens the centered "Your changes are live!" dialog, whose **View live page** opens the page. Blocked shows **Deploy blocked** in red and a single-button danger dialog. If the media library is open when the result lands, it falls back to a toast instead of throwing. In every state, clicking the pill opens the live URL of the page being edited (e.g. `/about-us` while editing About Us), never Vercel. On load the pill shows the head's status;
   - clicking into a field far down the page (and an image field's thumbnail) scrolls the preview to that text/image and outlines it. A field whose text isn't on the page does nothing;
   - My account and Accounts open as centered modals over the current entry (unsaved edits survive opening and closing them), ✕ and Esc close them, and the danger dialog opened from them focuses Cancel;
   - adding an account and resetting a password each end in the read-only "Password for <name>" dialog, and **Copy password** puts it on the clipboard. A failed save shows no share dialog. A stored row with the owner's email isn't listed;
   - in every list (plain values and collapsible cards), **Remove** sits vertically centered beside its input or card title and shows its hover border;
   - a long text field (e.g. SEO keywords) shows all its text without an inner scrollbar, up to the max height. A long **single-line** value (e.g. a CTA subtitle) wraps onto extra lines instead of being cut off, and Enter adds no newline;
   - **+ Add** on an object list and on a block list opens the add modal. **Add** with an empty required field shows the "Please fill in" error. **Add** with values appends the filled item. **Cancel** adds nothing and leaves "Unsaved changes" as it was. The focused field's outline isn't clipped;
   - the Live Page URL's **Open ↗** opens the live page in a new tab;
   - the publish dialog and the media library are **centered**, with normal-case titles (this catches the site-CSS leak above);
   - inside the Accounts modal, the role select is compact and shows its value, and toasts ("Renamed.") appear above the modal;
   - the header logo is 40px tall and stays visible in dark mode (white backing);
   - on the login page, the logo is clearly visible, the password **Show/Hide** toggle works, and the page opens in light mode even when the OS is in dark mode;
   - dark/light (via the toggle) and mobile widths look right.
5. If Step 0 ran any all-in-one phases, include that prompt's **Final report** punch list first.
6. Report: what's editable (same as Pages CMS), who can do what, what changed outside the CMS files (adapter, middleware header, env vars, `.gitignore`), the deliberate ceilings, and anything not built (creating new pages, deleting media files, rich-text lists/headings/tables). The ceilings are: no login rate limit, the 30s account cache, the preview patch and click-to-edit matching limits, deploy status depending on the host posting GitHub commit statuses, 3 MB uploads, SVG refused, and single-line fields only auto-growing where `field-sizing` is supported (Chrome/Edge; Firefox keeps one row that scrolls). Leave everything uncommitted.
7. **End the report with the environment setup guide** (next section). It's the last thing in the response, so the person knows exactly what to add by hand before the CMS works.

## Final step — Environment setup guide for the user (always the last part of the report)

The CMS can't run until someone adds secrets that no code change can supply. Finish every run with a guide the person can follow step by step without asking anything. Write it for a non-developer: plain words, exact clicks, real URLs filled in for this repo (owner, repo name, Vercel project), and no placeholders left where you already know the value.

**1. Find every variable.** Grep the repo (`env("…")`, `process.env.…`, `import.meta.env.…`, `PUBLIC_…`) and `.env.example`. List the CMS variables below plus any the site already uses (e.g. `PUBLIC_SITE_ID`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_SITE_URL`). Mark each one **required** or **optional**, and say what happens if it's missing.

**2. One table, one row per variable:** name · required? · what it's for · where to get the value · example format (never a real value). Use these rows for the CMS variables, adjusted to the repo:

| Variable | Required | What it's for | Where to get it |
|---|---|---|---|
| `ADMIN_EMAIL` | Yes | The site owner's login. Always an admin, can't be removed in the CMS | Choose it: the owner's email address |
| `ADMIN_PASSWORD` | Yes | The owner's password (10+ characters). Changing it signs the owner out everywhere | Choose it: use a password manager to generate one |
| `SESSION_SECRET` | Yes | Signs login cookies. Without it nobody can sign in. Changing it signs everyone out | Generate 32+ random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `GITHUB_TOKEN` | Yes | Lets the CMS save content, upload images and read deploy status | GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token* (https://github.com/settings/personal-access-tokens). Sign in as the account that **owns the repo and the Vercel project**. Repository access: *Only select repositories* → this repo. Permissions: **Contents: Read and write** + **Commit statuses: Read-only** (Metadata is added automatically). Copy the token right away; GitHub shows it once |
| `GITHUB_OWNER` | Yes | The repo's owner | The first part of the repo URL: `github.com/<owner>/<repo>` |
| `GITHUB_REPO` | Yes | The repo's name | The second part of the repo URL |
| `GITHUB_BRANCH` | No (default `main`) | The branch the CMS commits to, which must be the one Vercel deploys to Production | Vercel → *Settings → Git → Production Branch* |

**3. Where to put them.** Number the steps:
1. **Vercel (production):** open `https://vercel.com/<team>/<project>/settings/environment-variables`, click **Add New** for each variable, tick **Production** (and **Preview** if previews should have a working CMS), then **Save**. Mark the four secrets (`ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`, and `ADMIN_EMAIL` if it's private) as **Sensitive**.
2. **Redeploy:** variables only apply to new deploys. Go to *Deployments → the latest one → ⋯ → Redeploy*, or push a commit.
3. **Local development (optional):** copy `.env.example` to `.env` (git-ignored) and fill in the same values. **Never put real values in `.env.example`**: it's committed, and anything in it is visible to everyone with repo access, forever, in git history.

**4. Pitfalls to warn about** (only those that apply):
- **Vercel Hobby blocks deploys of commits whose author isn't the account owner.** The CMS commits as the token's owner, so create the token on the GitHub account linked to the Vercel project. A token from another account makes every save show **Blocked** in Vercel.
- **"All repositories" isn't a permission.** Repository access picks *which* repos; each permission (Contents, Commit statuses) must be set separately. A missing **Commit statuses: Read** shows as a dashed **Deploy status unavailable** pill.
- **If a token or password was ever committed** (e.g. in `.env.example`), it's leaked even after deletion: revoke it on GitHub, create a new one and update Vercel.
- **Token expiry:** when the token expires, saves fail with "GitHub returned 401". Note the expiry date you chose, then make a new token and update `GITHUB_TOKEN`.

**5. "It works" checklist** to finish the guide:
1. Open `https://<site>/admin`. It redirects to the login page.
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. The header pill shows **Live** (green). If it's dashed, hover it for the reason.
4. Edit a small text, **Publish**, and watch **Waiting for Vercel… → Deploying… → Live**.
5. Open the page from the pill and confirm the change is there.
