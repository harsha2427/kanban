# Kanban Board

A full-stack kanban board for managing tasks across three columns: **To Do**, **In Progress** and **Done**.

- **Frontend:** vanilla HTML, CSS and JavaScript (no frameworks, no build step)
- **Backend:** Python with FastAPI
- **Database:** SQLite (a single file, no database server needed)

## Features

- Create, edit and delete tasks (title plus optional description)
- Move tasks between columns with drag-and-drop or the status dropdown on each card
- Task count in each column heading
- Tasks are saved in SQLite and survive server restarts
- Clear error message if the server can't be reached
- Responsive layout: columns stack on narrow screens

## Project structure

```
kanban/
├── README.md
├── .gitignore
├── backend/
│   ├── main.py            # FastAPI app: database setup, models, API endpoints, serves the frontend
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── index.html         # page structure
    ├── style.css          # layout and styling
    └── app.js             # rendering, user actions, API calls
```

`backend/kanban.db` (the database) and `backend/.venv` (the virtual environment) are created locally and are not committed.

## Requirements

- Python 3.10 or newer
- Git

## Installation

```bash
git clone <repository-url>
cd kanban/backend

python -m venv .venv
source .venv/Scripts/activate    # Windows (Git Bash)
# source .venv/bin/activate      # macOS / Linux

pip install -r requirements.txt
```

## Running the app

From `kanban/backend`, with the virtual environment activated:

```bash
uvicorn main:app --reload
```

Then open:

- **App:** http://127.0.0.1:8000
- **Interactive API docs:** http://127.0.0.1:8000/docs

Stop the server with `Ctrl+C`. The database file `backend/kanban.db` is created automatically on first start.

## API

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/tasks` | – | 200, list of tasks | – |
| POST | `/tasks` | `{"title", "description"?}` | 201, the new task | 422 |
| PATCH | `/tasks/{task_id}` | any of `{"title", "description", "status"}` | 200, the updated task | 404, 422 |
| DELETE | `/tasks/{task_id}` | – | 204 | 404 |

A task looks like:

```json
{ "id": "3f2a9c1e-...", "title": "Buy milk", "description": "2 litres", "status": "todo" }
```

`status` is one of `todo`, `in-progress` or `done`.

## Resetting the data

Stop the server, delete `backend/kanban.db`, and start the server again. An empty database is created.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `ModuleNotFoundError: No module named 'fastapi'` | Activate the virtual environment first. |
| `Could not import module "main"` | Run `uvicorn` from inside `backend/`. |
| Changes to the frontend don't show | Hard refresh with `Ctrl+Shift+R`, or tick **Disable cache** in DevTools. |
| "Cannot reach the server" on the page | Start the server with `uvicorn main:app --reload`. |
