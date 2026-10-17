import { FileExportErrors } from "./components/Modal";
import { StrictMode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import App from "./App";
import { rememberDialogOpener, clearDialogOpener } from "./dialog-focus";
import "./styles.css";

document.addEventListener("pointerdown", rememberDialogOpener, true);
document.addEventListener("click", rememberDialogOpener, true);
document.addEventListener("keydown", clearDialogOpener, true);

const analyticsEnabled =
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <FileExportErrors />
    {analyticsEnabled && <Analytics />}
  </StrictMode>,
);
