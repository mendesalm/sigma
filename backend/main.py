
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth_routes, obedience_routes, lodge_routes, member_routes

app = FastAPI(
    title="Sigma Backend",
    description="Backend for the Sigma project.",
    version="1.0.0"
)

# Configure CORS
# IMPORTANT: In production, you should restrict the origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(obedience_routes.router)
app.include_router(lodge_routes.router)
app.include_router(member_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Sigma Backend"}

# To run this application:
# uvicorn main:app --reload
