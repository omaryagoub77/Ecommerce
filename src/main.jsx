import React from 'react'; // ✅ Add this for older toolchains or to fix the error
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import performanceMonitor from './utils/performanceMonitor.js';

// Register service worker for caching and offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics in development
  setTimeout(() => {
    const metrics = performanceMonitor.getCoreWebVitals();
    console.log('Core Web Vitals:', metrics);
  }, 3000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
