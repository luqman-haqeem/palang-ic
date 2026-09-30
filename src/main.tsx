import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

/** Measuring before the bundled font resolves yields fallback metrics and a
 *  mis-sized band — a bug that hides behind a warm desktop cache and appears on
 *  a cold phone load. So mounting waits for the font. */
async function start() {
  try {
    await document.fonts.load('bold 16px "Roboto Condensed"');
    await document.fonts.ready;
  } catch {
    // Render anyway: a fallback font is better than a blank screen.
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
