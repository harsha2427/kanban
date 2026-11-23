const board = document.getElementById('board');
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descriptionInput = document.getElementById('task-description');
const submitButton = form.querySelector('button');

let tasks = JSON.parse(localStorage.getItem('kanban-tasks')) || [];
let editingId = null;

function render() {
  localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  board.querySelectorAll('.task-list').forEach(list => list.replaceChildren());

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = task.id;
    card.draggable = true;

    const title = document.createElement('h3');
    title.textContent = task.title;

    const description = document.createElement('p');
    description.textContent = task.description;

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.dataset.action = 'edit';

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.action = 'delete';

    const statusSelect = document.createElement('select');
    board.querySelectorAll('.column').forEach(column => {
      statusSelect.append(new Option(column.querySelector('h2').textContent, column.dataset.status));
    });
    statusSelect.value = task.status;

    card.append(title, description, statusSelect, editButton, deleteButton);

    board.querySelector(`[data-status="${task.status}"] .task-list`).append(card);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return;
  const description = descriptionInput.value.trim();

  if (editingId) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.title = title;
      task.description = description;
    }
    editingId = null;
    submitButton.textContent = 'Add Task';
  } else {
    tasks.push({ id: crypto.randomUUID(), title, description, status: 'todo' });
  }

  form.reset();
  render();
});

board.addEventListener('click', event => {
  const action = event.target.dataset.action;
  if (!action) return;

  const id = event.target.closest('.card').dataset.id;

  if (action === 'delete' && confirm('Delete this task?')) {
    tasks = tasks.filter(task => task.id !== id);
    render();
  }

  if (action === 'edit') {
    const task = tasks.find(t => t.id === id);
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    editingId = id;
    submitButton.textContent = 'Save';
    titleInput.focus();
  }
});

board.addEventListener('change', event => {
  const id = event.target.closest('.card').dataset.id;
  const task = tasks.find(t => t.id === id);
  task.status = event.target.value;
  render();
});

board.addEventListener('dragstart', event => {
  event.dataTransfer.setData('text/plain', event.target.dataset.id);
  event.target.classList.add('dragging');
});

board.addEventListener('dragover', event => {
  event.preventDefault();
});

board.addEventListener('drop', event => {
  event.preventDefault();
  const column = event.target.closest('.column');
  if (!column) return;

  const id = event.dataTransfer.getData('text/plain');
  const task = tasks.find(t => t.id === id);
  task.status = column.dataset.status;
  render();
});

board.addEventListener('dragend', event => {
  event.target.classList.remove('dragging');
});

render();
