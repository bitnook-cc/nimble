import { FileExportErrors } from "./components/Modal";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { rememberDialogOpener, clearDialogOpener } from "./dialog-focus";
import "./styles.css";

document.addEventListener("pointerdown", rememberDialogOpener, true);
document.addEventListener("click", rememberDialogOpener, true);
document.addEventListener("keydown", clearDialogOpener, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <FileExportErrors />
  </StrictMode>,
);
