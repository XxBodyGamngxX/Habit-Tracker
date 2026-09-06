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

        // Initialize Level and XP System
        this.userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
        this.userXP = parseInt(localStorage.getItem('userXP')) || 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.initTheme();
        this.updateXPUI();
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

        // Accent color picker toggle
        const accentColorBtn = document.getElementById('accentColorBtn');
        if (accentColorBtn) {
            accentColorBtn.addEventListener('click', (e) => this.toggleAccentDropdown(e));
        }

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.accent-picker-wrapper')) {
                const dropdown = document.getElementById('accentColorDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
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

            // Gain XP
            this.gainXP(150, "Focus Session Complete");
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
                icon: 'icon.png'
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

        let accentColor = localStorage.getItem('accentColor');
        if (accentColor === '#10B981' || accentColor === '#FF6B35') {
            accentColor = '#0EA5A0';
            localStorage.setItem('accentColor', '#0EA5A0');
        }
        if (accentColor) {
            const isDark = savedTheme === 'dark';
            if (isDark && accentColor === '#0F172A') {
                this.setAccentColor('#0EA5A0');
            } else if (!isDark && accentColor === '#FFFFFF') {
                this.setAccentColor('#0EA5A0');
            } else {
                this.setAccentColor(accentColor);
            }
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const accentColor = localStorage.getItem('accentColor');
        if (isDark && accentColor === '#0F172A') {
            this.setAccentColor('#0EA5A0');
        } else if (!isDark && accentColor === '#FFFFFF') {
            this.setAccentColor('#0EA5A0');
        }

        this.renderAccentDropdown();
    }

    toggleAccentDropdown(event) {
        if (event) event.stopPropagation();

        const dropdown = document.getElementById('accentColorDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                this.renderAccentDropdown();
            }
        }
    }

    renderAccentDropdown() {
        const dropdown = document.getElementById('accentColorDropdown');
        if (!dropdown) return;

        const isDark = document.body.classList.contains('dark-theme');
        const savedColor = localStorage.getItem('accentColor') || '#0EA5A0';

        const allOptions = [
            { name: 'Teal', hex: '#0EA5A0' },
            { name: 'Sky Blue', hex: '#38BDF8' },
            { name: 'Sunrise', hex: '#F59E0B' },
            { name: 'Purple', hex: '#8A2BE2' },
            { name: 'White', hex: '#FFFFFF', darkOnly: true },
            { name: 'Slate', hex: '#0F172A', lightOnly: true }
        ];

        const options = allOptions.filter(opt => {
            if (opt.darkOnly && !isDark) return false;
            if (opt.lightOnly && isDark) return false;
            return true;
        });

        dropdown.innerHTML = `
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); font-weight: 700; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--color-border); text-transform: uppercase; letter-spacing: 0.5px;">Accent Theme</div>
            ${options.map(opt => {
            const isActive = savedColor.toUpperCase() === opt.hex.toUpperCase();
            return `
                    <button class="accent-color-option ${isActive ? 'active' : ''}" onclick="pomodoroTimer.selectAccentColor('${opt.hex}')">
                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${opt.hex}; border: 1px solid ${opt.hex === '#FFFFFF' ? '#78716C' : 'transparent'};"></span>
                        <span style="flex: 1; font-weight: 600;">${opt.name}</span>
                        ${isActive ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8L6 11L13 4"/></svg>' : ''}
                    </button>
                `;
        }).join('')}
        `;
    }

    selectAccentColor(hex) {
        this.setAccentColor(hex);
        this.renderAccentDropdown();
    }

    setAccentColor(hex) {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', hex);
        root.style.setProperty('--color-primary-light', this.adjustColorBrightness(hex, 15));
        root.style.setProperty('--color-primary-dark', this.adjustColorBrightness(hex, -15));

        const contrastHex = this.getContrastColor(hex);
        root.style.setProperty('--color-primary-contrast', contrastHex);

        localStorage.setItem('accentColor', hex);
    }

    getContrastColor(hex) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 150) ? '#1C1917' : '#FFFFFF';
    }

    adjustColorBrightness(hex, percent) {
        let num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    }

    // ============================================
    // GAMIFICATION AND XP SYSTEM (STANDALONE SYNC)
    // ============================================

    gainXP(amount, reason) {
        this.userXP += amount;
        let leveledUp = false;

        while (this.userXP >= this.getXPNeededForLevel(this.userLevel)) {
            this.userXP -= this.getXPNeededForLevel(this.userLevel);
            this.userLevel++;
            leveledUp = true;
        }

        // Save locally
        localStorage.setItem('userLevel', this.userLevel);
        localStorage.setItem('userXP', this.userXP);

        this.updateXPUI();
        this.showXPFloatingText(amount, reason);

        if (leveledUp) {
            this.showLevelUpCelebration();
        }
    }

    getXPNeededForLevel(level) {
        return level * 500;
    }

    updateXPUI() {
        const levelBadge = document.getElementById('globalLevelBadge');
        const xpText = document.getElementById('globalXPText');
        const xpBarFill = document.getElementById('globalXPBarFill');

        const needed = this.getXPNeededForLevel(this.userLevel);
        const percent = Math.min(100, Math.max(0, (this.userXP / needed) * 100));

        if (levelBadge) levelBadge.textContent = `L${this.userLevel}`;
        if (xpText) xpText.textContent = `${this.userXP} / ${needed} XP`;
        if (xpBarFill) xpBarFill.style.width = `${percent}%`;
    }

    showXPFloatingText(amount, reason) {
        const badge = document.getElementById('globalLevelBadge');
        if (!badge) return;

        const rect = badge.getBoundingClientRect();
        const floatingText = document.createElement('div');
        floatingText.className = 'xp-floating-text';
        floatingText.style.left = `${rect.left + rect.width / 2}px`;
        floatingText.style.top = `${rect.top}px`;
        floatingText.style.transform = 'translate(-50%, -100%)';
        floatingText.style.color = 'var(--color-primary)';
        floatingText.style.fontWeight = '800';
        floatingText.style.fontSize = 'var(--font-size-lg)';
        floatingText.innerHTML = `+${amount} XP <span style="font-size: var(--font-size-xs); font-weight: 500; color: var(--color-text-secondary); display: block; text-align: center;">${reason}</span>`;

        document.body.appendChild(floatingText);

        setTimeout(() => {
            floatingText.remove();
        }, 1200);
    }

    showLevelUpCelebration() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.animation = 'fadeIn var(--transition-fast) ease-out forwards';

        const card = document.createElement('div');
        card.style.background = 'var(--color-surface)';
        card.style.padding = 'var(--spacing-2xl)';
        card.style.borderRadius = 'var(--radius-2xl)';
        card.style.border = '2px solid var(--color-primary)';
        card.style.boxShadow = 'var(--shadow-2xl)';
        card.style.textAlign = 'center';
        card.style.maxWidth = '400px';
        card.style.width = '90%';
        card.style.animation = 'authOverlayPop var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        card.innerHTML = `
            <div style="font-size: 64px; margin-bottom: var(--spacing-md); line-height: 1;">🎉</div>
            <h2 style="font-family: var(--font-display); font-size: var(--font-size-3xl); font-weight: 800; color: var(--color-primary); margin-bottom: var(--spacing-xs);">Level Up!</h2>
            <p style="font-family: var(--font-body); color: var(--color-text-secondary); margin-bottom: var(--spacing-xl);">Congratulations! You have reached <strong>Level ${this.userLevel}</strong>.</p>
            <button class="btn-primary" style="width: 100%;" onclick="this.parentElement.parentElement.remove()">Awesome!</button>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Confetti Burst animation
        const colors = ['#0EA5A0', '#38BDF8', '#F59E0B', '#8A2BE2', '#EF4444', '#10B981'];
        for (let i = 0; i < 80; i++) {
            const p = document.createElement('div');
            p.style.position = 'fixed';
            p.style.left = '50vw';
            p.style.top = '50vh';
            p.style.width = `${Math.random() * 8 + 6}px`;
            p.style.height = `${Math.random() * 12 + 6}px`;
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.zIndex = '10001';
            p.style.borderRadius = '2px';

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 15 + 10;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity - 4;

            p.dataset.dx = dx;
            p.dataset.dy = dy;
            p.dataset.x = window.innerWidth / 2;
            p.dataset.y = window.innerHeight / 2;
            p.dataset.rotation = Math.random() * 360;
            p.dataset.spin = Math.random() * 10 - 5;

            document.body.appendChild(p);

            let gravity = 0.4;
            let opacity = 1;
            const animate = () => {
                let x = parseFloat(p.dataset.x) + parseFloat(p.dataset.dx);
                let y = parseFloat(p.dataset.y) + parseFloat(p.dataset.dy);
                let currentDy = parseFloat(p.dataset.dy) + gravity;
                let rotation = parseFloat(p.dataset.rotation) + parseFloat(p.dataset.spin);

                p.dataset.x = x;
                p.dataset.y = y;
                p.dataset.dy = currentDy;
                p.dataset.rotation = rotation;

                p.style.left = `${x}px`;
                p.style.top = `${y}px`;
                p.style.transform = `rotate(${rotation}deg)`;

                opacity -= 0.015;
                p.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    p.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize the app
const pomodoroTimer = new PomodoroTimer();
