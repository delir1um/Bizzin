import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import DynamicSEO from "@/components/DynamicSEO";
// Network interceptor no longer needed - user_plans table now exists

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DynamicSEO>
      <App />
    </DynamicSEO>
  </React.StrictMode>
);
