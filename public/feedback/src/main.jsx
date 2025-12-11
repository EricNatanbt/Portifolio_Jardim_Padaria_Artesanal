import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/styles.css";   

ReactDOM.createRoot(document.getElementById('react-feedback-root')).render( 
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

