import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ParcelRegistration } from "./screens/ParcelRegistration";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ParcelRegistration />
  </StrictMode>,
);
