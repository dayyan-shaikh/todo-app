from datetime import datetime, timedelta
from typing import Optional
try:
    import PyJWT as jwt
except ImportError:
    import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, BCRYPT_ROUNDS
from .models import TokenData, UserResponse
from .db import users_collection
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except AttributeError:
        # Fallback for different JWT library
        import PyJWT
        encoded_jwt = PyJWT.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Verify JWT token and return user data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_id=user_id)
    except Exception:
        raise credentials_exception
    
    return token_data

async def get_current_user(token_data: TokenData = Depends(verify_token)) -> UserResponse:
    """Get current user from token."""
    # Prefer user_id if available
    query = {"id": token_data.user_id} if token_data.user_id else {"email": token_data.email}
    user = await users_collection.find_one(query)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        created_at=user["created_at"],
        is_active=user.get("is_active", True)
    )

async def authenticate_user(email: str, password: str):
    """Authenticate a user with email and password."""
    user = await users_collection.find_one({"email": email})
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

async def get_user_by_email(email: str):
    """Get user by email."""
    return await users_collection.find_one({"email": email})

async def create_user(email: str, username: str, password: str):
    """Create a new user."""
    try:
        print(f"Starting user creation for email: {email}")
        
        # Check if user already exists
        existing_user = await get_user_by_email(email)
        if existing_user:
            print(f"User already exists: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(password)
        created_at = datetime.utcnow()
        
        print(f"Creating user data for ID: {user_id}")
        
        user_data = {
            "id": user_id,
            "email": email,
            "username": username,
            "hashed_password": hashed_password,
            "created_at": created_at,
            "is_active": True
        }
        
        print(f"Inserting user into database...")
        result = await users_collection.insert_one(user_data)
        print(f"User inserted with result: {result.inserted_id}")
        
        # Create UserResponse manually to avoid serialization issues
        user_response = UserResponse(
            id=user_id,
            email=email,
            username=username,
            created_at=created_at,
            is_active=True
        )
        
        print(f"User created successfully: {user_response.id}")
        return user_response
        
    except HTTPException as e:
        print(f"HTTP Exception in create_user: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error in create_user: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        ) 