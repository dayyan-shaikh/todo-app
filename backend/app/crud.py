from .db import tasks_collection
from .models import ToDoModel
from bson import ObjectId

def todo_helper(todo) -> dict:
    return {
        "id": str(todo["id"]),
        "title": todo["title"],
        "is_done": todo["is_done"],
        "user_id": str(todo["user_id"]),
        "created_at": todo["created_at"],
        "updated_at": todo["updated_at"]
    }

async def add_todo(todo: ToDoModel):
    # Ensure user_id is set before inserting
    todo_dict = todo.dict()
    if not todo_dict.get("user_id"):
        raise ValueError("user_id is required")
    result = await tasks_collection.insert_one(todo_dict)
    # Return the inserted document with proper serialization
    inserted_todo = await tasks_collection.find_one({"_id": result.inserted_id})
    return todo_helper(inserted_todo)

async def get_todo(id: str, user_id: str = None):
    query = {"id": id}
    if user_id:
        query["user_id"] = user_id
    
    todo = await tasks_collection.find_one(query)
    if todo:
        return todo_helper(todo)
    return False

async def update_todo(id: str, data: dict, user_id: str = None):
    query = {"id": id}
    if user_id:
        query["user_id"] = user_id
    
    await tasks_collection.update_one(query, {"$set": data})
    updated = await tasks_collection.find_one(query)
    if updated:
        return todo_helper(updated)
    return False

async def delete_todo(id: str, user_id: str = None):
    query = {"id": id}
    if user_id:
        query["user_id"] = user_id
    
    result = await tasks_collection.delete_one(query)
    return result.deleted_count > 0

async def get_done_todo(user_id: str = None):
    query = {"is_done": True}
    if user_id:
        query["user_id"] = user_id
    
    todos = []
    async for todo in tasks_collection.find(query):
        todos.append(todo_helper(todo))
    return todos

async def get_all_todos(user_id: str = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    todos = []
    async for todo in tasks_collection.find(query):
        todos.append(todo_helper(todo))
    return todos
    