# SafeApply Frontend: New Contributor Guide

Welcome! This guide gets you from "I just cloned the repo" to "I can explain how the client works and change it safely".

It complements, and does not repeat, [ARCHITECTURE.md](ARCHITECTURE.md). The architecture document has the diagrams (route map, session handling, login screens, browser-side encryption). This guide covers:

- how to run the client together with the backend and see every role,
- how to **trace a feature through the code**,
- **why** the main design choices were made, and their trade-offs,
- **quirks in the current code** (including the lint baseline) that will otherwise cost you time,
- a manual test checklist (the repo has no automated tests yet),
- questions you should be able to answer once you know the codebase, and ideas for first contributions.

The API server has a matching [Backend Contributor Guide](https://github.com/USER1043/ScholarshipSystem-Backend/blob/main/docs/CONTRIBUTOR_GUIDE.md).

## Contents

1. [The project in one minute](#1-the-project-in-one-minute)
2. [Run it locally](#2-run-it-locally)
3. [Three ideas that explain most of the code](#3-three-ideas-that-explain-most-of-the-code)
4. [Trace features through the code](#4-trace-features-through-the-code)
5. [Design decisions and trade-offs](#5-design-decisions-and-trade-offs)
6. [Quirks and gotchas in the current code](#6-quirks-and-gotchas-in-the-current-code)
7. [Testing your change](#7-testing-your-change)
8. [Questions you should be able to answer](#8-questions-you-should-be-able-to-answer)
9. [Ideas for first contributions](#9-ideas-for-first-contributions)
10. [Pull request checklist](#10-pull-request-checklist)

---

## 1. The project in one minute

SafeApply is a scholarship application system. This repository is the React single-page app. It has screens for three roles:

| Role | Screens |
| --- | --- |
| **Student** | Register, verify email OTP, apply (`/student/apply`), track status and view the QR code and integrity check (`/student/status`) |
| **Verifier** | Review applications, open documents, mark as verified (`/verifier/dashboard`) |
| **Admin** | Approve or reject applications, onboard staff, manage users (`/admin/dashboard`, two tabs) |

The interesting parts are:

1. **Browser-side encryption**: `ApplyScholarship.jsx` encrypts the sensitive fields (AES-256-CBC) and wraps the AES key with the server's RSA public key before anything leaves the browser.
2. **Two-factor login screens**: email OTP for students, authenticator app (TOTP) for staff, including first-time QR setup.
3. **Session handling**: JWT in `localStorage`, attached by an Axios interceptor, cleared automatically on a 401.
4. **The browser never decrypts anything.** The backend returns plaintext of only the fields each role may see.

**Stack:** React 19, Vite 7, React Router 7, Axios, node-forge, jwt-decode, ESLint 9. Plain CSS (`App.css`, `index.css`) plus a lot of inline styles. No TypeScript, no state library, no test runner yet.

## 2. Run it locally

You need Node.js 18+ and the [backend](https://github.com/USER1043/ScholarshipSystem-Backend) running (it needs MongoDB and an email provider; see its guide).

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional `.env` (the default shown is used when it is missing):

```env
VITE_BASE_URL=http://localhost:5000/api
```

Notes that save time:

- **Use port 5173.** The backend allows exactly one origin, `FRONTEND_URL` (default `http://localhost:5173`). If Vite starts on another port because 5173 is busy, every API call fails with a CORS error in the browser console. Stop whatever holds 5173 or change `FRONTEND_URL` in the backend `.env`.
- **`VITE_` variables are baked in at build time and visible to anyone.** Never put a secret in them.
- **Dev server changes need no restart**, but `.env` changes do.

### See every role working (about 10 minutes)

1. Log in as the super admin (the backend's `SUPER_ADMIN_EMAIL` and password) and enter the code from the authenticator app.
2. Admin dashboard → onboard a verifier. Open the emailed link (`/setup-account?token=...`), choose a password, log in, and **scan the QR code on first login** (it is shown only once).
3. In a private window, register a student at `/register` and enter the OTP from the email.
4. Submit an application at `/student/apply` with three small PDFs or images.
5. Verifier: mark it verified. Admin: approve it. Student: refresh the status page and run the integrity check.

## 3. Three ideas that explain most of the code

**1. `AuthContext` is the single source of truth for "who is logged in".** `login`, `verifyOtp`, `verifyTotp`, `register` and `logout` live in `src/context/AuthContext.jsx`. Components never touch `localStorage` themselves.

**2. All HTTP goes through `src/api/api.js`.** One Axios instance adds the `Authorization` header, and one response interceptor reacts to 401s. If you use plain `fetch` or a second Axios instance, you lose both.

**3. The UI is a convenience; the server is the authority.** `ProtectedRoute` only decides which screens to show. Every real check (token, role, field visibility, status transitions) happens in the backend. Editing `localStorage` in dev tools can change what the UI shows, not what the server returns.

## 4. Trace features through the code

### Logging in

| Step | Where |
| --- | --- |
| Email and password submitted; deviceId read from storage | `components/Auth/Login.jsx` → `login()` in `AuthContext.jsx` |
| Backend answers `mfaType`: `email_otp`, `totp_setup` or `totp_app` | `Login.jsx` decides which screen to open |
| Student enters the 6-digit code, with resend and countdown | `components/Auth/OTPVerify.jsx` → `verifyOtp()` |
| Staff scan the QR (first login) and enter the code | `components/Auth/TOTPVerify.jsx` → `verifyTotp()` |
| Token and user stored, `user` state set | `AuthContext.jsx` |
| `/` redirects each role to its dashboard | `components/Common/HomeRedirect.jsx` |

### Submitting an application

| Step | Where |
| --- | --- |
| Public key fetched on mount | `getPublicKey()` in `utils/encryptionUtils.js` |
| Fresh AES key per submit; four fields encrypted; key wrapped with RSA-OAEP | `handleSubmit` in `components/Student/ApplyScholarship.jsx`; `generateAESKey`, `encryptWithAES`, `encryptAESKeyWithRSA` |
| Multipart form (encrypted fields as JSON strings, plus the three files) posted | `api.post("/applications", ...)` |
| Backend errors shown (either `{ message }` or `{ errors: [{ msg }] }`) | `catch` block in `handleSubmit` |

### Reviewing and approving

| Step | Where |
| --- | --- |
| Verifier list, comments, "verify" button | `components/Verifier/VerifyApplications.jsx` |
| Documents opened with the token attached: the file is fetched as a `blob` and opened from an object URL | `handleViewDocument` (a plain `<a href>` could not send the `Authorization` header) |
| Admin approvals, rejection modal with a reason, staff onboarding form, user list and removal | `components/Admin/AdminDashboard.jsx` (tabs: `approvals`, `manage-users`) |
| Student sees QR code and runs the integrity check | `components/Student/ApplicationStatus.jsx` → `GET /applications/verify-signature/:id` |

### Session lifetime

`AuthProvider` reads the token on load and logs out if it has expired. Afterwards, a 401 from any request clears storage and calls the `logout` function registered with `setUnauthorizedHandler`, so `ProtectedRoute` redirects to `/login`.

## 5. Design decisions and trade-offs

| Decision | Alternative | Why this way | Cost |
| --- | --- | --- | --- |
| **React Context for auth** | Redux or another store | Auth is the only global state; Context is built in and enough | Every consumer re-renders when `user` changes; fine at this size |
| **One Axios instance with interceptors** | `fetch` calls in each component | Token attachment and 401 handling are written once | Components must remember to use it |
| **A registered "unauthorized handler"** | Import `AuthContext` into `api.js` | Avoids a circular import (`AuthContext` imports `api`). The context registers its `logout` at mount | A module-level variable in `api.js` |
| **JWT in `localStorage`** | `httpOnly` cookie | Simple, works with a separately hosted API, easy to attach as a Bearer header | Readable by any script on the page, so an XSS bug exposes the session. An `httpOnly` cookie fixes that but then needs CSRF protection |
| **`jwt-decode` only for expiry, not verification** | Verify in the browser | The browser has no secret to verify with, and does not need one: the server verifies every request | The UI can believe a token is valid that the server has already rejected, hence the 401 handler |
| **Encrypt in the browser with node-forge** | Web Crypto (`crypto.subtle`) | One library gives PEM parsing, AES-CBC and RSA-OAEP with SHA-256 matching the server's `oaepHash: 'sha256'` | A larger bundle. Web Crypto is the modern alternative and a reasonable future change |
| **Fresh AES key and IV per submit** | One key per user | A leaked key exposes one application, not all | The wrapped key is stored with every application |
| **Nothing is decrypted in the browser** | Send wrapped keys to reviewers | The AES key never reaches any client; each role gets only its fields | The server holds the private key, so this is **not** end-to-end encryption |
| **Route groups with `ProtectedRoute allowedRoles`** | Check the role inside every page | Role gating in one place, in `App.jsx` | UX only; never a security boundary |
| **Large components with inline styles** | Split components and CSS modules | Fast to build | `AdminDashboard.jsx` is about 680 lines; harder to review and test |

## 6. Quirks and gotchas in the current code

These are verified against the code. Several are good first issues (section 9).

**Things that will confuse you**

1. **The comments in `encryptAESKeyWithRSA` (`utils/encryptionUtils.js`) are leftover thinking-out-loud and contradict the code.** The code does RSA-OAEP with SHA-256 for both the hash and MGF1, which is what the backend's `crypto.privateDecrypt` call with `oaepHash: 'sha256'` expects. Trust the code, not the comments, and do not change the padding or hash on only one side.
2. **`App.jsx` has stray text.** A bare `// ... inside App component return ...` line and a duplicate "Protected Routes - Admin" comment sit inside `<Routes>`. React Router ignores non-element children, so it is harmless, but it is noise.
3. **`login()` in `AuthContext.jsx` handles a `token` in the login response.** The backend never returns one from `/auth/login` (MFA is always required), so that branch never runs.
4. **"Trust this device" does nothing yet.** The checkbox sends `trustDevice`, the backend stores a `deviceId`, the client saves it and sends it on the next login, and the backend ignores it.
5. **The user object comes from `localStorage`.** `AuthProvider` decodes the token only to check expiry and then uses the stored `user` (including `role`) for the UI. Changing it changes which screens appear, nothing more.
6. **The 401 handler logs out on any 401**, including a wrong password at login (harmless there, since nobody is logged in).
7. **Error responses have two shapes.** Validation failures return `{ errors: [{ msg }] }`; everything else returns `{ message }`. `ApplyScholarship.jsx` handles both; copy that pattern.
8. **`hasRole` in `utils/roleHelper.js` is not used anywhere.** Only `ROLES` is.
9. **Object URLs are never revoked.** `handleViewDocument` calls `createObjectURL` and does not call `revokeObjectURL`, so each opened document keeps its memory until the tab closes.

**Lint baseline**

`npm run lint` currently reports **11 errors and 1 warning** that exist on `main`. They are not caused by your change, but do not add new ones:

| Rule | Where | Meaning |
| --- | --- | --- |
| `react-hooks/set-state-in-effect` | `AdminDashboard.jsx`, `OTPVerify.jsx`, `VerifyApplications.jsx`, `AuthContext.jsx` | A setter is called synchronously in an effect (fetch-on-mount pattern, and reading `localStorage` on load). New in `eslint-plugin-react-hooks` 7 |
| `no-unused-vars` | `AdminDashboard.jsx`, `ApplyScholarship.jsx`, `VerifyApplications.jsx` | `catch (err)` where `err` is unused. Use `catch {` |
| `react-refresh/only-export-components` | `AuthContext.jsx` | The file exports both a context and a component. Move the context to its own file |
| `react-hooks/exhaustive-deps` (warning) | `OTPVerify.jsx` | `getOtpStatus` is missing from the effect's dependencies |

`npm run build` passes. It prints a chunk-size warning (the app is one JS bundle of about 600 kB); that is expected for now.

## 7. Testing your change

There is **no automated test suite** in this repository yet, so verify by hand. Treat adding tests as a valuable contribution (section 9).

### Before opening a PR

```bash
npm run lint     # no NEW problems compared with the baseline in section 6
npm run build    # must succeed
```

Then run the behaviour checks your change could affect, against a running backend:

| Area | Check | Expected |
| --- | --- | --- |
| Routing | Open `/admin/dashboard` while logged out | Redirected to `/login` |
| Routing | Open `/admin/dashboard` as a student | Redirected to `/unauthorized` |
| Session | Delete the `token` in dev tools, then click something that calls the API | Redirected to `/login` |
| Session | Replace the token with garbage and reload | Logged out (expiry decode fails) |
| Login | Wrong password five times | Error message, then "account locked" |
| Login | Student: request OTP, enter wrong code, then right code | Error, then dashboard |
| Staff setup | First staff login | QR code shown; entering the app code logs in |
| Apply | Submit with all fields | "Submitted" message, redirect to status |
| Apply (network tab) | Inspect `POST /applications` | Bank, ID, income and academic values are ciphertext, never plaintext |
| Roles | Check what each role's list shows | Student: own full details; verifier: no bank details; admin: no bank details or ID number |
| Documents | Open a document as the verifier | Opens in a new tab; works only when logged in |
| Approval | Approve, then run the integrity check as the student | "valid" |

The **Network tab check for Apply is the most important one** whenever you touch `ApplyScholarship.jsx` or `encryptionUtils.js`: if plaintext appears in the request, the change is wrong.

## 8. Questions you should be able to answer

Use these to check your understanding of the codebase. Short answers follow each.

**Walk me through what happens when a student submits an application.**
The page fetches the server's RSA public key, generates a random 32-byte AES key, encrypts bank details, ID number, income and `{ currentGPA, examScore }` (JSON) with it using a fresh IV each time, wraps the AES key with RSA-OAEP (SHA-256), and sends a multipart form with the four ciphertexts, the wrapped key, the plain fields and the three files.

**Why is the AES key not just sent to the server?**
It is, but only wrapped. The wrapped key can be opened only with the server's private key. The plaintext key exists briefly in the browser and is never stored or sent.

**Is this end-to-end encryption?**
No. The server holds the private key and decrypts so that staff can review. The goal is that the database, backups and request logs never contain plaintext. A fully compromised server can still read everything.

**How does the client enforce roles?**
It does not, strictly. `ProtectedRoute` shows or hides screens. The backend checks the token and role on every request, so a user who edits `localStorage` still gets 403 from the API.

**What happens when the token expires or is rejected?**
On page load `AuthProvider` checks the `exp` claim and logs out. During use, the Axios response interceptor clears storage on any 401 and calls the registered logout, so the route guard sends the user to `/login`.

**Why `jwt-decode`, and is decoding the same as verifying?**
No. Decoding reads the payload without checking the signature. The client only needs the expiry, and the server verifies every token.

**What are the risks of keeping the JWT in `localStorage`, and how would you reduce them?**
Any script on the page can read it, so XSS exposes the session. Mitigations: keep React's default escaping, avoid `dangerouslySetInnerHTML`, set a Content Security Policy, and consider an `httpOnly`, `SameSite` cookie (which needs CSRF protection and `withCredentials` on Axios; the backend already allows credentials in CORS).

**Why is there an `unauthorized handler` instead of importing the context in `api.js`?**
`AuthContext.jsx` imports `api.js`; importing back would create a cycle. Registering a callback keeps `api.js` independent of React.

**How do you add a new page for the verifier?**
Create the component under `src/components/Verifier/`, add a `<Route>` inside the verifier's `ProtectedRoute` group in `App.jsx`, call the API through `api.js`, and make sure the backend route uses `protect` and `authorize('verifier')`.

**How would you add a new sensitive field?**
Encrypt it in `ApplyScholarship.jsx` with the same AES key and send it as another JSON string. Then follow the backend checklist (model, validators, decryption field lists, signed record).

**Why Vite, and what does `VITE_BASE_URL` do?**
Vite gives fast dev startup and builds. `VITE_`-prefixed variables are inlined at build time to point the app at an API; they are public, so never put secrets there.

**What would you improve first?**
See section 9. A strong answer picks one item, says how to verify it, and notes any risk.

## 9. Ideas for first contributions

Roughly from smallest to largest.

- **Fix the lint baseline** (section 6): `catch {`, move the context out of `AuthContext.jsx`, and fix the `OTPVerify` dependency warning.
- **Remove the stale comments** in `encryptAESKeyWithRSA` and the stray text in `App.jsx`, replacing the comments with one accurate sentence.
- **Remove or use** the unused `hasRole` helper and the unreachable `token` branch in `login()`.
- **Revoke object URLs** after opening a document.
- **Add an `.env.example`** with `VITE_BASE_URL`.
- **Extract a helper** that turns an Axios error (either response shape) into a message, and use it everywhere.
- **Add a 404 page component** and consistent loading and empty states.
- **Split `AdminDashboard.jsx`** into an approvals tab, a user-management tab and an onboarding form component.
- **Code-split by role** with `React.lazy` so students do not download the admin screens.
- **Add tests**: set up Vitest and React Testing Library. Start with `ProtectedRoute` and `HomeRedirect` (render with different users), then `encryptionUtils` (round-trip an AES encryption with a known key; check the wrapped key length equals the RSA modulus).
- **Accessibility pass**: labels tied to inputs, focus handling in the rejection modal, keyboard navigation for the tabs.
- **Replace the OTP "trust this device" checkbox** with a working implementation (needs backend work) or remove it until it exists.

## 10. Pull request checklist

- [ ] The change is as small as it can be and does one thing.
- [ ] `npm run build` succeeds and `npm run lint` shows no **new** problems.
- [ ] API calls go through `src/api/api.js`; no `fetch` and no second Axios instance.
- [ ] No secrets in code or `VITE_` variables; `.env` is not committed.
- [ ] Anything involving sensitive fields was checked in the Network tab: plaintext never appears in a request.
- [ ] If you changed encryption (algorithm, padding, hash, formats), the backend change is made in the same release and both PRs link to each other.
- [ ] New routes sit inside the right `ProtectedRoute` group **and** the backend route enforces the role.
- [ ] Docs are updated if behaviour changed (README, `ARCHITECTURE.md`, this guide).
