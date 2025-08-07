from motor.motor_asyncio import AsyncIOMotorClient
from .config import MONGO_URI, DATABASE_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

# Collections
tasks_collection = db["tasks"]
users_collection = db["users"]