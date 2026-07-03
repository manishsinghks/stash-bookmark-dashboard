import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OptionsApp } from "@/options/App";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
