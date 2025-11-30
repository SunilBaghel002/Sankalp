import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css"
import { AuthProvider } from "./context/AuthContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('✅ Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </AuthProvider>

);
