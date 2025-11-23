import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(

  <AuthProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </AuthProvider>

);
