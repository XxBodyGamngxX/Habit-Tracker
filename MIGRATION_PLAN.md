# Mornigami - Modernized React, shadcn/ui & BetterAuth Migration Plan

This revised document outlines the comprehensive strategy to migrate the Mornigami codebase into a modern, robust, and beautifully designed application. The stack is upgraded to use **React (TypeScript), Vite, TailwindCSS, shadcn/ui, BetterAuth (with Drizzle & SQLite/Turso database), and Firebase Firestore (for data sync via Firebase custom tokens)**.

---

## 📅 Milestones & Execution Phases

We will execute this migration in **6 Structured Phases** (incorporating Phase 0 for Backend & Auth Setup). After each phase, we will run build verification checks.

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 0: Backend & Auth Setup (BetterAuth, Drizzle, LibSQL)│
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Project Setup, Config & shadcn/ui Initialization │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Layout, Global State Context & Firestore Bridge   │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: Core App Modules (Habits, Todo, Pomodoro, Finance) │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: Store, Playlists, Community, Settings & Admin     │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: Standalone Pages, Final Verification, & Polish   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 📂 File-by-File Mapping

The original files will be componentized into a modern React architecture under `src/` and a server runtime under `server/`:

| Original Vanilla File | Target Path | Description |
| :--- | :--- | :--- |
| `index.html` (root layout) | `src/index.html`, `src/App.tsx`, `src/components/Layout.tsx` | Main root page, router, shared Sidebar navigation, user profile sheet, and collapsible UI. |
| `style.css` | `src/index.css`, `tailwind.config.js` | Migrated fully to Tailwind CSS utility classes and mapped onto shadcn/ui's CSS variables. |
| `app.js` (Auth logic) | `src/pages/Auth.tsx` & `server/index.ts` | Authentication portal powered by BetterAuth client/server and Firebase Custom Token Bridge. |
| `app.js` (State & Sync) | `src/context/AppContext.tsx` | Global context handling offline-first local cache synchronization with Cloud Firestore. |
| `app.js` (Home view) | `src/pages/Home.tsx` | Main dash with shadcn/ui custom cards: Daily Stats, Bounties tracker, system announcements. |
| `app.js` (Habits view) | `src/pages/Habits.tsx` | Habits tracker utilizing shadcn Dialog/Sheet modals, progress indicators, and drag-and-drop. |
| `app.js` (Todo view) | `src/pages/Todo.tsx` | To-Do manager: list/grid switches, grouping card nodes, add/edit task Dialog modal. |
| `app.js` (Pomodoro view) | `src/pages/Pomodoro.tsx` | Focus hub: countdown ring, audio track mixer, full-screen Zen mode layout. |
| `app.js` (Finance view) | `src/pages/Finance.tsx` | Expense register: daily budget indicators, essential toggles, savings goal cards, Gemini AI report. |
| `app.js` (Playlists view) | `src/pages/Playlists.tsx` | Focus music manager: YouTube embeds and custom playlists detail views. |
| `app.js` (Store view) | `src/pages/Store.tsx` | Customizer store: exchange earned XP for colors, emojis, and sparkling borders. |
| `app.js` (Community view)| `src/pages/Community.tsx` | High-score leaderboards (XP-ranked) and bulletin board. |
| `app.js` (Settings view) | `src/pages/Settings.tsx` | User profile page built with shadcn form control and schema validations. |
| `app.js` (Admin view) | `src/pages/Admin.tsx` | Moderator/Admin panel: manage users, system announcement writer. |
| `todo.html` / `todo.js` | `src/standalone/StandaloneTodo.tsx` | Route (`/standalone/todo`) rendering the minimal distraction-free standalone task list. |
| `pomodoro.html` / `pomodoro.js` | `src/standalone/StandalonePomodoro.tsx` | Route (`/standalone/pomodoro`) rendering the standalone focus timer. |

---

## 2. ⚡ Architecture Upgrades & Integration Details

### A. Phase 0: Backend & BetterAuth Architecture
We will set up a lightweight, robust Express or Hono server in the `server/` directory:
- **Auth Provider**: BetterAuth with the standard `email-password` plugin.
- **Database**: Drizzle ORM paired with a LibSQL/Turso SQLite database (can run as a local `better-auth.db` file or sync to a Turso Cloud database).
- **Firebase Bridge (Custom Tokens)**:
  - When a user logs in or registers via BetterAuth, the client gets a session.
  - The client then calls our backend server endpoint `/api/auth/firebase-token`.
  - The backend verifies the BetterAuth session, reads the user email/uid, and uses the **Firebase Admin SDK** (`admin.auth().createCustomToken(userId, additionalClaims)`) to generate a Custom Auth Token.
  - The server returns this token to the client.
  - The client runs `signInWithCustomToken(firebaseAuth, customToken)` to authenticate with Firebase on the frontend.
  - This bridges BetterAuth sessions directly into Firestore so all original database security rules remain untouched and 100% secure!

```text
 [Client Auth] ──> Sign in (BetterAuth) ──> Fetch Custom Token ──> signInWithCustomToken() ──> Sync Firestore
```

### B. UI Framework: shadcn/ui & Lucide Icons
We will replace all custom raw CSS dialog templates with shadcn/ui's elegant accessible components:
- **Modals**: Replaced by `<Dialog>` and `<Sheet>` from shadcn/ui.
- **UI Elements**: Use standard `<Button>`, `<Card>`, `<Input>`, `<Label>`, `<Progress>`, `<Switch>`, `<Tabs>`, `<DropdownMenu>`, `<Separator>`, and `<Badge>`.
- **Toasts**: Integrated with `sonner` for beautiful notification messages.
- **Icons**: Migrated 100% to standard React `lucide-react` icons.

### C. Mapping Custom Theme Variables onto shadcn/ui
We will bridge Mornigami's custom CSS variables directly into shadcn/ui:
- Configured colors like `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--border`, `--input`, etc.
- Tailwind will utilize custom variables configured on the `:root` element.
- When an accent color is purchased or toggled (e.g., Sakura Pink, Mint Sage, Sunrise Yellow, Purple), our application will call `document.documentElement.style.setProperty('--primary', purchasedHex)` and update primary-contrast levels. Since shadcn uses `--primary` for its core buttons, badges, and highlights, **selecting an accent color will dynamically recolor the entire UI, including all shadcn components, instantly!**

---

## 3. ⚙️ Scaffold Commands & Dependencies

To construct the unified workspace, we will run:

### Scaffolding Vite React + TypeScript
```bash
# In the project root directory
npm create vite@latest mornigami-app -- --template react-ts
cd mornigami-app
```

### Initializing shadcn/ui
```bash
# Run the shadcn init command to install Tailwind CSS configuration and setup paths
npx shadcn@latest init
```
*We will configure `@/` alias paths inside `tsconfig.json` and `vite.config.ts` during initialization.*

### Adding shadcn/ui Components
```bash
npx shadcn@latest add button card input label form dialog sheet dropdown-menu tabs progress switch select avatar badge separator sonner
```

### Production & Developer Dependencies
```bash
# Core Frontend Packages
npm install react-router-dom firebase better-auth lucide-react

# Backend & Database (installed in a sibling server/ folder or inside a monorepo structure)
cd ../
mkdir server
cd server
npm init -y
npm install express cors dotenv better-auth drizzle-orm @libsql/client firebase-admin
npm install -D typescript ts-node @types/express @types/cors @types/node drizzle-kit

# Root CLI Runner (installed in root to run concurrently)
cd ../
npm init -y
npm install -D concurrently
```

---

## 4. 🚀 Phased Execution Strategy

### Phase 0: Backend & Auth Setup (BetterAuth & Firebase Bridge)
- **Directory**: `server/`
- Configure `drizzle.config.ts` and set up database schema representing BetterAuth users, sessions, accounts, and verifications.
- Implement server backend (`server/index.ts`) using Express or Hono:
  - Initialize BetterAuth.
  - Integrate Firebase Admin SDK (`firebase-admin`) reading credentials from an environment file (`.env`).
  - Create `/api/auth/firebase-token` endpoint verifying BetterAuth sessions and minting Firebase Custom Tokens via `admin.auth().createCustomToken()`.
- Add a root script `package.json` with a `concurrently` script running both the server and frontend together:
  ```json
  "scripts": {
    "dev": "concurrently \"npm --prefix server run dev\" \"npm --prefix mornigami-app run dev\""
  }
  ```

### Phase 1: Project Setup, Config & shadcn/ui
- Initialize Vite TypeScript + Tailwind CSS and run `npx shadcn@latest init`.
- Configure `tailwind.config.js` with typography (DM Sans & Fraunces) and map core shadcn/ui CSS color variables to our dynamic `:root` properties (allowing real-time client-side re-theming).
- Define styles in `mornigami-app/src/index.css` supporting light/dark themes and complex animations (such as the rotating golden sparkling profile border, fire glow, and premium rainbow effects).

### Phase 2: Layout, Global State Context & Firebase Client Bridge
- Build `src/lib/auth-client.ts` initializing BetterAuth Client using `createAuthClient({ baseURL: "http://localhost:5000" })`.
- Build `src/context/AppContext.tsx` providing user stats, progress trackers, and cache hydrators.
- **Implement Hydration Loop**:
  1. Trigger on BetterAuth `useSession()` state.
  2. If session exists, fetch Custom Firebase Token from `/api/auth/firebase-token` backend.
  3. Authenticate Firebase Client using `signInWithCustomToken(auth, customToken)`.
  4. Hydrate database structures (Habits, Todo, Finance, Store) from Cloud Firestore to state & `localStorage`.
- Implement main application framework `src/components/Layout.tsx` featuring standard sidebar navigation links, collapsible sheet, dynamic XP progress gauge, and the real-time accent theme customization panel.
- Implement auth views `src/pages/Auth.tsx` using shadcn Card, Label, Input, and Button components.

### Phase 3: Core App Modules (Converting modals to shadcn)
- **Habit Tracker (`src/pages/Habits.tsx`)**:
  - Render habits grid. Replace hand-crafted modals with shadcn `<Dialog>` triggers.
  - stopwatch timer modal, weekly completion logs.
  - Native drag-and-drop mechanics.
- **To-Do List (`src/pages/Todo.tsx`)**:
  - Vertical list grouped by Date Cards (Overdue, Today, Upcoming) vs Grid cards.
  - Switch filters: Pending, Completed, All.
  - Create/Edit dialogue replacing vanilla input fields.
- **Pomodoro Timer (`src/pages/Pomodoro.tsx`)**:
  - Mode buttons (Work, Short Break, Long Break).
  - SVG progress ring mapping state values.
  - Pomodoro setting configurations in shadcn `<Dialog>`.
  - Ambient Focus mixer controls (volume control, looping lofi streams).
  - Full-screen Zen Mode switch.
- **Finance Portal (`src/pages/Finance.tsx`)**:
  - Expenses ledger: budget, visa vs cash source metrics.
  - Savings Goals: goal setup and progress meters.
  - Gemini AI advise window: POSTing transactions to Gemini Flash endpoint and reading Arabic advisory reports directly in a shadcn `<Card>`.

### Phase 4: Customizer, Media, Community & Admin
- **Store (`src/pages/Store.tsx`)**:
  - Purchase themes, border, or emojis.
- **Media Playlists (`src/pages/Playlists.tsx`)**:
  - Grid of playlists, details, and players.
- **Community Ranking (`src/pages/Community.tsx`)**:
  - Ranks sorted by Firestore XP count.
- **Settings (`src/pages/Settings.tsx`)**:
  - update forms for displayName, change password, theme, or account deletion.
- **Admin Panel (`src/pages/Admin.tsx`)**:
  - User controls, bulletin publisher, soft bans.

### Phase 5: Standalone Views & Final Verification
- Migrate standalone minimalist views under `/standalone/todo` and `/standalone/pomodoro`.
- Verify full execution: trigger `npm run build` and check for styling consistency or code lint errors.

---

## 5. Verification Plan

To verify that the modern application acts identically and has zero regressions, we will perform the following checks:
1. **Auth Bridge Verification**: Sign in with BetterAuth, verify `/api/auth/firebase-token` successfully returns a custom token, and confirm Firestore client signs in and establishes local/cloud hydration seamlessly.
2. **Dynamic UI Recoloring**: Purchase and toggle custom accent colors from the store. Verify CSS variables rewrite instantly and shadcn components (buttons, progress bars) dynamically change colors as designed.
3. **Modal & Form Auditing**: Ensure shadcn Dialogs and Sheets correctly handle input validations, submit triggers, and state resets without layout shifts.
4. **Gamification & Floating text**: Verify completing tasks logs XP, and check that level-up cards and particle confetti canvas trigger properly.
5. **Arabic AI Advisory**: Confirm Gemini Flash API processes transaction data and outputs localized Arabic financial micro-advice inside the ledger card.
