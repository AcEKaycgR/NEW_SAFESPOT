# React News App

This project is a React application that communicates with a FastAPI backend to fetch and display news articles based on user-defined locations.

## Project Structure

```
react-news-app
├── public
│   └── index.html          # Main HTML file for the React application
├── src
│   ├── api
│   │   └── newsService.js  # Functions to communicate with the FastAPI backend
│   ├── components
│   │   ├── NewsList.jsx    # Component to display a list of news items
│   │   └── NewsItem.jsx     # Component to display a single news item
│   ├── App.jsx              # Main application component
│   ├── index.js             # Entry point for the React application
│   └── styles
│       └── App.css         # CSS styles for the application
├── package.json             # Configuration file for npm
└── README.md                # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd react-news-app
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm start
   ```

4. **Access the application:**
   Open your browser and go to `http://localhost:3000`.

## Usage

- The application allows users to fetch news articles based on location.
- Users can specify a location, latitude, longitude, number of days of news to fetch, and the number of news items to display.

## API Integration

The application communicates with the FastAPI backend defined in `api.py`. The backend provides an endpoint `/news` to fetch news articles based on the specified parameters.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.