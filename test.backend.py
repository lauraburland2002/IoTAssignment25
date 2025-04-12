import pytest
from fastapi.testclient import TestClient
from backend import app, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, SessionLocal, hash_password, User, Vote

# Database setup for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

# Dependency override for test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="function")
def setup_test_data():
    db = TestingSessionLocal()
    db.query(User).delete()
    db.query(Vote).delete()
    db.commit()
    user = User(email="test@example.com", password_hash=hash_password("password"))
    db.add(user)
    db.commit()
    db.close()

def test_vote_submission(setup_test_data):
    response = client.post("/vote", json={"temperature": 22.0})
    assert response.status_code == 403

def test_login(setup_test_data):
    response = client.post("/login", json={"email": "test@example.com", "password": "password"})
    assert response.status_code == 200
    assert response.json() == {"message": "Login successful"}

def test_get_average(setup_test_data):
    response = client.get("/average")
    assert response.status_code == 200
