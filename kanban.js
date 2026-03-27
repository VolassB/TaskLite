const columns = document.querySelectorAll('.column');

// === Массив задач ===
let board = {
    toDo: [
        {
            id: "todo-1",
            title: "прочитать статью js 123",
            desc: "",
            priority: "high",
            date: "22.02"
        }
    ],
    inProgress: [
        {
            id: "progress-1",
            title: "Пример задачи в процессе",
            desc: "",
            priority: "medium",
            date: "23.02"
        }
    ],
    done: [
        {
            id: "done-1",
            title: "Завершенная задача 1",
            desc: "Описание завершенной задачи: выполнено чтение документации.",
            priority: "medium",
            date: "21.02.2026"
        },
        {
            id: "done-2",
            title: "Завершенная задача 2",
            desc: "Описание завершенной задачи: исправлена критическая ошибка.",
            priority: "high",
            date: "22.02.2026"
        }
    ]
};

// Загружаем сохранённое состояние
const saved = localStorage.getItem('kanbanBoard');
if (saved) {
    board = JSON.parse(saved);
}

const AUTO_DELETE_AFTER_DAYS = 21;  // например 21 день

function autoCleanDone() {
    if (!board.done || board.done.length === 0) return;

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    board.done = board.done.filter(task => {
        // Пытаемся распарсить дату. Если не получается — оставляем
        try {
            const [day, month, year] = task.date.split('.').map(Number);
            const taskDate = new Date(year, month - 1, day);
            const diffDays = (now - taskDate.getTime()) / msInDay;
            return diffDays <= AUTO_DELETE_AFTER_DAYS;
        } catch (err) {
            return true; // если дата кривая — не удаляем
        }
    });

    localStorage.setItem('kanbanBoard', JSON.stringify(board));
}

// Вызываем один раз при загрузке страницы
autoCleanDone();

// Обеспечиваем ID у всех задач (на случай старых данных)
Object.keys(board).forEach(key => {
    board[key].forEach((task, index) => {
        if (!task.id) {
            task.id = `${key}-task-${Date.now()}-${index}`;
        }
    });
});
localStorage.setItem('kanbanBoard', JSON.stringify(board));

// === Убирает символы в пользовательском вводе ===
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// === Значение приоритетности ===
function getPriorityValue(priority) {
    if (!priority || typeof priority !== 'string') return 'medium';

    const val = priority.trim().toLowerCase();

    // Синонимы для высокого приоритета
    const highSynonyms = ['high', 'высокий', 'высок', 'выс', 'h', '1'];
    // Синонимы для среднего
    const mediumSynonyms = ['medium', 'средний', 'сред', 'ср', 'm', '2'];
    // Синонимы для низкого
    const lowSynonyms = ['low', 'низкий', 'низ', 'н', 'l', '3'];

    if (highSynonyms.some(word => val.includes(word))) return 'high';
    if (mediumSynonyms.some(word => val.includes(word))) return 'medium';
    if (lowSynonyms.some(word => val.includes(word))) return 'low';

    return 'medium'; // дефолт, если ничего не распознано
}

// === Текст приоритетности ===
function getPriorityText(priority) {
    switch (priority) {
        case 'high': return 'Высокий приоритет';
        case 'medium': return 'Средний приоритет';
        case 'low': return 'Низкий приоритет';
        default: return '';
    }
}

// === Отрисовка карточки ===
function createTaskElement(task, columnKey) {
    const article = document.createElement('article');
    article.classList.add('task', 'kanban');
    article.draggable = true;

    const h3 = document.createElement('h3');
    h3.classList.add('task__title');
    h3.textContent = escapeHtml(task.title);
    article.appendChild(h3);

    if (task.desc && task.desc.trim() !== '') {
        const pDesc = document.createElement('p');
        pDesc.classList.add('task__desc');
        pDesc.textContent = escapeHtml(task.desc);
        article.appendChild(pDesc);
    }

    const divFooter = document.createElement('div');
    divFooter.classList.add('task__footer');

    const spanPriority = document.createElement('span');
    spanPriority.classList.add('priority', task.priority);
    spanPriority.textContent = getPriorityText(task.priority);

    const spanDate = document.createElement('span');
    spanDate.classList.add('task__date');
    spanDate.textContent = escapeHtml(task.date);

    divFooter.appendChild(spanPriority);
    divFooter.appendChild(spanDate);

    // ────────────── Кнопка удаления только в Done ──────────────
    if (columnKey === 'done') {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'task-delete-btn';
        deleteBtn.title = 'Удалить задачу навсегда';

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (!confirm('Удалить задачу навсегда?')) return;

            const taskElement = deleteBtn.closest('.task');
            taskElement.classList.add('removing');

            setTimeout(() => {
                // Удаляем из DOM
                taskElement.remove();

                // Удаляем из данных
                const idx = board.done.findIndex(t => t.id === task.id);
                if (idx !== -1) {
                    board.done.splice(idx, 1);
                    localStorage.setItem('kanbanBoard', JSON.stringify(board));

                    // Обновляем счётчик
                    const countSpan = document.querySelector('.done .task-count');
                    if (countSpan) countSpan.textContent = board.done.length;
                }
            }, 520); //500ms анимация
        };

        divFooter.appendChild(deleteBtn);
    };
    
    article.appendChild(divFooter);

    article.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
    });

    return article;
}

// === Колонки ===
function renderBoard() {
    const columnKeys = ['toDo', 'inProgress', 'done'];

    columns.forEach((column, index) => {
        const columnKey = columnKeys[index];
        const tasksList = column.querySelector('.tasks-list');
        tasksList.innerHTML = '';

        board[columnKey].forEach(task => {
            const taskEl = createTaskElement(task, columnKey);
            tasksList.appendChild(taskEl);
        });

        const countSpan = column.querySelector('.task-count');
        if (countSpan) countSpan.textContent = board[columnKey].length;
    });
}

// Кнопки добавления задач
const addButtons = document.querySelectorAll('.add-task');
addButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const title = prompt('Введите название задачи:');
        if (!title || title.trim().length < 3) {
            alert('Название должно быть минимум 3 символа');
            return;
        }

        const desc = prompt('Введите описание (опционально):') || '';
        const priorityInput = prompt('Введите приоритет (high / medium / low\nили высокий / средний / низкий):') || '';
        const priority = getPriorityValue(priorityInput);

        const date = new Date().toLocaleDateString('ru-RU');

        let columnKey;
        if (index === 0) columnKey = 'toDo';
        else if (index === 1) columnKey = 'inProgress';
        else columnKey = 'done';

        board[columnKey].push({
            id: Date.now().toString(),
            title: title.trim(),
            desc: desc.trim(),
            priority,
            date
        });

        renderBoard();
        localStorage.setItem('kanbanBoard', JSON.stringify(board));
    });
});

// === DRAG AND DROP ===
columns.forEach(column => {
    const tasksList = column.querySelector('.tasks-list');
    const status = ['toDo', 'inProgress', 'done'][Array.from(columns).indexOf(column)];
    column.dataset.status = status;

    tasksList.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('column--d-n-d');
    });

    tasksList.addEventListener('dragleave', () => {
        column.classList.remove('column--d-n-d');
    });

    tasksList.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('column--d-n-d');

        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;

        // Находим задачу
        let movedTask = null;
        let sourceKey = null;
        let originalIndex = -1;

        const columnKeys = ['toDo', 'inProgress', 'done'];
        for (let key of columnKeys) {
            const idx = board[key].findIndex(t => t.id === id);
            if (idx !== -1) {
                sourceKey = key;
                originalIndex = idx;
                movedTask = board[key][idx];
                break;
            }
        }

        if (!movedTask) return;

        const targetKey = column.dataset.status;
        if (targetKey === sourceKey) return; // не перемещаем в ту же колонку

        // Перемещаем
        board[sourceKey].splice(originalIndex, 1);
        board[targetKey].push(movedTask);

        localStorage.setItem('kanbanBoard', JSON.stringify(board));
        renderBoard();
    });
});

// === Рендер ===
renderBoard();
