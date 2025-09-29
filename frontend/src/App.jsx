import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Module from './pages/Module.jsx'
import Run from './pages/Run.jsx'  // NEW
import GamePage from './pages/GamePage.jsx'

export default function App(){
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">Cyberkit<span></span>Space</Link>
        <nav>
          <a href="#" onClick={(e)=>e.preventDefault()}>🎓</a>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/module/:id" element={<Module/>}/>
          <Route path="/run" element={<Run/>}/> {/* NEW */}
          <Route path="/game/:id" element={<GamePage/>}/>
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} CyberkitSpace</footer>
    </div>
  )
}
