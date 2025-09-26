import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import DynamicSEO from "@/components/DynamicSEO";
// Network interceptor no longer needed - user_plans table now exists

// Hide the initial loading screen when React mounts
const AppWithLoadingHide = () => {
  React.useEffect(() => {
    // Add class to hide the loading screen
    document.body.classList.add('react-loaded');
  }, []);

  return (
    <DynamicSEO>
      <App />
    </DynamicSEO>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithLoadingHide />
  </React.StrictMode>
);
