from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from api import router as auth_router

app = FastAPI(title="Scribe Universal API")

# 🛡️ Shield of CORS: Allowing the Vercel Frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://scribe-azure.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth Manifestation ───
app.include_router(auth_router)

@app.get("/")
async def health_check():
    return {"status": "online", "guardian": "Scribe Sentinel", "version": "6.1"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
