import sqlite3
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, StringConstraints

app = FastAPI()

DB_PATH = Path(__file__).parent / "kanban.db"

db = sqlite3.connect(DB_PATH)
db.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done'))
    )
""")
db.close()


def get_db():
    db = sqlite3.connect(DB_PATH, check_same_thread=False)
    db.row_factory = sqlite3.Row
    try:
        yield db
    finally:
        db.close()

Status = Literal["todo", "in-progress", "done"]


class Task(BaseModel):
    id: str
    title: str
    description: str = ""
    status: Status = "todo"


Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Description = Annotated[str, StringConstraints(strip_whitespace=True)]


class TaskCreate(BaseModel):
    title: Title
    description: Description = ""


class TaskUpdate(BaseModel):
    title: Title | None = None
    description: Description | None = None
    status: Status | None = None


def find_task(db: sqlite3.Connection, task_id: str) -> Task:
    row = db.execute(
        "SELECT id, title, description, status FROM tasks WHERE id = ?", (task_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**row)


@app.get("/tasks")
def list_tasks(db: sqlite3.Connection = Depends(get_db)) -> list[Task]:
    rows = db.execute("SELECT id, title, description, status FROM tasks ORDER BY rowid").fetchall()
    return [Task(**row) for row in rows]


@app.post("/tasks", status_code=201)
def create_task(data: TaskCreate, db: sqlite3.Connection = Depends(get_db)) -> Task:
    task = Task(id=str(uuid4()), title=data.title, description=data.description)
    db.execute(
        "INSERT INTO tasks (id, title, description, status) VALUES (?, ?, ?, ?)",
        (task.id, task.title, task.description, task.status),
    )
    db.commit()
    return task


@app.patch("/tasks/{task_id}")
def update_task(task_id: str, data: TaskUpdate, db: sqlite3.Connection = Depends(get_db)) -> Task:
    task = find_task(db, task_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    db.execute(
        "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?",
        (task.title, task.description, task.status, task.id),
    )
    db.commit()
    return task


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: str, db: sqlite3.Connection = Depends(get_db)) -> None:
    cursor = db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    db.commit()


app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "frontend", html=True))
