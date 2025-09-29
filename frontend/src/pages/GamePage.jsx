import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGame } from '../games/index.js'

export default function GamePage(){
  const { id } = useParams()
  const game = getGame(id)
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


