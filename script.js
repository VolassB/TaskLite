let tasks = [];
const form = document.querySelector(".form");
const input = document.querySelector("#task");
const searchInput = document.querySelector("#findTask");
const taskElem = document.querySelector(".task__elem");
const filterButtons = document.querySelectorAll(".form__btn-filter");
const counterTotal = document.querySelector("p:nth-child(1)");
const counterActive = document.querySelector("p:nth-child(2)");
const counterDone = document.querySelector("p:nth-child(3)");
const clearDoneBtn = document.querySelector(".button--clear");

let currentFilter = "Все";  // по умолчанию
let isSortOldest = false;   // по умолчанию новые сверху

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = input.value.trim();

  if (title.length < 3) {
    input.classList.add("form__field-error");
    return;
  }

  input.classList.remove("form__field-error");

  const task = {
    id: Date.now(),
    title: title,
    date: new Date().toLocaleString("ru-RU"),
    done: false,
  };

  tasks.push(task);
  applyFilters();
  input.value = '';
});

// Применяем фильтры и рендерим
function applyFilters() {
  let filtered = tasks.slice();  // копия массива

  // Поиск
  const searchText = searchInput.value.trim().toLowerCase();
  if (searchText) {
    filtered = filtered.filter(task => task.title.toLowerCase().includes(searchText));
  }

  // Фильтр по статусу
  if (currentFilter === "Активные") {
    filtered = filtered.filter(task => !task.done);
  } else if (currentFilter === "Завершённые") {
    filtered = filtered.filter(task => task.done);
  }

  // Сортировка "Сначала старые"
  if (isSortOldest) {
    filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  } else {
    filtered.sort((a, b) => parseDate(b.date) - parseDate(a.date));  // новые сверху по умолчанию
  }

  renderTasks(filtered);
  updateCounters();
}

// Парсинг даты "DD.MM.YYYY, HH:MM:SS" в timestamp (теперь с секундами)
function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month, year] = datePart.split('.').map(Number);
  const timeParts = timePart.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1];
  const seconds = timeParts[2] || 0;
  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
}

// Главная функция рендера (принимает отфильтрованный массив)
function renderTasks(filteredTasks = tasks) {
  taskElem.innerHTML = '';

  filteredTasks.forEach(task => {
    const taskEl = createTaskElement(task);
    attachEventListeners(taskEl, task);
    taskElem.appendChild(taskEl);
  });
}

// Создание элемента задачи
function createTaskElement(task) {
  const taskEl = document.createElement("article");
  taskEl.classList.add("task");
  if (task.done) taskEl.classList.add('task--done');

  const content = document.createElement("div");
  content.classList.add("task__content");

  const title = document.createElement("h3");
  title.classList.add("task__title");
  title.textContent = escapeHtml(task.title);

  const meta = document.createElement("p");
  meta.classList.add("task__meta");
  meta.textContent = task.date;

  content.append(title, meta);

  const actions = document.createElement("div");
  actions.classList.add("task__actions");
  actions.innerHTML = `
    <svg class="task__icon" viewBox="0 0 24 24" fill="none" stroke="#6f64a3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
    <svg class="task__icon" viewBox="0 0 24 24" fill="none" stroke="#cb6e6e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;

  taskEl.append(content, actions);
  return taskEl;
}

// Добавление обработчиков
function attachEventListeners(taskEl, task) {
  const title = taskEl.querySelector('.task__title');
  const actions = taskEl.querySelector('.task__actions');
  const editIcon = actions.querySelectorAll('.task__icon')[0];
  const deleteIcon = actions.querySelectorAll('.task__icon')[1];

  taskEl.addEventListener('click', (e) => {
    if (!e.target.closest('.task__actions') && !e.target.closest('.task__edit-input')) {
      task.done = !task.done;
      applyFilters();
    }
  });

  title.addEventListener('click', (e) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.title;
    input.classList.add('task__edit-input');

    const content = taskEl.querySelector('.task__content');
    content.replaceChild(input, title);
    input.focus();
    input.select();

    input.addEventListener('blur', () => saveEdit(input, task));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
      if (e.key === 'Escape') {
        applyFilters();
      }
    });
  });

  editIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    title.click();
  });

  deleteIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('Удалить задачу?')) {
      const index = tasks.findIndex(t => t.id === task.id);
      tasks.splice(index, 1);
      applyFilters();
    }
  });
}

// Сохранение редактирования
function saveEdit(input, task) {
  const newTitle = input.value.trim();
  if (newTitle.length >= 3) {
    task.title = newTitle;
  } else if (newTitle.length > 0) {
    alert('Название должно быть минимум 3 символа');
  }
  applyFilters();
}

// Обновление счётчиков
function updateCounters() {
  const total = tasks.length;
  const active = tasks.filter(t => !t.done).length;
  const done = total - active;

  counterTotal.textContent = `Всего: ${total}`;
  counterActive.textContent = `Активных: ${active}`;
  counterDone.textContent = `Выполненных: ${done}`;
}

// Обработчики фильтров
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const text = button.textContent;
    if (text === "Сначала старые" || text === "Сначала новые") {
      isSortOldest = !isSortOldest;
      button.textContent = isSortOldest ? "Сначала новые" : "Сначала старые";  // toggle
    } else {
      currentFilter = text;
    }
    applyFilters();
  });
});

// Поиск в реальном времени
searchInput.addEventListener('input', applyFilters);

// Очистить выполненные
clearDoneBtn.addEventListener('click', () => {
  if (confirm('Вы действительно хотите удалить выполненные задания?')) {
    tasks = tasks.filter(t => !t.done);
    applyFilters();
  }
});

applyFilters();  // инициализация