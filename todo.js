// To-Do List Application
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.initTheme();
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
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
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
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
}

// Initialize the app
const todoApp = new TodoApp();
