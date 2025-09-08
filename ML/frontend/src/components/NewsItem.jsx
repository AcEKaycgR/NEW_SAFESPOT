import React from "react";

const NewsItem = ({ news }) => (
  <div className="news-card">
    <h2 className="news-title">{news.headline}</h2>
    <div className="news-meta">
      <span role="img" aria-label="calendar">📅</span> {new Date(news.published).toLocaleString()}
      <span className={`sentiment ${news.sentiment}`}>{news.sentiment}</span>
    </div>
    <a href={news.link} target="_blank" rel="noopener noreferrer" className="read-more-btn">
      🌍 Read more
    </a>
  </div>
);

export default NewsItem;