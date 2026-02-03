# SafeApply - Secure Scholarship System - Client

This is the frontend application for the SafeApply, built with [Vite](https://vitejs.dev/) and [React](https://react.dev/). It provides a secure and responsive user interface for students, verifiers, and administrators.

The Backend code is at [Repo](https://github.com/USER1043/ScholarshipSystem-Backend)

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router DOM v7
- **State/API:** Axios
- **Security:** `node-forge` (Encryption), `jwt-decode` (Token parsing)
- **Styling:** CSS (App.css, index.css)
- **Linting:** ESLint

## Features

- **Secure Authentication:** JWT-based login for multiple roles (Student, Verifier, Admin).
- **Scholarship Application:** interactive forms for submitting applications.
- **Dashboard:** specialized dashboards for different user roles.
- **Encryption:** client-side encryption support using `node-forge`.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## Getting Started

1.  **Navigate to the client directory:**

    ```bash
    cd client
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**
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
client/
├── public/          # Static assets
├── src/
│   ├── api/         # API integration logic
│   ├── assets/      # Images and styles
│   ├── components/  # Reusable UI components
│   ├── context/     # React Context for state management
│   ├── utils/       # Utility functions
│   ├── App.jsx      # Main application component
│   └── main.jsx     # Entry point
├── package.json     # Dependencies and scripts
└── vite.config.js   # Vite configuration
```
