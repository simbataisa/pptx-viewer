// src/App.tsx
import React from "react";
import "./App.css";
import PptxViewer from "./components/PptxViewer";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>PPTX Viewer</h1>
      <PptxViewer />
    </div>
  );
};

export default App;
