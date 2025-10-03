// Registry of available games. Each game exports: id, title, Component

import PasswordAuditGame from './password/PasswordAuditGame.jsx'
import SecurityHuntGame from './security/SecurityHuntGame.jsx'

const games = [
  PasswordAuditGame,
  SecurityHuntGame,
]

export function listGames(){
  return games.map(g => ({ id: g.id, title: g.title }))
}

export function getGame(id){
  return games.find(g => g.id === id) || null
}

// Map specific learning module IDs to a related game ID
// Example: export const moduleToGame = { 'passwords': 'password' }
export const moduleToGame = { passwords: 'password-audit', final: 'security-hunt' }

export function getGameForModule(moduleId){
  const gid = moduleToGame[moduleId]
  return gid ? getGame(gid) : null
}

export default games


