from database import Base, engine

# Create all tables
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")