const habitsList = document.getElementById('habitsList');
const habitForm = document.getElementById('habitForm');
const addHabitBtn = document.getElementById('addHabitBtn');
const saveHabitBtn = document.getElementById('saveHabitBtn');
const cancelHabitBtn = document.getElementById('cancelHabitBtn');
const emptyState = document.getElementById('emptyState');

const habitNameInput = document.getElementById('habitName');
const habitFrequencySelect = document.getElementById('habitFrequency');
const habitGoalInput = document.getElementById('habitGoal');
const colorOptions = document.getElementById('colorOptions');
const customDaysBlock = document.getElementById('customDaysBlock');
const daysList = document.getElementById('daysList');

const STORAGE_KEY = 'habits';

function loadHabits() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
}

function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

const dayLabels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

const categoryDictionary = {
    'color-red': 'Здоровье и тело', 'color-orange': 'Дом и быт',
    'color-green': 'Спорт', 'color-blue': 'Работа и финансы',
    'color-purple': 'Учёба и развитие', 'color-pink': 'Эмоциональное состояние'
};

function getCategoryName(c) { return categoryDictionary[c] || 'Другое'; }
function escapeHtml(str) { return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]); }

function isDayActive(h, d) {
    const s = h.schedule || 'daily';
    if (s === 'daily') return true;
    if (s === 'weekdays') return d <= 4;
    if (s === 'custom') return Array.isArray(h.activeDays) && h.activeDays.includes(d);
    return true;
}

function calculateStreak(h) {
    const c = h.completions || [];
    if (c.length !== 21) return 0;
    let streak = 0, found = false;
    for (let i = 20; i >= 0; i--) {
        if (!found) {
            if (isDayActive(h, i%7) && c[i]) { found = true; streak = 1; }
            continue;
        }
        if (isDayActive(h, i%7)) {
            if (c[i]) streak++; else break;
        }
    }
    return streak;
}

function normalizeHabit(h) {
    const n = { ...h };
    if (!Array.isArray(n.activeDays)) n.activeDays = [];
    if (!Array.isArray(n.completions) || n.completions.length !== 21) n.completions = Array(21).fill(false);
    return n;
}

let habits = loadHabits().map(normalizeHabit);

function renderHabits() {
    habitsList.innerHTML = '';
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    habits.forEach(h => {
        if (!h.completions || h.completions.length !== 21) h.completions = Array(21).fill(false);
        const streak = calculateStreak(h);

        const card = document.createElement('div');
        card.className = 'habit-card';
        card.dataset.id = h.id;

        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="habit-color ${h.color}"></div>
                        <h3 class="habit-title">${escapeHtml(h.name)}</h3>
                    </div>
                    <div class="habit-meta">
                        <span class="habit-category">${getCategoryName(h.color)}</span>
                        ${streak > 0 ? `<span style="color:#10b981;font-weight:600;margin-left:8px;">🔥 ${streak} дней</span>` : ''}
                    </div>
                </div>
                <button class="habit-delete" data-id="${h.id}">×</button>
            </div>
        `;

        const tracker = document.createElement('div');
        tracker.className = 'habit-tracker';

        for (let i = 0; i < 21; i++) {
            const isCompleted = h.completions[i];
            const isActive = isDayActive(h, i % 7);
            const btn = document.createElement('button');
            btn.className = `day-btn ${isCompleted ? 'done' : ''} ${!isActive ? 'day--off' : ''}`;
            btn.textContent = dayLabels[i % 7];
            btn.dataset.index = i;
            if (!isActive) btn.disabled = true;
            tracker.appendChild(btn);
        }
        card.appendChild(tracker);
        habitsList.appendChild(card);
    });

    attachListeners();
}

function attachListeners() {
    habitsList.addEventListener('click', e => {
        if (e.target.classList.contains('habit-delete')) {
            const id = e.target.dataset.id;
            const idx = habits.findIndex(h => h.id === id);
            if (idx !== -1 && confirm('Удалить привычку?')) {
                habits.splice(idx, 1);
                saveHabits(habits);
                renderHabits();
            }
        }

        const btn = e.target.closest('.day-btn');
        if (btn && !btn.disabled) {
            const card = btn.closest('.habit-card');
            const habitId = card.dataset.id;
            const dayIndex = parseInt(btn.dataset.index);
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                habit.completions[dayIndex] = !habit.completions[dayIndex];
                saveHabits(habits);
                renderHabits();
            }
        }
    });
}

function init() {
    renderHabits();

    // Форма
    addHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'block';
        addHabitBtn.style.display = 'none';
    });

    cancelHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
    });

    saveHabitBtn.addEventListener('click', () => {
        const name = habitNameInput.value.trim();
        if (!name) return alert('Введите название');

        const newHabit = {
            id: Date.now(),
            name,
            color: habitForm.dataset.selectedColor || 'color-red',
            schedule: habitFrequencySelect.value,
            activeDays: [],
            completions: Array(21).fill(false),
            goal: parseInt(habitGoalInput.value) || 21
        };

        habits.unshift(newHabit);
        saveHabits(habits);
        renderHabits();
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
    });
}

document.addEventListener('DOMContentLoaded', init);