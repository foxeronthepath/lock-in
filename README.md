# Lock In - Focus Timer

A modern, well-architected focus timer and productivity tracker built with vanilla JavaScript and Firebase.

## ✨ Features

- **Timer Functionality**: Start/stop timer with automatic time tracking
- **User Authentication**: Secure login/signup with Firebase Auth
- **Data Persistence**: All data saved to Firebase Firestore
- **Reports & Analytics**: Visual charts and statistics
- **Offline Recovery**: Automatic recovery of unsaved time
- **Historical Data**: Auto-generated sample data for new users
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

This project follows a modular, well-organized architecture:

```
lock-in/
├── public/                 # Static files and entry points
│   ├── index.html         # Main application page
│   └── login.html         # Authentication page
├── src/                   # Source code
│   ├── config/           # Configuration files
│   │   └── firebase.js   # Firebase configuration
│   ├── css/              # Stylesheets
│   │   ├── base.css      # Base styles and CSS variables
│   │   ├── main.css      # Main stylesheet (imports all components)
│   │   └── components/   # CSS components
│   │       ├── buttons.css
│   │       ├── cards.css
│   │       ├── forms.css
│   │       └── reports.css
│   └── js/               # JavaScript modules
│       ├── app.js        # Main application entry point
│       ├── modules/      # Feature modules
│       │   ├── auth.js   # Authentication service
│       │   ├── timer.js  # Timer functionality
│       │   ├── dataService.js # Data persistence
│       │   └── reports.js # Reports and analytics
│       └── utils/        # Utility functions
│           ├── dateUtils.js
│           └── dataGenerator.js
├── assets/               # Static assets (icons, images)
├── package.json          # Project configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ (for development tools)
- A modern web browser
- Firebase project (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd lock-in
   ```

2. **Install development dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/config/firebase.js` with your Firebase configuration
   - Ensure Firestore and Authentication are enabled in your Firebase project

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - You'll be redirected to the login page

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Organization

#### **Modules** (`src/js/modules/`)

- **auth.js**: Handles user authentication, registration, and session management
- **timer.js**: Manages timer functionality, auto-save, and session tracking
- **dataService.js**: Handles all Firebase Firestore operations
- **reports.js**: Manages reports, charts, and analytics display

#### **Utilities** (`src/js/utils/`)

- **dateUtils.js**: Date formatting and manipulation functions
- **dataGenerator.js**: Generates historical data for new users

#### **CSS Components** (`src/css/components/`)

- Modular CSS components for buttons, forms, cards, and reports
- Uses CSS custom properties (variables) for consistent theming
- Responsive design with mobile-first approach

### Key Features

#### **Modular Architecture**
- Each feature is isolated in its own module
- Clear separation of concerns
- Easy to test and maintain

#### **Modern CSS**
- CSS custom properties for theming
- Component-based stylesheets
- Responsive design patterns

#### **Data Management**
- Automatic data persistence to Firebase
- Offline recovery mechanisms
- Historical data generation for new users

#### **User Experience**
- Loading states and error handling
- Automatic session recovery
- Clean, intuitive interface

## 🎯 Usage

### For Users

1. **Registration/Login**: Create an account or sign in
2. **Start Timer**: Click the Start button to begin tracking time
3. **View Reports**: Toggle reports to see your productivity statistics
4. **Data Persistence**: Your data is automatically saved and synced

### For Developers

#### Adding New Features

1. **Create a new module** in `src/js/modules/`
2. **Add corresponding CSS** in `src/css/components/`
3. **Import in main files** (`app.js` and `main.css`)
4. **Update HTML** if needed

#### Modifying Styles

1. **Edit CSS variables** in `src/css/base.css` for global changes
2. **Modify components** in `src/css/components/` for specific elements
3. **Use existing utility classes** when possible

## 🔒 Security

- Firebase Authentication handles user security
- All data is associated with authenticated users
- No sensitive data stored in localStorage
- HTTPS required for production deployment

## 📱 Browser Support

- Modern browsers with ES6+ support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔧 Troubleshooting

### Common Issues

1. **Firebase errors**: Check your Firebase configuration and project settings
2. **Module import errors**: Ensure you're serving files from a web server, not opening directly in browser
3. **CSS not loading**: Check file paths and ensure the development server is running

### Development Tips

- Use browser developer tools for debugging
- Check the console for error messages
- Use the Network tab to verify Firebase requests
- Test on different devices and browsers

## 🎨 Customization

### Theming

Modify CSS custom properties in `src/css/base.css`:

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... other variables */
}
```

### Adding New Data Fields

1. Update the data models in `dataService.js`
2. Add corresponding UI elements
3. Update the Firebase Firestore security rules if needed

---

Built with ❤️ using vanilla JavaScript and modern web technologies.