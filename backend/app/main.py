from fastapi import FastAPI

app = FastAPI(title="Deskly API")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Deskly backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
