import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import { Toaster } from "react-hot-toast";

import "./index.css";

import "./styles/global.css";

createRoot(

  document.getElementById("root")

).render(

  <StrictMode>

    <App />

    {/* Global Toast System */}
    <Toaster

      position="top-right"

      toastOptions={{

        style: {

          background: "#111827",

          color: "#ffffff",

          border:
            "1px solid rgba(255,255,255,0.06)",

          borderRadius: "14px",

          fontSize: "14px"

        }

      }}

    />

  </StrictMode>

);