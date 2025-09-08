import feedparser
import urllib.parse
from datetime import datetime, timedelta, timezone
from geopy.geocoders import Nominatim
from transformers import pipeline

# ---------- Rule Overrides ----------
NEGATIVE_OVERRIDES = {
    "accident", "dies", "died", "dead", "killed", "fatal", "injured", "injury",
    "havoc", "red alert", "heavy rain", "flood", "landslide", "collapse",
    "stampede", "evacuate", "evacuation", "missing", "trapped", "crash",
    "pileup", "blocked", "closure", "disruption", "blast", "fire", "stranded"
}
POSITIVE_OVERRIDES = {
    "open", "opens", "launch", "launched", "inaugur", "restored",
    "reopens", "announces", "to open", "celebrates", "celebration"
}
CONFIDENCE_THRESHOLD = 0.60

# ---------- Sentiment Model ----------
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

def analyze_sentiment(text: str):
    """Analyze sentiment using rule overrides + transformer model."""
    if not text:
        return {"sentiment": "neutral", "score": 0.0, "model": "empty"}

    lower = text.lower()
    if any(word in lower for word in NEGATIVE_OVERRIDES):
        return {"sentiment": "negative", "score": 1.0, "model": "rule"}
    if any(word in lower for word in POSITIVE_OVERRIDES):
        return {"sentiment": "positive", "score": 1.0, "model": "rule"}

    try:
        result = sentiment_pipeline(text[:512])[0]
        label = result["label"]
        score = float(result["score"])
        if score < CONFIDENCE_THRESHOLD:
            return {"sentiment": "neutral", "score": score, "model": "transformer"}
        return {
            "sentiment": "negative" if "NEG" in label.upper() else "positive",
            "score": score,
            "model": "transformer",
        }
    except Exception:
        return {"sentiment": "neutral", "score": 0.0, "model": "fallback"}


# ---------- Location Helpers ----------
def get_location_from_coords(lat: float, lon: float) -> str:
    geolocator = Nominatim(user_agent="news_fetcher")
    try:
        location = geolocator.reverse((lat, lon), language="en")
        if location and "city" in location.raw["address"]:
            return location.raw["address"]["city"]
        elif location and "state" in location.raw["address"]:
            return location.raw["address"]["state"]
        elif location and "county" in location.raw["address"]:
            return location.raw["address"]["county"]
        return location.address if location else "India"
    except Exception:
        return "India"


# ---------- News Fetcher ----------
def fetch_location_news(location=None, lat=None, lon=None, days=2, count=5):
    """Fetch news for a given location name or coordinates."""
    if not location and lat is not None and lon is not None:
        location = get_location_from_coords(lat, lon)

    if not location:
        raise ValueError("Either location name or coordinates must be provided.")

    query = f"{location} (road OR traffic OR weather OR rain OR storm OR heatwave OR cyclone OR flood OR tourist OR tourism OR temple OR beach OR monument OR travel)"
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-IN&gl=IN&ceid=IN:en"

    feed = feedparser.parse(url)
    if not feed.entries:
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = []

    for entry in feed.entries:
        published = None
        if "published_parsed" in entry and entry.published_parsed:
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            if published < cutoff:
                continue

        title = entry.get("title", "").strip()
        link = entry.get("link", "")

        sent = analyze_sentiment(title)

        results.append({
            "headline": title,
            "link": link,
            "published": published.isoformat() if published else None,
            "sentiment": sent["sentiment"],
            "score": round(sent["score"], 3),
            "model": sent["model"],
        })

        if len(results) >= count:
            break

    return results
