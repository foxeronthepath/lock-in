# Lock In - Focus Timer

Modern focus timer and productivity tracker with Firebase authentication.

## Features

- **Timer**: Start/stop tracking with automatic data persistence
- **Authentication**: Secure Firebase Auth login/signup
- **Reports**: Visual analytics and productivity statistics
- **Offline Recovery**: Automatic backup of unsaved session data
- **Responsive**: Works on desktop and mobile devices

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Update `src/config/env.js` with your Firebase credentials
   - Enable Authentication and Firestore in your Firebase project

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Navigate to `http://localhost:3000`

## Project Structure

```
public/             # Static HTML files
src/
├── config/         # Environment and Firebase configuration
├── css/            # Modular stylesheets
├── js/
│   ├── modules/    # Feature modules (auth, timer, data, reports)
│   └── utils/      # Utility functions
└── utils/          # Shared utilities (logger)
```

## Scripts

- `npm run dev` - Development server
- `npm run lint` - Code linting
- `npm run format` - Code formatting

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3
- **Backend**: Firebase (Auth + Firestore)
- **Development**: Live Server, ESLint, Prettier

## Browser Support

Modern browsers with ES6+ support (Chrome 60+, Firefox 60+, Safari 12+, Edge 79+)

## License

MIT