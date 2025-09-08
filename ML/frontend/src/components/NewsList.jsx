import React from "react";
import NewsItem from "./NewsItem";

const NewsList = ({ news }) => {
  if (!Array.isArray(news)) {
    return <div>No news available.</div>;
  }

  return (
    <div className="news-grid">
      {news.map((item) => (
        <NewsItem key={item.link} news={item} />
      ))}
    </div>
  );
};

export default NewsList;