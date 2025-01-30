import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [title, setTitle] = useState("Atishay Limited");

  useEffect(() => {
    document.title = title;
  }, [title]);

  const handleSubmit = () => {
    setTitle(inputValue);
    setInputValue("");
  };

  return (
    <div className="container">
      <div className="card">
        <h1>{title}</h1>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter text"
        />
        <button onClick={handleSubmit}>Change Text</button>
      </div>
    </div>
  );
}

export default App;
