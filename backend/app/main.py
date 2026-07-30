from fastapi import FastAPI

from app.routers.api import api_router

app = FastAPI(title="Deskly API")

app.include_router(api_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Deskly backend is running"}
