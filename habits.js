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

// ====================== КЛЮЧ ДЛЯ LOCALSTORAGE ======================
const STORAGE_KEY = 'habits';

// ====================== РАБОТА С LOCALSTORAGE ======================
function loadHabits() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Ошибка при загрузке привычек:', e);
        return [];
    }
}

function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// Инициализация массива привычек
let habits = loadHabits().map(normalizeHabit);

// ====================== ОСНОВНАЯ ЛОГИКА ======================
function init() {
    if (!habitsList || !habitForm) return;

    renderHabits();
    setupEventListeners();
    setupColorOptions();
    setupDaysButtons();
}

// ====================== ПРОДВИНУТАЯ ЧАСТЬ ======================

// Массив подписей дней недели
const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Словарь категорий
const categoryDictionary = {
    'color-red':    'Здоровье и тело',
    'color-orange': 'Дом и быт',
    'color-green':  'Спорт',
    'color-blue':   'Работа и финансы',
    'color-purple': 'Учёба и развитие',
    'color-pink':   'Эмоциональное состояние'
};

// Функция получения названия категории
function getCategoryName(colorClass) {
    return categoryDictionary[colorClass] || 'Другое';
}

// Экранирование текста
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ====================== РЕНДЕР СПИСКА ПРИВЫЧЕК ======================
function renderHabits() {
    habitsList.innerHTML = '';

    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    habits.forEach((habit, habitIndex) => {
        const card = document.createElement('div');
        card.className = 'habit-card';

        // Создаём трекер дней
        let trackerHTML = '<div class="habit-tracker">';
        
        for (let i = 0; i < 7; i++) {
            const isCompleted = habit.completedDays && habit.completedDays.includes(i);
            
            trackerHTML += `
                <div class="habit-day ${isCompleted ? 'completed' : ''}" 
                     data-habit-index="${habitIndex}" 
                     data-day="${i}">
                    ${dayLabels[i]}
                </div>
            `;
        }
        trackerHTML += '</div>';

        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="habit-color ${habit.color}"></div>
                        <h3 class="habit-title">${escapeHtml(habit.name)}</h3>
                    </div>
                    <div class="habit-meta">
                        <span class="habit-category">${getCategoryName(habit.color)}</span>
                    </div>
                </div>
                <button class="habit-delete" data-habit-index="${habitIndex}">×</button>
            </div>
            
            ${trackerHTML}
        `;

        habitsList.appendChild(card);
    });

    // === Обработчики клика по дням трекера ===
    document.querySelectorAll('.habit-day').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const habitIndex = parseInt(dayEl.dataset.habitIndex);
            const dayIndex = parseInt(dayEl.dataset.day);

            const habit = habits[habitIndex];
            
            if (!habit.completedDays) habit.completedDays = [];

            if (habit.completedDays.includes(dayIndex)) {
                habit.completedDays = habit.completedDays.filter(d => d !== dayIndex);
            } else {
                habit.completedDays.push(dayIndex);
            }

            saveHabits(habits);
            renderHabits(); // перерисовываем всё
        });
    });

    // === Обработчики удаления привычки ===
    document.querySelectorAll('.habit-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const habitIndex = parseInt(e.target.dataset.habitIndex);
            
            if (confirm('Удалить привычку?')) {
                habits.splice(habitIndex, 1);
                saveHabits(habits);
                renderHabits();
            }
        });
    });
}

// ====================== НАСТРОЙКА ЦВЕТОВЫХ ОПЦИЙ ======================
function setupColorOptions() {
    colorOptions.innerHTML = '';

    const colors = [
        { class: 'color-red',    name: 'Здоровье и тело' },
        { class: 'color-orange', name: 'Дом и быт' },
        { class: 'color-green',  name: 'Спорт' },
        { class: 'color-blue',   name: 'Работа и финансы' },
        { class: 'color-purple', name: 'Учёба и развитие' },
        { class: 'color-pink',   name: 'Эмоциональное состояние' }
    ];

    colors.forEach(color => {
        const row = document.createElement('div');
        row.className = 'color-row';
        row.innerHTML = `
            <div class="color-tag ${color.class}"></div>
            <span>${color.name}</span>
        `;
        
        row.addEventListener('click', () => {
            // Снимаем выделение со всех
            document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
            // Выделяем текущую
            row.classList.add('selected');
            
            // Сохраняем выбранный цвет в data-атрибут формы
            habitForm.dataset.selectedColor = color.class;
        });

        colorOptions.appendChild(row);
    });
}

// ====================== НАСТРОЙКА КНОПОК ДНЕЙ ======================
function setupDaysButtons() {
    daysList.innerHTML = '';

    dayLabels.forEach((label, index) => {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.textContent = label;
        btn.dataset.day = index;

        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });

        daysList.appendChild(btn);
    });
}

// ====================== ОБРАБОТЧИКИ СОБЫТИЙ ======================
function setupEventListeners() {
    // Открытие формы
    addHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'block';
        addHabitBtn.style.display = 'none';
        
        // Ручная очистка формы
        habitNameInput.value = '';
        habitFrequencySelect.value = 'everyday';
        habitGoalInput.value = '';

        // Сброс выбранного цвета
        document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));

        // Скрываем блок кастомных дней
        customDaysBlock.classList.add('hidden');

        // Фокус на поле названия
        habitNameInput.focus();
    });

    // Отмена
    cancelHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';

        // Очистка формы при отмене
        habitNameInput.value = '';
        habitFrequencySelect.value = 'everyday';
        habitGoalInput.value = '';
        document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
        customDaysBlock.classList.add('hidden');
    });

    // Сохранение привычки
    saveHabitBtn.addEventListener('click', () => {
        const name = habitNameInput.value.trim();
        const selectedColor = habitForm.dataset.selectedColor;

        if (!name) {
            alert('Введите название привычки');
            return;
        }
        if (!selectedColor) {
            alert('Выберите цвет категории');
            return;
        }

        const newHabit = {
            id: Date.now(),
            name: name,
            color: selectedColor,
            createdAt: new Date().toISOString()
        };

        habits.unshift(newHabit); // добавляем в начало
        saveHabits(habits);
        renderHabits();

        // Закрываем форму
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
    });

    // Показывать блок кастомных дней при выборе "Свой график"
    habitFrequencySelect.addEventListener('change', () => {
        if (habitFrequencySelect.value === 'custom') {
            customDaysBlock.classList.remove('hidden');
        } else {
            customDaysBlock.classList.add('hidden');
        }
    });
}

// ====================== ПРОДВИНУТАЯ ЧАСТЬ — ШАГИ 1-4 ======================

// Шаг 1. Функция определения активности дня недели
function isDayActive(habit, dayIndex) {
    const schedule = habit.schedule || 'daily';

    if (schedule === 'daily') {
        return true;
    }

    if (schedule === 'weekdays') {
        return dayIndex <= 4; // 0-4 = Пн-Пт
    }

    if (schedule === 'custom') {
        return habit.activeDays && habit.activeDays.includes(dayIndex);
    }

    return true;
}

// Шаг 2. Количество запланированных дней в неделю
function getPlannedDaysPerWeek(habit) {
    const schedule = habit.schedule || 'daily';

    if (schedule === 'daily') return 7;
    if (schedule === 'weekdays') return 5;
    if (schedule === 'custom') return habit.activeDays ? habit.activeDays.length : 0;

    return 7;
}

// Шаг 3. Максимальная цель (3 недели = 21 день)
function getMaxGoal(habit) {
    const plannedPerWeek = getPlannedDaysPerWeek(habit);
    return plannedPerWeek * 3; // 21 день максимум
}

// Шаг 4 + 5.1 + 5.2 — Подсчёт серии (streak)
function calculateStreak(habit) {
    if (!habit.completions || habit.completions.length !== 21) {
        return 0;
    }

    let streak = 0;
    let foundLast = false;

    // Идём с конца (самый новый день = индекс 20)
    for (let i = 20; i >= 0; i--) {
        const isActiveDay = isDayActive(habit, i % 7); // день недели = i % 7
        const isCompleted = habit.completions[i];

        if (!foundLast) {
            if (isActiveDay && isCompleted) {
                foundLast = true;
                streak = 1;
            }
            continue;
        }

        // После нахождения последнего выполненного дня
        if (isActiveDay) {
            if (isCompleted) {
                streak++;
            } else {
                break; // пропуск активного дня — серия прерывается
            }
        }
    }

    return streak;
}

// ====================== НОРМАЛИЗАЦИЯ ПРИВЫЧКИ ======================

// Шаг 1. Нормализация привычки
function normalizeHabit(habit) {
    const normalized = { ...habit };

    // Шаг 2. Гарантируем наличие activeDays
    if (!Array.isArray(normalized.activeDays)) {
        if (normalized.schedule === 'custom') {
            normalized.activeDays = [];
        } else {
            normalized.activeDays = [];
        }
    }

    // Шаг 3. Гарантируем completions — всегда массив из 21 элемента
    if (!Array.isArray(normalized.completions) || normalized.completions.length !== 21) {
        normalized.completions = Array(21).fill(false);
    }

    // Шаг 4. Ограничиваем goal
    const maxGoal = getMaxGoal(normalized);
    normalized.goal = Math.max(0, Math.min(maxGoal, Number(normalized.goal) || 0));

    return normalized;
}

// ====================== ПРОДВИНУТАЯ ЧАСТЬ — НОРМАЛИЗАЦИЯ И СЕРИЯ ======================

// Шаг 1. Функция определения активности дня
function isDayActive(habit, dayIndex) {
    const schedule = habit.schedule || 'daily';

    if (schedule === 'daily') return true;
    if (schedule === 'weekdays') return dayIndex <= 4; // Пн–Пт
    if (schedule === 'custom') return Array.isArray(habit.activeDays) && habit.activeDays.includes(dayIndex);

    return true;
}

// Шаг 2. Количество запланированных дней в неделю
function getPlannedDaysPerWeek(habit) {
    const schedule = habit.schedule || 'daily';
    if (schedule === 'daily') return 7;
    if (schedule === 'weekdays') return 5;
    if (schedule === 'custom') return Array.isArray(habit.activeDays) ? habit.activeDays.length : 0;
    return 7;
}

// Шаг 3. Максимальная цель (3 недели)
function getMaxGoal(habit) {
    return getPlannedDaysPerWeek(habit) * 3;
}

// Шаг 4 + 5.1 + 5.2 — Подсчёт серии
function calculateStreak(habit) {
    const completions = habit.completions || [];
    if (completions.length !== 21) return 0;

    let streak = 0;
    let foundLastCompleted = false;

    for (let i = 20; i >= 0; i--) {           // идём с самого нового дня
        const dayOfWeek = i % 7;
        const isActive = isDayActive(habit, dayOfWeek);
        const isDone = completions[i];

        if (!foundLastCompleted) {
            if (isActive && isDone) {
                foundLastCompleted = true;
                streak = 1;
            }
            continue;
        }

        if (isActive) {
            if (isDone) {
                streak++;
            } else {
                break; // прерываем серию
            }
        }
    }
    return streak;
}

// ====================== НОРМАЛИЗАЦИЯ ПРИВЫЧКИ ======================

// Шаги 1–4 нормализации
function normalizeHabit(habit) {
    let normalized = { ...habit };

    // Шаг 2: Гарантируем activeDays
    if (!Array.isArray(normalized.activeDays)) {
        normalized.activeDays = [];
    }

    // Шаг 3: Гарантируем completions (ровно 21 элемент)
    if (!Array.isArray(normalized.completions) || normalized.completions.length !== 21) {
        normalized.completions = Array(21).fill(false);
    }

    // Шаг 4: Ограничиваем goal
    const max = getMaxGoal(normalized);
    normalized.goal = Math.max(0, Math.min(max, Number(normalized.goal) || 0));

    return normalized;
}

// ====================== ЗАПУСК ======================
document.addEventListener('DOMContentLoaded', init);