import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PosePage from './pages/PosePage'
import ClassifyPage from './pages/ClassifyPage'
import Pix2PixPage from './pages/Pix2PixPage'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Home</NavLink>
        <NavLink to="/pose" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Pose (keypoints)</NavLink>
        <NavLink to="/classify" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Classify (MobileNet)</NavLink>
        <NavLink to="/pix2pix" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Pix2Pix (draw → generate)</NavLink>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pose" element={<PosePage />} />
          <Route path="/classify" element={<ClassifyPage />} />
          <Route path="/pix2pix" element={<Pix2PixPage />} />
        </Routes>
      </main>
    </div>
  )
}
