import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import Sidepanel from "./Sidepanel"
import "./sidepanel.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sidepanel />
  </StrictMode>
)
