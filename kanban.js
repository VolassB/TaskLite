const columns = document.querySelectorAll('.column');

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

// Обеспечиваем ID у всех задач (на случай старых данных)
Object.keys(board).forEach(key => {
    board[key].forEach((task, index) => {
        if (!task.id) {
            task.id = `${key}-task-${Date.now()}-${index}`;
        }
    });
});
localStorage.setItem('kanbanBoard', JSON.stringify(board));

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getPriorityText(priority) {
    switch (priority) {
        case 'high': return 'Высокий приоритет';
        case 'medium': return 'Средний приоритет';
        case 'low': return 'Низкий приоритет';
        default: return '';
    }
}

function createTaskElement(task) {
    const article = document.createElement('article');
    article.classList.add('task', 'kanban');
    article.draggable = true;

    // === Заголовок первым (то, что ты хочешь сверху) ===
    const h3 = document.createElement('h3');
    h3.classList.add('task__title');
    h3.textContent = escapeHtml(task.title);
    article.appendChild(h3);

    // === Описание только если оно есть ===
    if (task.desc && task.desc.trim() !== '') {
        const pDesc = document.createElement('p');
        pDesc.classList.add('task__desc');
        pDesc.textContent = escapeHtml(task.desc);
        article.appendChild(pDesc);
    }

    // === Футер в самом низу ===
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
    article.appendChild(divFooter);

    // Drag-and-drop остаётся без изменений
    article.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
    });

    return article;
}

function renderBoard() {
    const columnKeys = ['toDo', 'inProgress', 'done'];

    columns.forEach((column, index) => {
        const columnKey = columnKeys[index];
        const tasksList = column.querySelector('.tasks-list');
        tasksList.innerHTML = '';

        board[columnKey].forEach(task => {
            const taskEl = createTaskElement(task);
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
        let priority = prompt('Введите приоритет (high, medium, low):') || 'medium';
        if (!['high', 'medium', 'low'].includes(priority)) priority = 'medium';

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

renderBoard();

// let dragArticle = null;
// let srcStatus = null;

// function addDragEvents() {
//     article.draggable = 'true';
//     article.addEventListener('dragstart', function (e) {
//         dragArticle = article;
//         srcStatus = article.closeat('.column').dataset.status;
//         console.log(article.closeat('.column'));
//         console.log('srcStatus', srcStatus);
//         e.dateTransfer.effectAllowed = 'move';
//     });

//     article.addEventListener('dragend', function (e) {
//         console.log('dragend');
//         dragArticle = null;
//     });
// };

// columns.forEach(function (column) {
//     tasksList.addEventListener('dragover', function (e) {
//         e.preventDefault();
//         column.classList.add('column--d-n-d');
//     });

//     tasksList.addEventListener('dragleave', function (e) {
//         e.preventDefault();
//         column.classList.remove('column--d-n-d');
//     });

//     tasksList.addEventListener('drop', function (e) {
//         e.preventDefault();
//         column.classList.remove('column--d-n-d');
//         if(!dragArticle) return;

//         board(srcStatus).splice(index, 1);
//         console.log(board);
//     });
// });
