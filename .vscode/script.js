let title = '';
console.log(title != false ? `Задача: ${title}` : 'Название задачи не указано');

let tasks = 3;
if (tasks > 3) {
    console.log('Много задач')
}
else if (tasks <= 3) {
    console.log('Немного задач')
}
else if (tasks == 0) {
    console.log('Список пуст')
}
else {
    console.log('Список не может быть отрицательным, за вами едет ФСБ')
}

let isComplited = true;

console.log(isComplited ? 'Задача выполнена' : 'Задача ещё в работе');

function sum(first, second) {
    return `${first} + ${second} = ${first + second}`;
}

console.log(sum(5, 5));

function max(first, second) {
    return first > second ? first : second;
}

console.log(max(5, 10));

function printTask(title, status) {
    return `${title}: ${status}`;
}

console.log(printTask('Задача', true));

function isTaskDone(status) {
    return status === 'выполнена';
}

console.log(isTaskDone('выполнена'));

const numbers = [0, 1, 2, 3, 4];

console.log(numbers[0], numbers[numbers.length - 1]);

const country = ['Челябинск', 'Питер', 'Москва', 'Самара'];
console.log(country);
country[3] = 'Тюмень';
console.log(country);

const task = {
    id: 0,
    title: 'Задача',
    status: 'Выполнена',
};

console.log(task.id);
console.log(task.title);
console.log(task.status);

let tasksM = [
    {id: 1, title: 'Задача 1', status: false},
    {id: 2, title: 'Задача 2', status: true}
];
console.log(tasksM[0].title)
console.log(tasksM[1].status);

tasksM[0].status = true;
console.log(tasksM[0].status);

let newTask = {
    id: 3,
    title: 'Задача 3',
    completed: false
}
tasksM.push(newTask);
console.log(tasksM[2])

// for (let i = 0; i < tasks.length; i++) {
//     console.log(tasks[i].title);
// }

// console.log(searchTitle('Сделать кофе с молоком'));
// console.log(changesStatus('Сделать кофе с молоком'))

// for (let i = 0; i < task.length; i++) {
//     console.log(tasks[i].id);
//     console.log(tasks[i].title);
// }

// for (tas of tasks) {
//     console.log(tas);
// }

// let i = 0;
// let score = 0;
// while (i < tasks.length) {
//     if (tasks[i].status === 'Активна') {
//         score++;
//     }
//     if (tasks[i].status === 'Завершена') {
//         score++;
//     }
//     i++;
// }
// console.log(score)

// for (let i = 0; i < task.length; i++) {
//     if (tasks[i].status === 'Активна') {
//         console.log(tasks[i].title);
//     }
// }