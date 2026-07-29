# Mornigami - Technical Architecture & Developer Blueprint

> **Visit Live Website**: [https://mornigami.vercel.app/](https://mornigami.vercel.app/)

---

## 1. 📌 Executive Overview & Tech Stack

### Purpose
**Mornigami** is a unified, gamified personal productivity and financial intelligence hub designed to streamline daily routines, habit building, task management, focus sessions, and expense control. Built with a high-performance single-page application architecture (SPA) alongside modular standalone pages, Mornigami turns daily self-discipline into an engaging RPG-style growth system with XP points, leveling, customizer store items, daily bounties, community leaderboards, and AI-driven financial advisories.

### Complete Technology Breakdown
- **Frontend Core**: Vanilla JavaScript (ES6+ Object-Oriented Architecture), HTML5, HTML5 Web Audio API.
- **Styling & Design System**: Native CSS Variables (Custom properties), Flexbox & Grid layouts, Glassmorphism, CSS keyframe animations, Light & Dark themes (with `#121212` dark background token).
- **Database & Cloud Backend**: Firebase Cloud Firestore (v10.8.1 Modular SDK) for cloud data persistence and real-time synchronization.
- **Authentication**: Firebase Authentication (Email/Password authentication, session lifecycle management, email updates, password resets).
- **AI Integration**: Google Gemini API (`gemini-1.5-flash`) via direct REST endpoint integration for intelligent Arabic financial advice and spending analysis.
- **Hosting & Deployment**: Vercel Serverless Hosting with automatic CI/CD deployment pipelines.
- **State Management & Offline Support**: Dual-layer state synchronization utilizing browser `localStorage` as an immediate low-latency cache synchronized asynchronously with Cloud Firestore.

---

## 2. 🏗️ Application Architecture & File Structure

```text
Mornigami/
├── index.html                  # Main SPA entry point (Navbar, Sidebar, Modals, Views, Auth & Firebase Config)
├── app.js                      # Core Application Engine (`ProductivityHub` class, State, Firestore Sync, All Feature Logic)
├── style.css                   # Master Design System (CSS Variables, Light/Dark Modes, Responsive Layouts, Modal Styles)
├── pomodoro.html               # Standalone Pomodoro Focus Timer Web Page
├── pomodoro.js                 # Standalone Pomodoro Application Engine (`PomodoroTimer` class)
├── todo.html                   # Standalone Task Manager Web Page
├── todo.js                     # Standalone Task Application Engine (`TodoApp` class)
├── icon.png                    # Mornigami Brand Logo & Application Icon Asset
├── README.md                   # Complete Technical Documentation & Architecture Blueprint
└── New Text Document.txt       # Technical Requirements Backlog & Feature Enhancement Roadmap
```

### Detailed Directory & File Descriptions
- [index.html](file:///d:/Programming/Mornigami/index.html) (199 KB): Structural blueprint of the unified single-page application. Features the global navbar (XP bar, level badge, profile dropdown, theme toggler), collapsible sidebar navigation, page view containers (`#home`, `#habits`, `#todo`, `#pomodoro`, `#finance`, `#store`, `#community`, `#bounties`, `#settings`, `#admin`, `#auth`), and modal dialogs (`habitModal`, `taskModal`, `generalActionsModal`, `savingsVaultModal`, `adminUserModal`, etc.). Initializes Firebase v10.8.1 modular SDKs.
- [app.js](file:///d:/Programming/Mornigami/app.js) (393 KB): The central brain of Mornigami. Implements the `ProductivityHub` monolithic class (over 8,000 lines, 208 methods). Manages global state, client-side caching, Firebase Auth state change listeners, Firestore data reads/writes, Habit management, Task management, Pomodoro logic, Finance engine, XP & Level calculations, Customizer store, Bounties reset, Admin panel metrics, and Gemini AI API interactions.
- [style.css](file:///d:/Programming/Mornigami/style.css) (129 KB): Master stylesheet defining design tokens (colors, typography, spacing, shadows, radii, transitions), Light theme, Dark theme (`#121212`), layout grids, card styles, badge animations (`spark-border`, `fire-border`, `rainbow-border`), floating XP text, and responsive breakpoints.
- [pomodoro.html](file:///d:/Programming/Mornigami/pomodoro.html) & [pomodoro.js](file:///d:/Programming/Mornigami/pomodoro.js) (14 KB / 22 KB): Independent, standalone timer view and timer controller (`PomodoroTimer` class) designed for minimal distraction or embedding.
- [todo.html](file:///d:/Programming/Mornigami/todo.html) & [todo.js](file:///d:/Programming/Mornigami/todo.js) (12 KB / 21 KB): Standalone task manager view and task controller (`TodoApp` class) for dedicated task workflows.
- [New Text Document.txt](file:///d:/Programming/Mornigami/New%20Text%20Document.txt) (1.6 KB): Contains developer notes and backlog feature requests for UI enhancements, mobile PWA packaging, multi-currency defaults (EGP), and savings calculators.

---

## 3. 💾 Data Model & State Management (`app.js`)

### Global State Mapping (`ProductivityHub` Class)

```javascript
this.currentPage          = 'home';
this.userLevel            = 1;          // Integer level
this.userXP               = 0;          // Current XP progression points
this.userBadges           = [];         // Array of unlocked/active badge strings
this.spentXP              = 0;          // Total XP spent in customizer store
this.unlockedItems        = { colors: [], avatars: [], borders: [] };
this.activeAvatar         = '';         // Active emoji avatar
this.activeBorder         = '';         // Active CSS animation border class
this.habits               = [];         // Habit items array
this.tasks                = [];         // Task items array
this.financeData          = { ... };    // Complete financial ledger
this.pomodoroSettings     = { ... };    // Work, Short break, Long break durations
this.pomodoroStats        = { ... };    // Sessions completed, total focus time, streaks
this.dailyBounties        = [];         // Active daily quests
this.bountyStats          = { ... };    // Daily counts for pomodoros, habits, tasks completed
this.playlists            = [];         // YouTube and custom music playlists
this.motivationalSettings = { ... };    // Quote settings and streak targets
```

### Exact Schemas Stored in Firestore & LocalStorage

#### 1. Habit Entity (`habits`)
```typescript
interface Habit {
  id: string;                 // Timestamp or unique ID
  title: string;              // Habit name (e.g. "Morning Meditation")
  category: string;           // Habit category tag
  targetDays: number[];       // Days of week active (e.g. [0, 1, 2, 3, 4, 5, 6])
  durationValue: number;      // Goal value (e.g. 30)
  durationUnit: 'mins' | 'hours' | 'times' | 'pages'; // Unit of measurement
  targetTimePerDay: number;   // Daily target time in seconds
  timeSpentToday: number;     // Elapsed focus seconds for current date
  currentStreak: number;      // Continuous daily completion streak
  completedDates: string[];   // ISO date strings ("YYYY-MM-DD") of completions
  lastCompletedDate: string;  // Last completion date string ("YYYY-MM-DD")
  createdAt: string;          // Creation ISO timestamp
}
```

#### 2. Task Entity (`tasks`)
```typescript
interface Task {
  id: string;                 // Unique task identifier
  title: string;              // Task text description
  category: string;           // Category tag
  completed: boolean;         // Completion state
  dueDate: string;            // ISO date string ("YYYY-MM-DD")
  createdAt: string;          // Creation ISO timestamp
  completedAt?: string;       // ISO completion timestamp
}
```

#### 3. Finance Engine Entity (`financeData`)
```typescript
interface Expense {
  id: string;                 // Transaction UUID/Timestamp
  title: string;              // Expense description
  amount: number;             // Monetary value
  category: string;           // Category string (e.g., "Coffee ☕")
  date: string;               // ISO date string ("YYYY-MM-DD")
  type: 'expense' | 'income'; // Transaction classification
  paymentMethod: 'visa' | 'wallet'; // Account source used
  isEssential: boolean;       // Essential vs Non-Essential flag
}

interface SavingsGoal {
  id: string;                 // Goal unique ID
  title: string;              // Goal name (e.g. "New Gaming PC")
  targetAmount: number;       // Required target money amount
  savedAmount: number;        // Accumulated saved funds
  durationMonths: number;     // Time horizon in months
  suggestedMonthly: number;   // Calculated required monthly savings
  suggestedDaily: number;     // Calculated required daily savings
}

interface FinanceData {
  monthYear: string;          // Current active month ("YYYY-MM")
  startingDate: string;       // Salary/budget starting date ("YYYY-MM-DD")
  monthlyIncome: number;      // Total starting monthly budget
  dailyBudget: number;        // Calculated daily allowance remaining
  expenses: Expense[];        // Array of transaction logs
  categories: string[];       // Available category options
  essentialCategories: Record<string, boolean>; // Category essential flags
  currency: string;           // Base currency ("EGP", "USD", etc.)
  visaBalance: number;        // Visa card account balance
  walletBalance: number;      // Cash wallet account balance
  visaIncluded: boolean;      // Whether Visa balance is included in main budget
  visaAllocation: number;     // Visa budget share
  walletAllocation: number;   // Wallet budget share
  savingsBalance: number;     // Savings Vault balance
  savingsGoals: SavingsGoal[];// User savings targets
  activeGoal: SavingsGoal | null; // Primary target goal
  xpBonusClaimedDates: Record<string, boolean>; // Claimed bonus dates map {"YYYY-MM-DD": true}
  lastClaimedBonusDate: string; // Anti-double claim date guard
}
```

#### 4. Cloud Firestore User Document Schema (`/users/{uid}`)
```json
{
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "role": "user",
  "status": "active",
  "userLevel": 5,
  "userXP": 1450,
  "userBadges": ["🌱 Mornigami Novice", "💰 Budget Guardian"],
  "habits": [ /* Habit Objects */ ],
  "tasks": [ /* Task Objects */ ],
  "financeData": { /* FinanceData Object */ },
  "pomodoroStats": { /* PomodoroStats Object */ },
  "pomodoroSettings": { /* PomodoroSettings Object */ },
  "motivationalSettings": { /* MotivationalSettings Object */ },
  "playlists": [ /* Playlists Array */ ],
  "unlockedItems": { "colors": ["color_sakura"], "avatars": ["avatar_fox"], "borders": ["border_spark"] },
  "activeAvatar": "🦊",
  "activeBorder": "spark-border",
  "spentXP": 1200,
  "updatedAt": "2026-07-27T09:49:27.000Z"
}
```

---

## 4. ⚙️ Feature Breakdown & Logical Workflows

### 1. Habit Tracker
- **Creation & Modal Logic**: Triggered via `openModal('habitModal')` and `handleHabitSubmit()`. Collects title, target days of week, target duration value, and unit. Calculates daily target seconds (`targetTimePerDay`).
- **Interactive Timer**: Features a live stopwatch modal (`habitTimerModal`). Method `toggleDay(habitId, dayIndex)` toggles completion status for specific days of the week.
- **Streak Calculation**: Executed in `renderHabits()`. Evaluates `lastCompletedDate` against today and yesterday. Increments `currentStreak` if continuous, or resets to 1 if broken.
- **Gamification**: Completing a habit awards `+50 XP` (`gainXP(50, 'Completed Habit')`) and updates daily bounty counters.

### 2. Finance Engine
- **Daily Budget Calculation**:
  $$\text{Remaining Days} = \text{Days in Month} - \text{Starting Day} + 1$$
  $$\text{Remaining Balance} = \text{Monthly Income} - \sum \text{Expenses}$$
  $$\text{Daily Budget} = \frac{\text{Remaining Balance}}{\text{Remaining Days}}$$
- **Logging Expenses**: Handled by `handleLogExpense()`. Deducts amount from `visaBalance` or `walletBalance` depending on selected payment method, recalculates `dailyBudget`, and syncs to Firestore.
- **Savings Vault & Target Goal**: Handled via `handleTransferSavings()` and `handleSetActiveGoal()`. Transfers funds into `savingsBalance`. Calculates monthly saving targets:
  $$\text{Suggested Monthly} = \frac{\text{Target Amount} - \text{Saved Amount}}{\text{Duration Months}}$$
- **Yesterday's Budget Bonus XP Guard**: Managed by `checkYesterdayFinanceXP()`. Sums total expenses logged on yesterday's date. If total spent $\le$ `dailyBudget` and `xpBonusClaimedDates[yesterdayStr]` is false, awards `+50 Bonus XP` and flags the date as claimed.

### 3. Pomodoro & Zen Mode
- **Timer State Machine**: Controlled by `startPomodoro()`, `pausePomodoro()`, `resetPomodoro()`, and `pomodoroComplete()`.
  - Modes: `work` (25m default), `shortBreak` (5m default), `longBreak` (15m default).
  - Countdown ticks every 1000ms updating `pomodoroTimeLeft` and canvas UI ring.
- **Focus Ambience Audio Player**: Managed via `toggleFocusAudio()`, `selectFocusAudioTrack()`, and `setFocusAudioVolume()`. Loops sound streams: Lofi Music, Heavy Rain, Coffee Shop Atmosphere.
- **Zen Mode**: Enables a full-screen distraction-free timer with ambient controls and audio visuals.
- **Session Completion**: Plays finish sound chime, updates `pomodoroStats`, increments focus time, and awards `+150 XP`.

### 4. Bounties & Gamification
- **XP & Level Scaling**:
  $$\text{XP Needed for Level } L = L \times 500$$
  When `userXP >= XP Needed`, level increments, XP cost is subtracted, `showLevelUpCelebration()` launches an 80-particle confetti burst, and changes persist to Firestore.
- **Daily Bounties System**: Initialized by `checkAndResetDailyBounties()`. Resets bounty progress at local midnight. Offers 3 daily quests. Completing all 3 awards a `+200 Group Bonus XP`.
- **Customizer Store**: Handled by `renderStore()` and `buyStoreItem()`.
  - **Accent Colors**: Sakura Pink (`#FDA4AF`), Mint Sage (`#A7F3D0`), Butter Cream (`#FDE68A`), Lavender Mist (`#DDD6FE`).
  - **Avatars**: Origami Fox (🦊), Crane (🕊️), Frog (🐸), Dragon (🐉).
  - **Badge Borders**: `spark-border`, `fire-border`, `rainbow-border`.
- **Leaderboards & Admin Panel**: Renders community user rankings sorted by XP. Admin dashboard allows inspecting user balances, editing daily bounties, issuing announcements, or soft-deleting abusive accounts.

### 5. AI Integration (Google Gemini 1.5 Flash API)
- **Method**: `getFinancialAIReport(expensesArray)` inside [app.js](file:///d:/Programming/Mornigami/app.js#L8039).
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
- **Prompt Structure**:
  ```text
  أنا بستخدم تطبيق Mornigami لتتبع مصاريفي. دي قائمة مشترياتي الأخيرة: [JSON.stringify(expensesArray)]. 
  بصفتك مستشار مالي محترف، حلل الأرقام والتصنيفات دي، واكتب تقرير ملخص من 3 سطور، واديني نصيحة عملية لتحسين ميزانيتي وتقليل النفقات باللغة العربية.
  ```
- **Response Handling**: Asynchronously POSTs JSON payload to Gemini endpoint, parses candidate text (`data.candidates[0].content.parts[0].text`), and displays Arabic financial advice inside the Finance page UI.

---

## 5. 🎨 Design System & UI Components (`style.css`)

### CSS Variables & Token Breakdown

| Variable Name | Light Theme Value | Dark Theme Value (`body.dark-theme`) |
| :--- | :--- | :--- |
| `--color-bg` | `#F1F5F9` (Slate 100) | `#121212` (OLED Dark Base) |
| `--color-surface` | `#FFFFFF` (Pure White) | `#1E1E1E` (Elevated Surface) |
| `--color-primary` | `#0F172A` (Deep Slate) | `#FFFFFF` (Bright Contrast White) |
| `--color-border` | `#CBD5E1` (Light Slate) | `#333333` (Subtle Dark Border) |
| `--color-secondary` | `#38BDF8` (Sky Blue) | `#38BDF8` (Sky Blue) |
| `--color-success` | `#22C55E` (Emerald) | `#22C55E` (Emerald) |
| `--color-danger` | `#EF4444` (Rose Danger) | `#EF4444` (Rose Danger) |
| `--font-display` | `'Fraunces', serif` | `'Fraunces', serif` |
| `--font-body` | `'DM Sans', sans-serif` | `'DM Sans', sans-serif` |

### Custom Modals & CSS Animations
- **Custom Modals**: Backdrop filter (`backdrop-filter: blur(4px)`), centered overlay (`z-index: 1000`), keyframe pop animation (`modalPop` / `authOverlayPop`). Includes `habitModal`, `taskModal`, `generalActionsModal`, `savingsVaultModal`, `adminUserModal`, `editProfileModal`.
- **CSS Animations**:
  - `modalPop`: Smooth spring scale animation from 0.9 to 1.
  - `spark-border`: Gold animated gradient border for profile badges.
  - `fire-border`: Pulsing flame glow border.
  - `rainbow-border`: 360-degree rotating gradient rainbow border.

----

## 6. 🔄 Sync & Persistence Logic

### Data Flow Pipeline

```text
[User Interaction] ──> [In-Memory State (`ProductivityHub`)]
                             │
                             ├──> [localStorage (Instant Cache)]
                             │
                             └──> [Firebase Firestore (`setDoc` /users/{uid})]
```

1. **User Interaction**: User logs an expense, completes a habit, or unlocks a store item.
2. **In-Memory Mutation**: Global state properties inside `ProductivityHub` update immediately.
3. **LocalStorage Sync**: Data is saved to `localStorage` via `saveData(key, data)`, guaranteeing sub-millisecond offline performance.
4. **Cloud Firestore Sync**: If authenticated, asynchronous `setDoc(doc(window.db, "users", uid), payload, { merge: true })` writes changes to Cloud Firestore.

### Authentication Lifecycle (`onUserStatusChanged`)
- Triggered by Firebase `onAuthStateChanged(auth, user)`.
- **Login Flow**:
  1. Checks user status in Firestore. If `status === 'deleted'`, revokes access and signs out immediately.
  2. Executes `clearAllLocalData()` to wipe existing local data and prevent data leakage across accounts.
  3. Fetches cloud document from Firestore (`getDoc`).
  4. Hydrates `ProductivityHub` state (`habits`, `tasks`, `financeData`, `userLevel`, `userXP`, `unlockedItems`, etc.) and mirrors into `localStorage`.
  5. Updates UI components, navbar avatar, and global level badges.
- **Logout Flow**:
  1. Calls `window.firebaseAuth.signOut(auth)`.
  2. Executes `clearAllLocalData()`.
  3. Resets `currentUser = null` and routes UI to `#auth` page.

---

## 7. 🔮 Known Loops / Edge Cases & Future Roadmap

### Security Protections & Guards
- **Daily Budget Claim Guard**: Uses `xpBonusClaimedDates` object map + `lastClaimedBonusDate` string check to prevent users from double-claiming yesterday's budget bonus XP.
- **Soft-Deleted User Guard**: Catches deleted account flags inside `onUserStatusChanged()` and forces instant sign-out.
- **Negative Allocation Fallbacks**: Protects wallet allocations (`visaAllocation`, `walletAllocation`) from going negative during high expense periods.
- **Offline Resiliency**: Operates seamlessly off `localStorage` if network connectivity to Firebase drops.

### Future Roadmap & Planned Features
1. **PWA Mobile APK Packaging**: Packaging Mornigami into a Progressive Web App (PWA) with Service Workers and generating mobile APK binaries.
2. **System CronJobs**: Implementing automated cron timing for midnight bounty resets and weekly financial progress reports.
3. **Multi-Currency Engine**: Expanding currency selection beyond EGP with live currency conversion rates.
4. **Self-Service Password Reset**: Adding direct "Forgot Password" self-service flows on the auth overlay.
