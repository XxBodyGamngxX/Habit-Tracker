// State Management
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let currentView = localStorage.getItem('habitView') || 'grid';
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const habitsGrid = document.getElementById('habitsGrid');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitModal = document.getElementById('habitModal');
const habitForm = document.getElementById('habitForm');
const habitNameInput = document.getElementById('habitName');
const habitDaysInput = document.getElementById('habitDays');
const habitIdInput = document.getElementById('habitId');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const emptyState = document.getElementById('emptyState');
const modalTitle = document.getElementById('modalTitle');
const submitBtnText = document.getElementById('submitBtnText');

// View & Theme Controls
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const themeToggle = document.getElementById('themeToggle');

// Stats Elements
const activeHabitsCount = document.getElementById('activeHabitsCount');
const completedTodayCount = document.getElementById('completedTodayCount');
const currentStreak = document.getElementById('currentStreak');

// Initialize
function init() {
    applyTheme();
    applyView();
    renderHabits();
    updateStats();
    setupEventListeners();
}

function setupEventListeners() {
    addHabitBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    habitForm.addEventListener('submit', handleFormSubmit);

    // View switching
    gridViewBtn.addEventListener('click', () => switchView('grid'));
    listViewBtn.addEventListener('click', () => switchView('list'));

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Navigation theme toggle (if exists)
    const navThemeToggle = document.getElementById('navThemeToggle');
    if (navThemeToggle) {
        navThemeToggle.addEventListener('click', toggleTheme);
    }

    // Close modal on backdrop click
    habitModal.addEventListener('click', (e) => {
        if (e.target === habitModal || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && habitModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Theme Functions
function applyTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

// View Functions
function applyView() {
    if (currentView === 'list') {
        habitsGrid.classList.add('list-view');
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    } else {
        habitsGrid.classList.remove('list-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    }
}

function switchView(view) {
    currentView = view;
    localStorage.setItem('habitView', view);
    applyView();
}

// Modal Functions
function openModal(habitId = null) {
    habitModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const priorityRadios = document.getElementsByName('priority');
    const colorRadios = document.getElementsByName('cardColor');

    if (habitId) {
        const habit = habits.find(h => h.id === habitId);
        modalTitle.innerText = 'Edit Habit';
        submitBtnText.innerText = 'Save Changes';
        habitNameInput.value = habit.name;
        habitDaysInput.value = habit.days || 21;
        habitIdInput.value = habit.id;

        const priority = habit.priority || 'low';
        priorityRadios.forEach(radio => {
            radio.checked = radio.value === priority;
        });

        const cardColor = habit.cardColor || 'default';
        colorRadios.forEach(radio => {
            radio.checked = radio.value === cardColor;
        });
    } else {
        modalTitle.innerText = 'Create New Habit';
        submitBtnText.innerText = 'Create Habit';
        habitForm.reset();
        habitIdInput.value = '';
        habitDaysInput.value = 21;
        if (priorityRadios.length > 0) priorityRadios[0].checked = true;
        if (colorRadios.length > 0) colorRadios[0].checked = true;
    }

    setTimeout(() => habitNameInput.focus(), 100);
}

function closeModal() {
    habitModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Habit Operations
function handleFormSubmit(e) {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    const days = parseInt(habitDaysInput.value) || 21;
    const id = habitIdInput.value;

    const priorityInput = document.querySelector('input[name="priority"]:checked');
    const priority = priorityInput ? priorityInput.value : 'low';

    const colorInput = document.querySelector('input[name="cardColor"]:checked');
    const cardColor = colorInput ? colorInput.value : 'default';

    if (id) {
        // Edit existing
        habits = habits.map(h => {
            if (h.id === id) {
                let newProgress = h.progress;
                if (days !== h.days) {
                    newProgress = Array(days).fill(false);
                    for (let i = 0; i < Math.min(h.progress.length, days); i++) {
                        newProgress[i] = h.progress[i];
                    }
                }
                return { ...h, name, priority, days, cardColor, progress: newProgress };
            }
            return h;
        });
    } else {
        // Create new
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            priority: priority,
            days: days,
            cardColor: cardColor,
            createdAt: new Date().toISOString(),
            progress: Array(days).fill(false)
        };
        habits.push(newHabit);
    }

    saveAndRender();
    closeModal();
}

window.deleteHabit = function (id) {
    habits = habits.filter(h => h.id !== id);
    saveAndRender();
};

window.resetHabit = function (id) {
    habits = habits.map(h => {
        if (h.id === id) {
            const days = h.days || 21;
            return { ...h, progress: Array(days).fill(false) };
        }
        return h;
    });
    saveAndRender();
};

window.openModal = openModal;

function toggleDay(habitId, dayIndex) {
    habits = habits.map(h => {
        if (h.id === habitId) {
            const newProgress = [...h.progress];
            newProgress[dayIndex] = !newProgress[dayIndex];
            return { ...h, progress: newProgress };
        }
        return h;
    });
    saveAndRender();
}

window.toggleDay = toggleDay;

function saveAndRender() {
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    updateStats();
}

// Stats Calculation
function updateStats() {
    // Active habits count
    activeHabitsCount.textContent = habits.length;

    // Completed today (habits that have at least one day checked)
    const completedToday = habits.filter(h => h.progress.some(Boolean)).length;
    completedTodayCount.textContent = completedToday;

    // Current streak (simplified - count consecutive completed habits)
    const streak = habits.filter(h => {
        const days = h.days || 21;
        const completedDays = h.progress.filter(Boolean).length;
        return completedDays === days;
    }).length;
    currentStreak.textContent = streak;
}

// Rendering
function renderHabits() {
    habitsGrid.innerHTML = '';

    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    habits.forEach((habit, index) => {
        const days = habit.days || 21;
        const completedDays = habit.progress.filter(Boolean).length;
        const progressPercent = Math.round((completedDays / days) * 100);
        const priority = habit.priority || 'low';
        const isCompleted = completedDays === days;
        const cardColor = habit.cardColor || 'default';

        const card = document.createElement('div');
        card.className = `habit-card${cardColor !== 'default' ? ' card-' + cardColor : ''}`;
        card.setAttribute('draggable', 'true');
        card.dataset.id = habit.id;

        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <h3 class="habit-name">${habit.name}</h3>
                    <div class="habit-meta">
                        <span class="priority-badge ${priority}">
                            <span class="priority-dot"></span>
                            ${priority}
                        </span>
                        <span>•</span>
                        <span>${days} days</span>
                        ${isCompleted ? '<span>•</span><span>✓ Completed</span>' : ''}
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="icon-btn" onclick="openModal('${habit.id}')" title="Edit habit">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25C15.4142 1.83579 16.0858 1.83579 16.5 2.25C16.9142 2.66421 16.9142 3.33579 16.5 3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deleteHabit('${habit.id}')" title="Delete habit">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            ${isCompleted ? `
                <div class="completion-badge">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Habit Completed!</span>
                </div>
            ` : ''}

            <div class="progress-grid">
                ${habit.progress.map((isDone, dayIdx) => `
                    <div 
                        class="day-cell ${isDone ? 'completed' : ''}" 
                        onclick="toggleDay('${habit.id}', ${dayIdx})"
                        title="Day ${dayIdx + 1}"
                    >
                        ${dayIdx + 1}
                    </div>
                `).join('')}
            </div>

            <div class="progress-section">
                <div class="progress-header">
                    <span class="progress-label">Progress</span>
                    <span class="progress-stats">${completedDays}/${days} • ${progressPercent}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                </div>
            </div>

            ${isCompleted ? `
                <button class="btn-reset" onclick="resetHabit('${habit.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C6.11438 14 4.44349 13.0602 3.38734 11.6458" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M2 11V8H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Reset Progress
                </button>
            ` : ''}
        `;

        habitsGrid.appendChild(card);

        // Drag and Drop event handlers
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
    });
}

// Drag and Drop Functions
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.habit-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem === this) return;

    const draggedId = draggedItem.dataset.id;
    const targetId = this.dataset.id;

    const draggedIndex = habits.findIndex(h => h.id === draggedId);
    const targetIndex = habits.findIndex(h => h.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item and insert at new position
        const [removed] = habits.splice(draggedIndex, 1);
        habits.splice(targetIndex, 0, removed);
        saveAndRender();
    }
}

// Start the app
init();
