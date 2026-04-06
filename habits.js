// ====================== ПОИСК ЭЛЕМЕНТОВ ======================
const habitsList = document.getElementById("habitsList");
const habitForm = document.getElementById("habitForm");
const addHabitBtn = document.getElementById("addHabitBtn");
const saveHabitBtn = document.getElementById("saveHabitBtn");
const cancelHabitBtn = document.getElementById("cancelHabitBtn");
const emptyState = document.getElementById("emptyState");

const habitNameInput = document.getElementById("habitName");
const habitFrequencySelect = document.getElementById("habitFrequency");
const habitGoalInput = document.getElementById("habitGoal");
const colorOptions = document.getElementById("colorOptions");
const customDaysBlock = document.getElementById("customDaysBlock");
const daysList = document.getElementById("daysList");

// ====================== КЛЮЧ ДЛЯ LOCALSTORAGE ======================
const STORAGE_KEY = "habits";

// ====================== РАБОТА С LOCALSTORAGE ======================
function loadHabits() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Ошибка при загрузке привычек:", e);
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ====================== ИНИЦИАЛИЗАЦИЯ МАССИВА ПРИВЫЧЕК ======================
let habits = loadHabits().map(normalizeHabit);

console.log('%cПривычки успешно загружены и нормализованы. Количество:', 'color: #7F66CC; font-weight: bold', habits.length);

// ====================== ОСНОВНАЯ ЛОГИКА ======================
function init() {
  if (!habitsList || !habitForm) return;

  renderHabits();
  setupEventListeners();
  setupColorOptions();
  setupDaysButtons();
}

// Массив подписей дней недели
const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Словарь категорий
const categoryDictionary = {
  "color-red": "Здоровье и тело",
  "color-orange": "Дом и быт",
  "color-green": "Спорт",
  "color-blue": "Работа и финансы",
  "color-purple": "Учёба и развитие",
  "color-pink": "Эмоциональное состояние",
};

// Функция получения названия категории
function getCategoryName(colorClass) {
  return categoryDictionary[colorClass] || "Другое";
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
// ====================== РЕНДЕР СПИСКА ПРИВЫЧЕК (полное соответствие практике) ======================
function renderHabits() {
    // Шаг 1: Очистка контейнера
    habitsList.innerHTML = '';

    // Шаг 2: Отображение пустого состояния
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Шаг 3: Итерация по массиву привычек
    habits.forEach((habit, habitIndex) => {
        // Защита на случай старых данных
        if (!habit.completions || habit.completions.length !== 21) {
            habit.completions = Array(21).fill(false);
        }

        const streak = calculateStreak(habit);
        const maxGoal = getMaxGoal(habit);

        // Шаг 5: Создание DOM-элемента карточки
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.dataset.id = habit.id;                    // Шаг 5 — data-id

        // Шаг 6: Заполнение структуры карточки
        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <div style="display: flex; align-items: center; gap: 12px;">
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

        // Шаг 7: Получение контейнера трекера
        const trackerContainer = document.createElement('div');
        trackerContainer.className = 'habit-tracker';

        // Шаг 8–11: Генерация 21 кнопки трекера
        for (let i = 0; i < 21; i++) {
            const dayOfWeek = i % 7;                    // 0 = Пн ... 6 = Вс
            const isCompleted = habit.completions[i];
            const isActive = isDayActive(habit, dayOfWeek);

            const dayBtn = document.createElement('button');   // Шаг 9
            dayBtn.className = `day-btn ${isCompleted ? 'done' : ''} ${!isActive ? 'day--off' : ''}`;
            dayBtn.textContent = dayLabels[dayOfWeek];
            dayBtn.dataset.index = i;                       // Шаг 9 — data-index

            // Шаг 10: Состояния кнопки
            if (!isActive) {
                dayBtn.disabled = true;
            }

            // Шаг 11: Добавление кнопки в трекер
            trackerContainer.appendChild(dayBtn);
        }

        // Добавляем трекер в карточку
        card.appendChild(trackerContainer);

        // Добавляем готовую карточку в список
        habitsList.appendChild(card);
    });

    // Обработчики событий (удаление и клик по дням) можно оставить как раньше
    // (я вынес их отдельно, чтобы не загромождать рендер)
    attachCardListeners().init();
}

// Обработчики событий для карточек (удаление и клик по дням)
function attachCardListeners() {
    // Удаление
    document.querySelectorAll('.habit-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const index = habits.findIndex(h => h.id === id);
            if (index !== -1 && confirm('Удалить привычку?')) {
                habits.splice(index, 1);
                saveHabits(habits);
                renderHabits();
            }
        });
    });

    // Клик по дню трекера
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
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
        });
    });
}

// ====================== НАСТРОЙКА ЦВЕТОВЫХ ОПЦИЙ ======================
function setupColorOptions() {
  colorOptions.innerHTML = "";

  const colors = [
    { class: "color-red", name: "Здоровье и тело" },
    { class: "color-orange", name: "Дом и быт" },
    { class: "color-green", name: "Спорт" },
    { class: "color-blue", name: "Работа и финансы" },
    { class: "color-purple", name: "Учёба и развитие" },
    { class: "color-pink", name: "Эмоциональное состояние" },
  ];

  colors.forEach((color) => {
    const row = document.createElement("div");
    row.className = "color-row";
    row.innerHTML = `
            <div class="color-tag ${color.class}"></div>
            <span>${color.name}</span>
        `;

    row.addEventListener("click", () => {
      // Снимаем выделение со всех
      document
        .querySelectorAll(".color-row")
        .forEach((r) => r.classList.remove("selected"));
      // Выделяем текущую
      row.classList.add("selected");

      // Сохраняем выбранный цвет в data-атрибут формы
      habitForm.dataset.selectedColor = color.class;
    });

    colorOptions.appendChild(row);
  });
}

// ====================== НАСТРОЙКА КНОПОК ДНЕЙ ======================
function setupDaysButtons() {
  daysList.innerHTML = "";

  dayLabels.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.textContent = label;
    btn.dataset.day = index;

    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });

    daysList.appendChild(btn);
  });
}

// ====================== ОБРАБОТЧИКИ СОБЫТИЙ ======================
function setupEventListeners() {
  // Открытие формы
  addHabitBtn.addEventListener("click", () => {
    habitForm.style.display = "block";
    addHabitBtn.style.display = "none";

    // Ручная очистка формы
    habitNameInput.value = "";
    habitFrequencySelect.value = "everyday";
    habitGoalInput.value = "";

    // Сброс выбранного цвета
    document
      .querySelectorAll(".color-row")
      .forEach((r) => r.classList.remove("selected"));

    // Скрываем блок кастомных дней
    customDaysBlock.classList.add("hidden");

    // Фокус на поле названия
    habitNameInput.focus();
  });

  // Отмена
  cancelHabitBtn.addEventListener("click", () => {
    habitForm.style.display = "none";
    addHabitBtn.style.display = "block";

    // Очистка формы при отмене
    habitNameInput.value = "";
    habitFrequencySelect.value = "everyday";
    habitGoalInput.value = "";
    document
      .querySelectorAll(".color-row")
      .forEach((r) => r.classList.remove("selected"));
    customDaysBlock.classList.add("hidden");
  });

  // Сохранение привычки
  saveHabitBtn.addEventListener("click", () => {
    const name = habitNameInput.value.trim();
    const selectedColor = habitForm.dataset.selectedColor;

    if (!name) {
      alert("Введите название привычки");
      return;
    }
    if (!selectedColor) {
      alert("Выберите цвет категории");
      return;
    }

    const newHabit = {
      id: Date.now(),
      name: name,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    habits.unshift(newHabit); // добавляем в начало
    saveHabits(habits);
    renderHabits();

    // Закрываем форму
    habitForm.style.display = "none";
    addHabitBtn.style.display = "block";
  });

  // Показывать блок кастомных дней при выборе "Свой график"
  habitFrequencySelect.addEventListener("change", () => {
    if (habitFrequencySelect.value === "custom") {
      customDaysBlock.classList.remove("hidden");
    } else {
      customDaysBlock.classList.add("hidden");
    }
  });
}

// ====================== ЛОГИКА РАСПИСАНИЯ И СЕРИИ ======================

// Определение активности дня недели
function isDayActive(habit, dayIndex) {
  const schedule = habit.schedule || "daily";

  if (schedule === "daily") return true;
  if (schedule === "weekdays") return dayIndex <= 4; // Пн–Пт (0-4)
  if (schedule === "custom") {
    return (
      Array.isArray(habit.activeDays) && habit.activeDays.includes(dayIndex)
    );
  }
  return true;
}

// Количество запланированных дней в неделю
function getPlannedDaysPerWeek(habit) {
  const schedule = habit.schedule || "daily";
  if (schedule === "daily") return 7;
  if (schedule === "weekdays") return 5;
  if (schedule === "custom")
    return Array.isArray(habit.activeDays) ? habit.activeDays.length : 0;
  return 7;
}

// Максимальная цель (3 недели = 21 день)
function getMaxGoal(habit) {
  return getPlannedDaysPerWeek(habit) * 3;
}

// Подсчёт серии выполнения
function calculateStreak(habit) {
  const completions = habit.completions || [];
  if (completions.length !== 21) return 0;

  let streak = 0;
  let foundLast = false;

  for (let i = 20; i >= 0; i--) {
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
      if (isCompleted) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}

// ====================== НОРМАЛИЗАЦИЯ ПРИВЫЧКИ ======================
function normalizeHabit(habit) {
    const normalized = { ...habit };

    // activeDays
    if (!Array.isArray(normalized.activeDays)) {
        normalized.activeDays = [];
    }

    // не пересоздаём, если уже есть корректный массив
    if (!Array.isArray(normalized.completions) || normalized.completions.length !== 21) {
        normalized.completions = Array(21).fill(false);
    }
    // Если completions уже существует и имеет 21 элемент — оставляем как есть!

    // goal
    const maxGoal = getMaxGoal(normalized);
    normalized.goal = Math.max(0, Math.min(maxGoal, Number(normalized.goal) || 0));

    return normalized;
}

// ====================== ЗАПУСК ======================
document.addEventListener("DOMContentLoaded", init);
