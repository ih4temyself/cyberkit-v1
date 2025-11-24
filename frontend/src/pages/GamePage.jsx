import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGame } from '../games/index.js'
import soundManager from '../utils/sounds.js'

export default function GamePage(){
  const { id } = useParams()
  const game = getGame(id)
  
  useEffect(() => {
    soundManager.playMusic()
    return () => {
      soundManager.stopMusic()
    }
  }, [id])
  
  if(!game) return (
    <div className="module">
      <Link to="/" className="back">← На головну</Link>
      <h1>Game not found</h1>
      <p className="muted">No game registered with id: {id}</p>
    </div>
  )
  const C = game
  return (
    <div className="module">
      <Link to="/" className="back">← На головну</Link>
      <C/>
    </div>
  )
}


