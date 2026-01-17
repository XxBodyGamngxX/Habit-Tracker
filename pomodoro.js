// Pomodoro Timer Application
class PomodoroTimer {
    constructor() {
        this.settings = this.loadSettings();
        this.currentMode = 'work';
        this.timeLeft = this.settings.workDuration * 60;
        this.totalTime = this.settings.workDuration * 60;
        this.isRunning = false;
        this.timer = null;
        this.stats = this.loadStats();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.initTheme();
    }

    setupEventListeners() {
        // Timer controls
        document.getElementById('startBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());

        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.closeSettings());
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.saveSettings(e));

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTimer() {
        const startBtn = document.getElementById('startBtn');

        if (this.isRunning) {
            this.pauseTimer();
            startBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                </svg>
                <span>Resume</span>
            `;
        } else {
            this.startTimer();
            startBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                </svg>
                <span>Pause</span>
            `;
        }
    }

    startTimer() {
        this.isRunning = true;
        document.querySelector('.timer-display').classList.add('running');

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        document.querySelector('.timer-display').classList.remove('running');
        document.querySelector('.timer-display').classList.add('paused');
        clearInterval(this.timer);
    }

    resetTimer() {
        this.pauseTimer();
        this.isRunning = false;
        document.querySelector('.timer-display').classList.remove('running', 'paused');

        const startBtn = document.getElementById('startBtn');
        startBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
            </svg>
            <span>Start</span>
        `;

        this.setTimeForMode(this.currentMode);
        this.updateDisplay();
    }

    timerComplete() {
        this.pauseTimer();

        // Update stats
        if (this.currentMode === 'work') {
            this.stats.sessionsToday++;
            this.stats.totalFocusTime += this.settings.workDuration;
            this.stats.currentStreak++;
            this.saveStats();
            this.updateStats();
        }

        // Play notification sound (browser notification)
        this.notify();

        // Auto-switch to break mode
        if (this.currentMode === 'work') {
            const breakMode = this.stats.sessionsToday % 4 === 0 ? 'long' : 'short';
            this.switchMode(breakMode);
        } else {
            this.switchMode('work');
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.resetTimer();

        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        // Update timer display class
        const timerDisplay = document.querySelector('.timer-display');
        timerDisplay.classList.remove('running', 'paused', 'break');
        if (mode !== 'work') {
            timerDisplay.classList.add('break');
        }

        // Update label
        const labels = {
            work: 'Focus Time',
            short: 'Short Break',
            long: 'Long Break'
        };
        document.getElementById('timerLabel').textContent = labels[mode];
    }

    setTimeForMode(mode) {
        const durations = {
            work: this.settings.workDuration,
            short: this.settings.shortBreakDuration,
            long: this.settings.longBreakDuration
        };

        this.totalTime = durations[mode] * 60;
        this.timeLeft = this.totalTime;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;

        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;

        // Update progress ring
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 880;
        document.getElementById('timerProgress').style.strokeDashoffset = progress;

        // Update page title
        document.title = `${display} - Pomodoro Timer`;
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        document.getElementById('workDuration').value = this.settings.workDuration;
        document.getElementById('shortBreakDuration').value = this.settings.shortBreakDuration;
        document.getElementById('longBreakDuration').value = this.settings.longBreakDuration;
        modal.classList.add('active');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
    }

    saveSettings(e) {
        e.preventDefault();

        this.settings.workDuration = parseInt(document.getElementById('workDuration').value);
        this.settings.shortBreakDuration = parseInt(document.getElementById('shortBreakDuration').value);
        this.settings.longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);

        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));

        // Reset timer with new settings
        this.resetTimer();
        this.closeSettings();
    }

    updateStats() {
        document.getElementById('sessionsToday').textContent = this.stats.sessionsToday;
        document.getElementById('totalFocusTime').textContent = `${this.stats.totalFocusTime}m`;
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
    }

    notify() {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const messages = {
                work: 'Great work! Time for a break.',
                short: 'Break is over. Ready to focus?',
                long: 'Long break is over. Let\'s get back to work!'
            };

            new Notification('Pomodoro Timer', {
                body: messages[this.currentMode],
                icon: '/favicon.ico'
            });
        }

        // Visual notification
        document.body.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        return saved ? JSON.parse(saved) : {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15
        };
    }

    loadStats() {
        const saved = localStorage.getItem('pomodoroStats');
        const stats = saved ? JSON.parse(saved) : {
            sessionsToday: 0,
            totalFocusTime: 0,
            currentStreak: 0,
            lastSessionDate: null
        };

        // Reset daily stats if it's a new day
        const today = new Date().toDateString();
        if (stats.lastSessionDate !== today) {
            stats.sessionsToday = 0;
            stats.totalFocusTime = 0;
            stats.lastSessionDate = today;
            this.saveStats();
        }

        return stats;
    }

    saveStats() {
        const today = new Date().toDateString();
        this.stats.lastSessionDate = today;
        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize the app
const pomodoroTimer = new PomodoroTimer();
