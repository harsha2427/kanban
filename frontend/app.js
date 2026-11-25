const board = document.getElementById('board');
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descriptionInput = document.getElementById('task-description');
const submitButton = form.querySelector('button');
const cancelButton = document.getElementById('cancel-edit');
const errorMessage = document.getElementById('error');

let tasks = [];
let editingId = null;

function render() {
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
    description.hidden = !task.description;

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

  board.querySelectorAll('.column').forEach(column => {
    column.querySelector('h2').dataset.count = tasks.filter(t => t.status === column.dataset.status).length;
  });
}

function resetForm() {
  editingId = null;
  submitButton.textContent = 'Add Task';
  cancelButton.hidden = true;
  form.reset();
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return;
  const description = descriptionInput.value.trim();

  if (editingId) {
    api('PATCH', `/tasks/${editingId}`, { title, description });
  } else {
    api('POST', '/tasks', { title, description });
  }

  resetForm();
});

cancelButton.addEventListener('click', resetForm);

board.addEventListener('click', event => {
  const action = event.target.dataset.action;
  if (!action) return;

  const id = event.target.closest('.card').dataset.id;

  if (action === 'delete' && confirm('Delete this task?')) {
    api('DELETE', `/tasks/${id}`);
  }

  if (action === 'edit') {
    const task = tasks.find(t => t.id === id);
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    editingId = id;
    submitButton.textContent = 'Save';
    cancelButton.hidden = false;
    titleInput.focus();
  }
});

board.addEventListener('change', event => {
  const id = event.target.closest('.card').dataset.id;
  api('PATCH', `/tasks/${id}`, { status: event.target.value });
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
  api('PATCH', `/tasks/${id}`, { status: column.dataset.status });
});

board.addEventListener('dragend', event => {
  event.target.classList.remove('dragging');
});

async function api(method, path, body) {
  showError('');
  try {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) showError(`Could not save the change (error ${response.status}).`);
  } catch {
    showError('Cannot reach the server. Is it running?');
  }
  loadTasks();
}

async function loadTasks() {
  try {
    const response = await fetch('/tasks');
    tasks = await response.json();
    render();
  } catch {
    showError('Cannot reach the server. Is it running?');
  }
}

loadTasks();
