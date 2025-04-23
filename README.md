# Game Hub SPA

A Single Page Application (SPA) for a game hub built with vanilla JavaScript, Bootstrap 5, and HTML/CSS.

## Features

- Single Page Application architecture (no page reloads)
- Client-side routing using the History API
- Responsive design with Bootstrap 5
- Modern UI with Bootstrap Icons
- Views for Home, Games, Profile, and Login/Register

## Structure

- `index.html` - Main HTML file
- `src/assets/css/style.css` - Custom CSS styles
- `src/js/router.js` - SPA routing implementation
- `src/js/views/` - View components

## Running the Application

To run the application locally:

1. Clone this repository
2. Open `index.html` in your browser
3. For proper routing functionality, it's recommended to use a local server

You can use one of these methods to run a simple local server:

- Using Python:
  ```
  python -m http.server
  ```

- Using Node.js and http-server:
  ```
  npm install -g http-server
  http-server
  ```

## Browser Compatibility

This application uses modern JavaScript features and the History API, so it works best in modern browsers.

## License

MIT 