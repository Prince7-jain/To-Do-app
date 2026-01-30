import os
import random
import string
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict
from typing_extensions import Annotated
from jose import JWTError, jwt
from bson import ObjectId
from dotenv import load_dotenv
import aiosmtplib
from email.message import EmailMessage
from passlib.context import CryptContext

# Load env vars
load_dotenv()

# --- Configuration ---
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017") 
DB_NAME = os.getenv("DB_NAME", "folio_db")
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_SUPER_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", 10))

# SMTP Config
GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
# Remove spaces from app password just in case user copied them from Google
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "").replace(" ", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

# --- App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database ---
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DB_NAME]

# --- Security & Hashing ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

# --- Startup Event (Seeding) ---
@app.on_event("startup")
async def seed_data():
    # Create a dummy user for testing/demo purposes
    dummy_email = "admin@folio.com"
    existing_user = await db.users.find_one({"email": dummy_email})
    
    if not existing_user:
        hashed = get_password_hash("admin")
        await db.users.insert_one({
            "email": dummy_email,
            "name": "Admin User",
            "hashed_password": hashed,
            "createdAt": datetime.utcnow()
        })
        print(f"--- SEEDED DUMMY USER: {dummy_email} / admin ---")

# --- Email Helper ---
async def send_email(email_to: str, subject: str, body: str):
    if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
        print("SMTP credentials not set. Skipping email.")
        print(f"Would send to {email_to}: {body}")
        return

    message = EmailMessage()
    message["From"] = GMAIL_EMAIL
    message["To"] = email_to
    message["Subject"] = subject
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            start_tls=True,
            username=GMAIL_EMAIL,
            password=GMAIL_APP_PASSWORD,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")

# --- Models ---
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(alias="_id", default=None, serialization_alias="id")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class OTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None  # For registration OTP (sent with register-request)
    password: Optional[str] = None

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str
    name: Optional[str] = None  # Required if registering new via OTP (magic code, no password)

class RegisterRequestOTP(BaseModel):
    email: EmailStr
    name: str
    password: str

class RegisterVerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordVerify(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str

class BoardBase(BaseModel):
    title: str
    description: Optional[str] = ""
    theme: Optional[str] = "plain"

class BoardCreate(BoardBase):
    pass

class BoardResponse(BoardBase):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(alias="_id", default=None, serialization_alias="id")
    userId: str
    createdAt: int

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    dueDate: Optional[int] = None
    rotation: Optional[float] = 0.0
    tags: Optional[List[str]] = None

class TaskCreate(TaskBase):
    boardId: str

class TaskResponse(TaskBase):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(alias="_id", default=None, serialization_alias="id")
    boardId: str
    createdAt: int

# --- Routes: Auth ---

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Check password if it exists (legacy OTP users might not have one)
    if not user.get("hashed_password") or not verify_password(form_data.password, user["hashed_password"]):
         raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}

# --- Registration with OTP verification (new users must verify email via OTP) ---
@app.post("/auth/register-request")
async def register_request(data: RegisterRequestOTP, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.pending_registrations.update_one(
        {"email": data.email},
        {"$set": {
            "email": data.email,
            "name": data.name,
            "hashed_password": get_password_hash(data.password),
            "otp": otp,
            "expires_at": expires_at,
        }},
        upsert=True,
    )
    subject = "Verify your Folio account"
    body = f"Hello,\n\nYour verification code for Folio is: {otp}\n\nIt expires in {OTP_EXPIRY_MINUTES} minutes.\n\nImperfectly yours,\nFolio."
    background_tasks.add_task(send_email, data.email, subject, body)
    return {"message": "Verification code sent"}

@app.post("/auth/register-verify", response_model=Token)
async def register_verify(data: RegisterVerifyOTP):
    record = await db.pending_registrations.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="No registration request found")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid code")
    if record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code expired")
    user_dict = {
        "email": record["email"],
        "name": record["name"],
        "hashed_password": record["hashed_password"],
        "createdAt": datetime.utcnow(),
    }
    res = await db.users.insert_one(user_dict)
    await db.pending_registrations.delete_one({"email": data.email})
    user = await db.users.find_one({"_id": res.inserted_id})
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}

@app.post("/auth/request-otp")
async def request_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.otps.update_one(
        {"email": request.email},
        {"$set": {"otp": otp, "expires_at": expires_at, "purpose": "login"}},
        upsert=True,
    )
    subject = "Your Folio Login Code"
    body = f"Hello,\n\nYour access code for Folio is: {otp}\n\nIt expires in {OTP_EXPIRY_MINUTES} minutes.\n\nImperfectly yours,\nFolio."
    background_tasks.add_task(send_email, request.email, subject, body)
    return {"message": "OTP sent"}

@app.post("/auth/verify-otp", response_model=Token)
async def verify_otp(data: OTPVerify):
    record = await db.otps.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found")
    if record.get("purpose") == "reset":
        raise HTTPException(status_code=400, detail="This code is for password reset. Use the reset password form.")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid code")
    if record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code expired")
    await db.otps.delete_one({"email": data.email})
    user = await db.users.find_one({"email": data.email})
    if not user:
        if not data.name:
            raise HTTPException(status_code=400, detail="Name required for new account")
        new_user_dict = {
            "email": data.email,
            "name": data.name,
            "createdAt": datetime.utcnow(),
        }
        res = await db.users.insert_one(new_user_dict)
        user = await db.users.find_one({"_id": res.inserted_id})
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}

# --- Reset password (verify email via OTP, then set new password) ---
@app.post("/auth/request-reset-password")
async def request_reset_password(request: ResetPasswordRequest, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=400, detail="No account found with this email")
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.otps.update_one(
        {"email": request.email},
        {"$set": {"otp": otp, "expires_at": expires_at, "purpose": "reset"}},
        upsert=True,
    )
    subject = "Reset your Folio password"
    body = f"Hello,\n\nYour password reset code is: {otp}\n\nIt expires in {OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, you can ignore this email.\n\nImperfectly yours,\nFolio."
    background_tasks.add_task(send_email, request.email, subject, body)
    return {"message": "Reset code sent"}

@app.post("/auth/reset-password")
async def reset_password(data: ResetPasswordVerify):
    record = await db.otps.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="No reset request found")
    if record.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid code")
    if record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code expired")
    await db.otps.delete_one({"email": data.email})
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"hashed_password": get_password_hash(data.newPassword)}},
    )
    return {"message": "Password updated. You can now sign in with your new password."}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# --- Routes: Boards ---

@app.get("/boards", response_model=List[BoardResponse])
async def get_boards(current_user: UserInDB = Depends(get_current_user)):
    boards = await db.boards.find({"userId": str(current_user.id)}).to_list(100)
    return boards

@app.post("/boards", response_model=BoardResponse)
async def create_board(board: BoardCreate, current_user: UserInDB = Depends(get_current_user)):
    board_dict = board.dict()
    board_dict["userId"] = str(current_user.id)
    board_dict["createdAt"] = int(datetime.utcnow().timestamp() * 1000)
    
    new_board = await db.boards.insert_one(board_dict)
    created_board = await db.boards.find_one({"_id": new_board.inserted_id})
    return created_board

@app.delete("/boards/{board_id}")
async def delete_board(board_id: str, current_user: UserInDB = Depends(get_current_user)):
    result = await db.boards.delete_one({"_id": ObjectId(board_id), "userId": str(current_user.id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Board not found")
    await db.tasks.delete_many({"boardId": board_id})
    return {"status": "success"}

# --- Routes: Tasks ---

@app.get("/boards/{board_id}/tasks", response_model=List[TaskResponse])
async def get_tasks(board_id: str, current_user: UserInDB = Depends(get_current_user)):
    board = await db.boards.find_one({"_id": ObjectId(board_id), "userId": str(current_user.id)})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
        
    tasks = await db.tasks.find({"boardId": board_id}).to_list(1000)
    return tasks

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: UserInDB = Depends(get_current_user)):
    board = await db.boards.find_one({"_id": ObjectId(task.boardId), "userId": str(current_user.id)})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    task_dict = task.dict()
    task_dict["createdAt"] = int(datetime.utcnow().timestamp() * 1000)
    
    new_task = await db.tasks.insert_one(task_dict)
    created_task = await db.tasks.find_one({"_id": new_task.inserted_id})
    return created_task

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task: TaskBase, current_user: UserInDB = Depends(get_current_user)):
    task_dict = task.dict(exclude_unset=True)
    result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": task_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return updated_task

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: UserInDB = Depends(get_current_user)):
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
