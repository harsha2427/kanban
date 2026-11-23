from typing import Annotated, Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, StringConstraints

app = FastAPI()

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


tasks: list[Task] = []


def find_task(task_id: str) -> Task:
    for task in tasks:
        if task.id == task_id:
            return task
    raise HTTPException(status_code=404, detail="Task not found")


@app.get("/tasks")
def list_tasks() -> list[Task]:
    return tasks


@app.post("/tasks", status_code=201)
def create_task(data: TaskCreate) -> Task:
    task = Task(id=str(uuid4()), title=data.title, description=data.description)
    tasks.append(task)
    return task


@app.patch("/tasks/{task_id}")
def update_task(task_id: str, data: TaskUpdate) -> Task:
    task = find_task(task_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    return task


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: str) -> None:
    task = find_task(task_id)
    tasks.remove(task)
