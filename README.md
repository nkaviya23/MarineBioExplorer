# Marine Bio Explorer

A community-powered platform for discovering, identifying, documenting, and exploring marine organisms. Researchers, divers, shoreline explorers, and community members can contribute marine photographs and videos, request identification help, and browse an authenticated, verified organism library.

---

## 1. Core Architecture & Product Design

- **Persistent Relational Database:** Powered by `better-sqlite3` with Write-Ahead Logging (`WAL`), foreign key enforcement, and indexes on taxonomy, status, and media.
- **Strict Empty-by-Default Guarantee:** The database initializes with **zero** organism records and **zero** media records. No mock or dummy data is ever inserted.
- **Two Distinct Login Portals:**
  - **Explorer / Contributor Portal:** Public registration strictly grants the `CONTRIBUTOR` role.
  - **Administrator Portal:** Dedicated console guarded by server-side `ADMIN` role checks.
- **Independent Rights Discipline:**
  - **Public Display Permission** and **AI / Reference Permission** are recorded and evaluated as separate decisions.
- **Robust Media Storage Layer:**
  - Development / local storage via disk (`./uploads`) with UUID filenames, mime-type validation (JPEG, PNG, WebP, GIF, MP4, WebM), and configurable size limits (default: 25MB).
  - Clear abstraction for seamless transition to cloud object storage (S3 / GCS).

---

## 2. Project Folder Structure

```
├── .env.example              # Environment variable documentation & configuration template
├── data/                     # Persistent database storage (marinebio.db)
├── uploads/                  # Validated media uploads directory
├── server.ts                 # Full-stack Express entry point mounting Vite middlewares
├── src/
│   ├── context/
│   │   └── AuthContext.tsx   # React authentication context & session state
│   ├── types/
│   │   └── index.ts          # TypeScript domain interfaces
│   ├── server/
│   │   ├── db.ts             # SQLite schema initialization & database connection
│   │   ├── auth.ts           # HMAC session tokens, password hashing, and role guards
│   │   ├── storage.ts        # Multer upload engine and file handling service
│   │   └── routes.ts         # REST API endpoints (contributor, admin, public)
│   ├── components/
│   │   ├── Navbar.tsx        # Navigation with separated contributor/admin portals
│   │   ├── Footer.tsx        # Provenance disclosure and portal links
│   │   └── EmptyState.tsx    # Ocean-themed genuine empty state component
│   ├── pages/
│   │   ├── HomePage.tsx      # Landing page with live catalog status
│   │   ├── ExplorePage.tsx   # Searchable and filterable organism catalog
│   │   ├── OrganismDetailPage.tsx # Biological specs and approved media gallery
│   │   ├── IdentifyPage.tsx  # Option 1 (Upload Image) & Option 2 (Search Library)
│   │   ├── ContributePage.tsx# Discovery upload form with separated rights questions
│   │   ├── UnknownsPage.tsx  # Unidentified ocean specimens community pool
│   │   ├── LoginPage.tsx     # Explorer / Contributor login
│   │   ├── RegisterPage.tsx  # Contributor account registration
│   │   ├── AdminLoginPage.tsx# Protected Administrator login and initial setup console
│   │   ├── ContributorDashboard.tsx # Personal submission tracker & review updates
│   │   └── AdminDashboard.tsx# Admin workspace: approvals, organism creator, media vault
│   ├── App.tsx               # Main application routing and shell
│   └── main.tsx              # React client mount point
└── tests/
    └── backend.test.js       # Node test suite verifying security, rights, and zero-data rules
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key variables:
- `SESSION_SECRET`: Secret key used to sign session cookies.
- `ADMIN_SETUP_SECRET`: Secret token required to initialize the first administrator account (default: `marine-bio-admin-secret-key-change-me`).
- `DATABASE_PATH`: Path to SQLite database file (default: `./data/marinebio.db`).
- `UPLOAD_DIR`: Directory for storing uploaded photos and videos (default: `./uploads`).
- `MAX_FILE_SIZE_MB`: Maximum permitted file size in megabytes (default: `25`).

---

## 4. Initial Administrator Setup

There are two easy ways to initialize your first administrator account:

### Method A: Through the Web Interface (Recommended)
1. Start the application (`npm run dev`).
2. Navigate to the **Administrator Portal** (click the Shield icon in the navigation bar or footer).
3. If no administrator exists in the database, the page automatically presents the **"Initial Administrator Setup Required"** console.
4. Enter your administrator email, full name, master password, and the `ADMIN_SETUP_SECRET` from your `.env` file (`marine-bio-admin-secret-key-change-me`).
5. Click **"Initialize Founder Administrator"**. Your account is created and immediately logged in to the Administrator Workspace.

### Method B: Via Environment Variables (Automatic Bootstrapping)
Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in your `.env` file before launching the server. On startup, the database will automatically provision the administrator account.

---

## 5. Local Development & Running the Website

```bash
# 1. Install dependencies
npm install

# 2. Run automated verification tests
npm test

# 3. Start full-stack development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Beginner Manual Testing Checklist

Follow this 8-step walkthrough to verify all core workflows:

### Step 1: Start the website
- Run `npm run dev` and open `http://localhost:3000`.
- Verify the home page displays: *"EXPLORE LIFE BENEATH THE OCEANS"*.
- Click **"Explore Library"** and confirm the empty state message: *"The exploration library is waiting for its first discovery"*. Notice that there are zero fake records.

### Step 2: Create a contributor account
- Click **"Join as Contributor"** in the top navigation.
- Enter your name (e.g., `Diver Maya`), email (`maya@example.com`), and a password (min 8 chars).
- Submit the form. Notice you are redirected to the **Contributor Workspace** showing your name, role (`CONTRIBUTOR`), and zero submissions.

### Step 3: Log in as administrator
- In an incognito window or after logging out, click the **Shield** icon in the navbar.
- Use the **Initial Administrator Setup** form with secret `marine-bio-admin-secret-key-change-me`, or enter your admin credentials.
- Notice you are in the **Administrator Workspace** with sections: *Overview*, *Pending Approvals (0)*, *Organism Library (0)*, *Add an Organism*, *Unknown Organisms*, and *Media Management*.

### Step 4: Upload an image (as Contributor)
- Log in with your contributor account.
- Click **"Contribute a Discovery"**.
- Select an ocean photograph from your device.
- Fill in:
  - Suspected name: `Giant Pacific Octopus`
  - Location: `Puget Sound, Washington`
  - Habitat: `Rocky den near kelp bed`
- In Section 3 (*Ownership & Rights*):
  - Check **"May Marine Bio Explorer display this media publicly?"** -> Yes
  - Leave **"May this media be used as a reference dataset for future visual-identification features?"** unchecked (verifying rights separation).
- Click **"Submit Discovery for Review"**.
- Go to **"My Submissions"** and confirm your observation shows status `PENDING_REVIEW`.

### Step 5: Review and approve a submission (as Administrator)
- Switch to your Administrator account.
- Click **"Pending Approvals"**. Your new octopus submission appears in the queue.
- Click **"Inspect & Decide"**.
- View the media preview, contributor attribution, and permissions.
- Select **"Create New Organism Inline"** and enter:
  - Common Name: `Giant Pacific Octopus`
  - Scientific Name: `Enteroctopus dofleini`
- Click **"Confirm Decision"**.
- The submission status updates to `APPROVED` and the media is linked to the newly created organism.

### Step 6: Add an organism directly (as Administrator)
- In the Admin Workspace, click **"Add an Organism"**.
- Fill in:
  - Common Name: `Garibaldi`
  - Scientific Name: `Hypsypops rubicundus`
  - Phylum: `Chordata`
  - Habitat: `Kelp forests and shallow reefs`
  - Min Depth: `0`, Max Depth: `30`
- Click **"Save Organism Profile"**.
- The record is created in the official catalog without requiring immediate media.

### Step 7: Attach approved media
- Go to **"Organism Library"** in the Admin Workspace.
- Click **"Attach Media"** on an organism record to link an approved photograph and designate it as primary.

### Step 8: View the public organism page
- Navigate back to **"Explore Library"** on the public website.
- Notice the catalog now displays the verified organism profile with its approved photo and attribution credit!
- Click into the organism card to see the full biological profile, depth range, taxonomic hierarchy, and media rights provenance overlay.

---

## 7. Production Deployment Prerequisites

1. Set `NODE_ENV=production`.
2. Configure persistent volume storage for `./data` and `./uploads` (or set `STORAGE_DRIVER="s3"` and provide object storage credentials in production).
3. Set a strong, unique `SESSION_SECRET` (at least 32 characters) and a secret `ADMIN_SETUP_SECRET`.
4. Run `npm run build` to compile the Vite frontend, and start with `npm start` (`tsx server.ts`).
