function searchTitle (title) {
    for (let i = 0; i < task.length; i++) {
        if (task[i].title === title) {
            return(task[i].id)
        }
    }

}
function changesStatus (title) {
    for (let i = 0; i < task.length; i++) {
        if (task[i].title === title) {
            task[i].status = 'Завершена';
            return task[i]
        }
    }
}

const task = [];
task.push({id: 1, title: 'Купить молоко', status: 'Активна'});
task.push({id: 2, title: 'Купить кофе', status: 'Завершена'});
task.push({id: 3, title: 'Сделать кофе с молоком', status: 'Активна'});
for (let i = 0; i < task.length; i++) {
    console.log(task[i].title);
}

console.log(searchTitle('Сделать кофе с молоком'));
console.log(changesStatus('Сделать кофе с молоком'))

for (let i = 0; i < task.length; i++) {
    console.log(task[i].id);
    console.log(task[i].title);
}

for (tas of task) {
    console.log(tas);
}

let i = 0;
let score = 0;
while (i < task.length) {
    if (task[i].status === 'Активна') {
        score++;
    }
    if (task[i].status === 'Завершена') {
        score++;
    }
    i++;
}
console.log(score)

for (let i = 0; i < task.length; i++) {
    if (task[i].status === 'Активна') {
        console.log(task[i].title);
    }
}