// To-Do List Application
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        
        // Initialize Level and XP System
        this.userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
        this.userXP = parseInt(localStorage.getItem('userXP')) || 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.initTheme();
        this.updateXPUI();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

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

    openModal(task = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtnText = document.getElementById('submitBtnText');

        if (task) {
            modalTitle.textContent = 'Edit Task';
            submitBtnText.textContent = 'Update Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDueDate').value = task.dueDate;
        } else {
            modalTitle.textContent = 'Create New Task';
            submitBtnText.textContent = 'Create Task';
            document.getElementById('taskForm').reset();
            document.getElementById('taskId').value = '';

            // Set default due date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('taskDueDate').value = today;
        }

        modal.classList.add('active');
        document.getElementById('taskName').focus();
    }

    closeModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        document.getElementById('taskForm').reset();
    }

    handleSubmit(e) {
        e.preventDefault();

        const taskId = document.getElementById('taskId').value;
        const taskName = document.getElementById('taskName').value.trim();
        const taskDueDate = document.getElementById('taskDueDate').value;

        if (taskId) {
            // Update existing task
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.name = taskName;
                task.dueDate = taskDueDate;
            }
        } else {
            // Create new task
            const newTask = {
                id: Date.now().toString(),
                name: taskName,
                dueDate: taskDueDate,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeModal();
    }

    handleFilter(e) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();

            if (task.completed && !wasCompleted) {
                this.gainXP(30, "Task Completed");
            }
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');

        let filteredTasks = this.tasks;
        if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tasksList.innerHTML = filteredTasks.map(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            let dueDateClass = '';
            let dueDateText = this.formatDate(task.dueDate);

            if (dueDate < today && !task.completed) {
                dueDateClass = 'overdue';
                dueDateText = '⚠️ Overdue - ' + dueDateText;
            } else if (dueDate.getTime() === today.getTime() && !task.completed) {
                dueDateClass = 'today';
                dueDateText = '📅 Due Today';
            }

            return `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoApp.toggleTask('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L6 11L13 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="task-content">
                        <div class="task-name">${this.escapeHtml(task.name)}</div>
                        <div class="task-due-date ${dueDateClass}">${dueDateText}</div>
                    </div>
                    <div class="task-actions">
                        <button class="icon-btn delete" onclick="todoApp.deleteTask('${task.id}')" title="Delete task">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M3 5H15M7 8V13M11 8V13M13 5V14C13 14.5 12.5 15 12 15H6C5.5 15 5 14.5 5 14V5M7 5V3C7 2.5 7.5 2 8 2H10C10.5 2 11 2.5 11 3V5" 
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasksCount').textContent = totalTasks;
        document.getElementById('completedTasksCount').textContent = completedTasks;
        document.getElementById('pendingTasksCount').textContent = pendingTasks;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : [];
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
                    <button class="accent-color-option ${isActive ? 'active' : ''}" onclick="todoApp.selectAccentColor('${opt.hex}')">
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

// Initialize the app
const todoApp = new TodoApp();
