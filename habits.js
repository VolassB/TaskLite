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
let habits = loadHabits();

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

    habits.forEach((habit, index) => {
        const card = document.createElement('div');
        card.className = 'habit-card';
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
                <button class="habit-delete" data-index="${index}">×</button>
            </div>
        `;

        habitsList.appendChild(card);
    });

    // Добавляем обработчики удаления
    document.querySelectorAll('.habit-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (confirm('Удалить привычку?')) {
                habits.splice(index, 1);
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
        habitForm.reset();
        customDaysBlock.classList.add('hidden');
        document.querySelectorAll('.color-row').forEach(r => r.classList.remove('selected'));
    });

    // Отмена
    cancelHabitBtn.addEventListener('click', () => {
        habitForm.style.display = 'none';
        addHabitBtn.style.display = 'block';
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

// ====================== ЗАПУСК ======================
document.addEventListener('DOMContentLoaded', init);