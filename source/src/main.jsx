import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./base.css";
import "./extra.css";
import "./dark.css";
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(<MotionConfig reducedMotion="user"><App/></MotionConfig>);
