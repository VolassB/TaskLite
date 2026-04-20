// ====================== ПОИСК ЭЛЕМЕНТОВ ======================
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

// ====================== LOCALSTORAGE ======================
const STORAGE_KEY = 'habits';

function loadHabits() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const categoryDictionary = {
    'color-red': 'Здоровье и тело',
    'color-orange': 'Дом и быт',
    'color-green': 'Спорт',
    'color-blue': 'Работа и финансы',
    'color-purple': 'Учёба и развитие',
    'color-pink': 'Эмоциональное состояние'
};

function getCategoryName(colorClass) {
    return categoryDictionary[colorClass] || 'Другое';
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ====================== ЛОГИКА РАСПИСАНИЯ ======================
function isDayActive(habit, dayIndex) {
    const schedule = habit.schedule || 'daily';
    if (schedule === 'daily') return true;
    if (schedule === 'weekdays') return dayIndex <= 4;
    if (schedule === 'custom') return Array.isArray(habit.activeDays) && habit.activeDays.includes(dayIndex);
    return true;
}

function getPlannedDaysPerWeek(habit) {
    const schedule = habit.schedule || 'daily';
    if (schedule === 'daily') return 7;
    if (schedule === 'weekdays') return 5;
    if (schedule === 'custom') return Array.isArray(habit.activeDays) ? habit.activeDays.length : 0;
    return 7;
}

function getMaxGoal(habit) {
    return getPlannedDaysPerWeek(habit) * 3;
}

function calculateStreak(habit) {
    const period = habit.trackingDays || 21;
    const completions = habit.completions || [];
    if (completions.length !== period) return 0;

    let streak = 0;
    let foundLast = false;

    for (let i = period - 1; i >= 0; i--) {
        const dayOfWeek = i % 7;
        const isActive = isDayActive(habit, dayOfWeek);
        const isCompleted = completions[i];

        if (!foundLast) {
            if (isActive && isCompleted) {
                foundLast = true;
                streak = 1;
            }
            continue;
        }

        if (isActive) {
            if (isCompleted) streak++;
            else break;
        }
    }
    return streak;
}

function isWeekCompleted(habit, startIdx, weekLength) {
    const completions = habit.completions || [];
    for (let i = 0; i < weekLength; i++) {
        const idx = startIdx + i;
        if (idx >= completions.length) break;
        const dayOfWeek = idx % 7;
        const isActive = isDayActive(habit, dayOfWeek);
        if (isActive && !completions[idx]) return false;
    }
    return true;
}

// ====================== НОРМАЛИЗАЦИЯ ======================
function normalizeHabit(habit) {
    const normalized = { ...habit };

    if (!Array.isArray(normalized.activeDays)) normalized.activeDays = [];
    
    const period = normalized.trackingDays || 21;
    normalized.trackingDays = period;

    if (!Array.isArray(normalized.completions) || normalized.completions.length !== period) {
        normalized.completions = Array(period).fill(false);
    }

    if (typeof normalized.showAllWeeks === 'undefined') {
        normalized.showAllWeeks = false;
    }

    const maxGoal = getPlannedDaysPerWeek(normalized) * 3; // используем существующую функцию
    normalized.goal = Math.max(0, Math.min(maxGoal, Number(normalized.goal) || 0));

    return normalized;
}

// Получить выбранные дни недели
function getSelectedDays() {
    return Array.from(daysList.querySelectorAll('.day-btn.active'))
                .map(btn => parseInt(btn.dataset.day));
}

// Обработчики цвета
function setupColorSelection() {
    colorOptions.addEventListener('click', (e) => {
        const row = e.target.closest('.color-row');
        if (!row) return;

        document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        habitForm.dataset.selectedColor = row.querySelector('.color-tag').classList[1];
    });
}

// ====================== ФУНКЦИЯ COMMIT ======================
function commit() {
    saveHabits(habits);
    renderHabits();
}

// ====================== ПОИСК ПРИВЫЧКИ ПО ID ======================
function findHabitById(id) {
    return habits.find(h => h.id === id);
}

// ====================== СБРОС ВЫДЕЛЕНИЯ ДНЕЙ ======================
function resetDaySelection() {
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ====================== ОТКРЫТИЕ ФОРМЫ ======================
function openForm() {
    habitForm.style.display = 'block';
    addHabitBtn.style.display = 'none';
    
    // Очистка формы
    habitNameInput.value = '';
    habitFrequencySelect.value = 'everyday';
    habitGoalInput.value = '';
    habitForm.dataset.selectedColor = 'color-red';
    
    document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
    customDaysBlock.classList.add('hidden');
    resetDaySelection();
    
    habitNameInput.focus();
}

// ====================== ЗАКРЫТИЕ ФОРМЫ И ОЧИСТКА ======================
function closeForm() {
    habitForm.style.display = 'none';
    addHabitBtn.style.display = 'block';
    
    // Сброс полей
    habitNameInput.value = '';
    habitFrequencySelect.value = 'everyday';
    habitGoalInput.value = '';
    
    // Сброс выбора цвета и дней
    document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
    resetDaySelection();
    customDaysBlock.classList.add('hidden');
}

// ====================== РЕНДЕР СПИСКА ПРИВЫЧЕК ======================
function renderHabits() {
    habitsList.innerHTML = '';

    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    habits.forEach((habit) => {
        const period = habit.trackingDays || 21;

        if (!habit.completions || habit.completions.length !== period) {
            habit.completions = Array(period).fill(false);
        }

        const streak = calculateStreak(habit);
        const numWeeks = Math.ceil(period/7);
        const showAll = habit.showAllWeeks === true;

        const card = document.createElement('div');
        card.className = 'habit-card';
        card.dataset.id = habit.id;

        // Карточка
        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="habit-color ${habit.color}"></div>
                        <h3 class="habit-title">${escapeHtml(habit.name)}</h3>
                    </div>
                    <div class="habit-meta">
                        <span class="habit-category">${getCategoryName(habit.color)}</span>
                        ${streak > 0 ? `<span style="color:#10b981; font-weight:600; margin-left:8px;">🔥 ${streak} дней</span>` : ''}
                    </div>
                </div>
                <button class="habit-delete" data-id="${habit.id}">×</button>
            </div>
        `;

        // === НЕДЕЛЬНЫЙ ТРЕКЕР ===
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'weeks-container';

        const incompleteWeekIndices = [];
        for (let w = 0; w < numWeeks; w++) {
            const startIdx = w * 7;
            const weekLength = Math.min(7, period - startIdx);
            const isCompleted = isWeekCompleted(habit, startIdx, weekLength);
            if (!isCompleted) {
                incompleteWeekIndices.push(w)
            }
        }

        // Какие недели показывать по умолчанию
        const weeksToShow = showAll 
            ? Array.from({ length: numWeeks }, (_, i) => i) 
            : incompleteWeekIndices.slice(0, 3);

        for (let w of weeksToShow) {
            const startIdx = w * 7;
            const weekLength = Math.min(7, period - startIdx);
            const isCompleted = isWeekCompleted(habit, startIdx, weekLength);

            const weekDiv = document.createElement('div');
            weekDiv.className = `week ${isCompleted ? 'week--completed' : ''}`;

            // Заголовок недели
            const header = document.createElement('div');
            header.className = 'week-header';
            header.innerHTML = `
                <div class="week-title">
                    Неделя ${w + 1}
                    ${isCompleted ? `<span class="check">✓</span>` : ''}
                </div>
            `;

            // Дни недели
            const daysDiv = document.createElement('div');
            daysDiv.className = 'week-days';

            for (let d = 0; d < weekLength; d++) {
                const dayIdx = startIdx + d;
                const dayOfWeek = dayIdx % 7;
                const isDayCompleted = habit.completions[dayIdx];
                const isActive = isDayActive(habit, dayOfWeek);

                const btn = document.createElement('button');
                btn.className = `day-btn ${isDayCompleted ? 'done' : ''} ${!isActive ? 'day--off' : ''}`;
                btn.textContent = dayLabels[dayOfWeek];
                btn.dataset.index = dayIdx;

                if (!isActive) btn.disabled = true;

                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    habit.completions[dayIdx] = !habit.completions[dayIdx];
                    saveHabits(habits);
                    renderHabits();
                });

                daysDiv.appendChild(btn);
            }

            // По умолчанию сворачиваем только выполненные недели
            if (isCompleted) daysDiv.style.display = 'none';

            // Клик по заголовку — сворачивание/разворачивание
            header.addEventListener('click', (e) => {
                // игнорируем клик по кнопке удаления (если она внутри)
                if (e.target.classList.contains('habit-delete')) return;
                daysDiv.style.display = daysDiv.style.display === 'none' ? 'flex' : 'none';
            });

            weekDiv.appendChild(header);
            weekDiv.appendChild(daysDiv);
            weeksContainer.appendChild(weekDiv);
        }

        // Кнопка «Показать / Скрыть историю»
        const hasHiddenContent = incompleteWeekIndices.length > 3 || incompleteWeekIndices.length < numWeeks;
        if (!showAll && hasHiddenContent) {
            const historyBtn = document.createElement('button');
            historyBtn.className = 'history-btn';
            historyBtn.textContent = 'Показать историю';
            historyBtn.addEventListener('click', () => {
                habit.showAllWeeks = true;
                saveHabits(habits);
                renderHabits();
            });
            weeksContainer.appendChild(historyBtn);
        } else if (showAll && numWeeks > 0) {
            const historyBtn = document.createElement('button');
            historyBtn.className = 'history-btn';
            historyBtn.textContent = 'Скрыть историю';
            historyBtn.addEventListener('click', () => {
                habit.showAllWeeks = false;
                saveHabits(habits);
                renderHabits();
            });
            weeksContainer.appendChild(historyBtn);
        }

        card.appendChild(weeksContainer);
        habitsList.appendChild(card);
    });
}

// ====================== ЕДИНЫЙ ОБРАБОТЧИК (Event Delegation) ======================
function attachCardListeners() {
    // Удаление привычки
    habitsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('habit-delete')) {
            const id = e.target.dataset.id;
            const index = habits.findIndex(h => h.id === id);
            if (index !== -1 && confirm('Удалить привычку?')) {
                habits.splice(index, 1);
                saveHabits(habits);
                renderHabits();
            }
        }

        // Клик по дню трекера
        if (e.target.classList.contains('day-btn')) {
            const btn = e.target;
            if (btn.disabled) return;

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

function setupColorOptions() {
    colorOptions.innerHTML = '';
    const colors = [
        { class: 'color-red', name: 'Здоровье и тело' },
        { class: 'color-orange', name: 'Дом и быт' },
        { class: 'color-green', name: 'Спорт' },
        { class: 'color-blue', name: 'Работа и финансы' },
        { class: 'color-purple', name: 'Учёба и развитие' },
        { class: 'color-pink', name: 'Эмоциональное состояние' }
    ];

    colors.forEach(color => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `<div class="color-tag ${color.class}"></div><span>${color.name}</span>`;
        row.addEventListener('click', () => {
            document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            habitForm.dataset.selectedColor = color.class;
        });
        colorOptions.appendChild(row);
    });
}

// ====================== НАСТРОЙКА ДНЕЙ ======================
// ====================== СОЗДАНИЕ КНОПОК ДНЕЙ ======================
function setupDaysButtons() {
    daysList.innerHTML = '';

    dayLabels.forEach((label, index) => {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.textContent = label;
        btn.dataset.day = index;
        daysList.appendChild(btn);
    });
}

// ====================== ОБРАБОТЧИКИ ФОРМЫ ======================
function setupEventListeners() {
    // Открытие формы
    addHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'block';
        addHabitBtn.style.display = 'none';
        setupDaysButtons();
        habitGoalInput.value = '21';
    });

    // Закрытие формы
    cancelHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
    });

    // Изменение типа расписания
    habitFrequencySelect.addEventListener('change', () => {
        if (habitFrequencySelect.value === 'custom') {
            customDaysBlock.style.display = 'block';
        } else {
            customDaysBlock.style.display = 'none';
        }
    });

    // === КЛИК ПО ДНЯМ (самое важное исправление) ===
    daysList.addEventListener('click', (e) => {
        const btn = e.target.closest('.day-btn');
        if (btn) {
            btn.classList.toggle('active');
        }
    });

    // Сохранение привычки
    saveHabitBtn.addEventListener('click', () => {
        const name = habitNameInput.value.trim();
        if (!name) {
            alert('Введите название привычки');
            return;
        }

        const schedule = habitFrequencySelect.value;
        let activeDays = [];

        if (schedule === 'custom') {
            activeDays = Array.from(daysList.querySelectorAll('.day-btn.active'))
                              .map(btn => parseInt(btn.dataset.day));
        }

        const trackingDays = parseInt(habitGoalInput.value) || 21;

        const newHabit = {
            id: Date.now(),
            name: name,
            color: habitForm.dataset.selectedColor || 'color-red',
            schedule: schedule,
            activeDays: activeDays,
            trackingDays: trackingDays,
            completions: Array(trackingDays).fill(false),
            goal: trackingDays,
            showAllWeeks: false
        };

        habits.unshift(newHabit);
        saveHabits(habits);
        renderHabits();

        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
    });
}

// ====================== ИНИЦИАЛИЗАЦИЯ ======================
let habits = loadHabits().map(normalizeHabit);

function init() {
    if (!habitsList) return;
    renderHabits();
    setupEventListeners();
    setupColorOptions();
    setupDaysButtons();
    setupColorSelection();
}

document.addEventListener('DOMContentLoaded', init);