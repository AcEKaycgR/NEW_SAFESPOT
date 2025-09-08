import React, { useState } from "react";
import { fetchNews } from "./api/newsService";
import NewsList from "./components/NewsList";
import "./styles/App.css";

function App() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [inputType, setInputType] = useState("location");

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (inputType === "location" && location.trim()) {
      params.location = location.trim();
    } else if (inputType === "coordinates" && lat.trim() && lon.trim() && !isNaN(lat) && !isNaN(lon)) {
      params.lat = parseFloat(lat);
      params.lon = parseFloat(lon);
    } else {
      setError("Please provide valid input.");
      return;
    }
    setError(null);
    setNews([]);

    if (Object.keys(params).length > 0) {
      fetchNews(params)
        .then(setNews)
        .catch((err) => setError(err.message));
    }
  };

  return (
    <div className="travel-app-container">
      <header className="travel-header">
        <img
          src="https://cdn-icons-png.flaticon.com/512/201/201623.png"
          alt="Travel"
          className="travel-logo"
        />
        <h1>Travel Explorer News</h1>
        <p>
          Discover the latest travel news and updates for your next adventure!
        </p>
      </header>
      <form className="location-form" onSubmit={handleSubmit}>
        <div>
          <label>
            <input
              type="radio"
              value="location"
              checked={inputType === "location"}
              onChange={() => setInputType("location")}
            />
            Location
          </label>
          <label style={{ marginLeft: "1em" }}>
            <input
              type="radio"
              value="coordinates"
              checked={inputType === "coordinates"}
              onChange={() => setInputType("coordinates")}
            />
            Coordinates
          </label>
        </div>
        {inputType === "location" && (
          <input
            type="text"
            placeholder="Enter a destination (e.g., Goa, Paris)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="location-input"
          />
        )}
        {inputType === "coordinates" && (
          <>
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="location-input"
              style={{ marginLeft: "1em" }}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="location-input"
              style={{ marginLeft: "1em" }}
            />
          </>
        )}
        <button
          type="submit"
          className="search-btn"
          style={{ marginLeft: "1em" }}
        >
          Search
        </button>
      </form>
      {error && <div className="error-msg">Error fetching news: {error}</div>}
      <NewsList news={news} />
    </div>
  );
}

export default App;