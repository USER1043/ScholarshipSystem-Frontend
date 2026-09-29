# SafeApply - Secure Scholarship System - Client

This is the frontend application for the SafeApply, built with [Vite](https://vitejs.dev/) and [React](https://react.dev/). It provides a secure and responsive user interface for students, verifiers, and administrators.

The Backend code is at [Repo](https://github.com/USER1043/ScholarshipSystem-Backend)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams of the app structure, session handling, authentication screens and browser-side encryption.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router DOM v7
- **State/API:** Axios
- **Security:** `node-forge` (Encryption), `jwt-decode` (Token parsing)
- **Styling:** CSS (App.css, index.css)
- **Linting:** ESLint

## Features

- **Secure Authentication:** JWT-based login for multiple roles (Student, Verifier, Admin), with email OTP (students) or authenticator app (staff) as the second factor.
- **Scholarship Application:** interactive forms for submitting applications.
- **Dashboard:** specialized dashboards for different user roles.
- **Encryption:** sensitive fields are encrypted in the browser with `node-forge` before submission (see below).

## Encryption

When a student submits an application, the browser:

1. Generates a random AES-256-CBC key for the application.
2. Encrypts the bank details, Aadhaar ID, income, GPA and exam score with that key.
3. Encrypts the AES key with the server's RSA-4096 public key (OAEP, SHA-256), fetched from `/api/auth/public-key`.
4. Sends only the ciphertext and the encrypted key.

The browser never decrypts data. The backend decrypts applications on the server and returns only the fields each role is allowed to see, so AES keys are never sent to the client.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- The [backend server](https://github.com/USER1043/ScholarshipSystem-Backend) running

## Environment Variables

Create a `.env` file in the project root to point the app at the backend API:

```env
VITE_BASE_URL=http://localhost:5000/api
```

If `VITE_BASE_URL` is not set, the app uses `http://localhost:5000/api`.

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will typically start at `http://localhost:5173`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint to check for code quality issues.

## Project Structure

```
ScholarshipSystem-Frontend/
├── public/          # Static assets
├── src/
│   ├── api/         # API integration logic
│   ├── assets/      # Images and styles
│   ├── components/  # Reusable UI components
│   ├── context/     # React Context for state management
│   ├── utils/       # Utility functions (encryption, role helpers)
│   ├── App.jsx      # Main application component
│   └── main.jsx     # Entry point
├── package.json     # Dependencies and scripts
└── vite.config.js   # Vite configuration
```
