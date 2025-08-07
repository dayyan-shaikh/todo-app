import os
from dotenv import load_dotenv

# Load environment variables from config.env file
load_dotenv("config.env")

# Database
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Security
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS"))

# Server Configuration
HOST = os.getenv("HOST")
PORT = int(os.getenv("PORT"))
DEBUG = os.getenv("DEBUG").lower() == "true" 