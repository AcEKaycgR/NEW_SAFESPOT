from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from news_service import fetch_location_news
import uvicorn
import os
from dotenv import load_dotenv

app = FastAPI(title="News Sentiment API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    try:
        return {"status": "success", "data": "Welcome to News Sentiment API"}
    except Exception as e:
        return {"status": "error", "data": str(e)}

@app.get("/news")
def get_news(
    location: Optional[str] = Query(None, description="Location name (e.g., 'Goa')"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(2, description="How many past days of news to fetch"),
    count: int = Query(5, description="How many news items to return")
):
    try:
        news = fetch_location_news(location, lat, lon, days, count)
        return {"status": "success", "data": news}
    except Exception as e:
        return {"status": "error", "data": str(e)}

if __name__ == "__main__":
    load_dotenv()
    env_host = str(os.getenv("HOST"))
    env_port = int(os.getenv("PORT"))
    uvicorn.run(app, host=env_host, port=env_port)