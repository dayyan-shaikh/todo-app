from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from .models import ToDoModel, ToDoCreate, ToDoUpdate, UserCreate, UserLogin, Token, UserResponse
from .crud import (
    add_todo, get_todo, todo_helper, update_todo, delete_todo, get_done_todo, get_all_todos
)
from .auth import authenticate_user, create_user, create_access_token, get_current_user
from datetime import timedelta, datetime
from .config import ACCESS_TOKEN_EXPIRE_MINUTES
import traceback

router = APIRouter()

# Authentication routes
@router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    """
    Register a new user.
    """
    try:
        print(f"Registering user: {user.email}")
        
        # Create new user
        new_user = await create_user(
            email=user.email,
            username=user.username,
            password=user.password
        )
        
        print(f"User created successfully: {new_user.id}")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.email, "user_id": new_user.id}, expires_delta=access_token_expires
        )
        
        print("Token created successfully")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=new_user
        )
    
    except HTTPException as e:
        print(f"HTTP Exception in register: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error in register: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )

@router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """
    Login user and return JWT token.
    """
    try:
        # Authenticate user
        user = await authenticate_user(user_credentials.email, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": user["id"]}, expires_delta=access_token_expires
        )
        
        # Create user response
        user_response = UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            created_at=user["created_at"],
            is_active=user.get("is_active", True)
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error in login: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current user information.
    """
    return current_user

@router.post("/auth/logout")
async def logout():
    """
    Logout user (client should discard token).
    """
    return {"message": "Successfully logged out"}

# Todo routes (updated with authentication)
@router.get("/todos")
async def get_todos(current_user: UserResponse = Depends(get_current_user)):
    return await get_all_todos(current_user.id)

@router.post("/todos")
async def create(todo: ToDoCreate, current_user: UserResponse = Depends(get_current_user)):
    # Create a ToDoModel with user_id from the authenticated user
    todo_model = ToDoModel(
        title=todo.title,
        is_done=todo.is_done,
        user_id=current_user.id
    )
    return await add_todo(todo_model)

@router.get("/todo/done")
async def get_todo_by_done(current_user: UserResponse = Depends(get_current_user)):
    return await get_done_todo(current_user.id)

@router.get("/todo/{id}")
async def get_todo_by_id(id: str, current_user: UserResponse = Depends(get_current_user)):
    return await get_todo(id, current_user.id)

@router.put("/todos/{id}")
async def update(id: str, todo: ToDoUpdate, current_user: UserResponse = Depends(get_current_user)):
    # Create update data with only non-None fields
    update_data = {}
    if todo.title is not None:
        update_data["title"] = todo.title
    if todo.is_done is not None:
        update_data["is_done"] = todo.is_done
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    return await update_todo(id, update_data, current_user.id)

@router.delete("/todos/{id}")
async def delete(id: str, current_user: UserResponse = Depends(get_current_user)):
    success = await delete_todo(id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"msg": "Deleted"}

