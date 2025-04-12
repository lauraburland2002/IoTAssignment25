import os
from sqlalchemy import inspect
from database import engine, Base

def test_database_creation():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "votes" in tables
    assert "users" in tables
    assert "feedback" in tables
