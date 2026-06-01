import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.TWEAK_DEFAULTS = {
  palette: ["#3F7A4F", "#E29A2B", "#E26D5A", "#6BA8C9"],
  font: "fredoka",
  difficulty: "medium",
  gamification: "light",
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
