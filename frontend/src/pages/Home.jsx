import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchModules } from '../api.js'

export default function Home(){
  const [mods, setMods] = useState([])
  const navigate = useNavigate()
  const listRef = useRef(null)

  useEffect(() => {
    fetchModules().then(d => setMods(d.modules || []))
  }, [])

  const progress = JSON.parse(localStorage.getItem('progress') || '{}')

  const goStart = () => navigate('/run')
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <section className="hero">
        <h1>Готові перевірити свою кібергігієну?</h1>
        <p className="hero-sub">Лекції + інтерактивні запитання. Пройдіть усі 5 модулів та отримайте підсумок.</p>
        <div className="hero-actions">
          <button className="start-btn" onClick={goStart}>🚀 Start test</button>
          <button className="ghost" onClick={scrollToList}>Переглянути модулі</button>
        </div>
      </section>

      <section ref={listRef} className="section-title">
        <h2 id="modules">Виберіть модуль</h2>
        <p className="muted">Або натисніть “Start test”, щоб пройти все по черзі.</p>
      </section>

      <div className="grid">
        {mods.map(m => {
          const p = progress[m.id] || {best: 0}
          const badge = p.best ? `🏅 ${p.best}/${m.quiz_count}` : '🧭 Новий'
          return (
            <Link key={m.id} to={`/module/${m.id}`} className="card">
              <h3>{m.title}</h3>
              <p className="summary">{m.summary}</p>
              <div className="meta">
                <span>Питань: {m.quiz_count}</span>
                <span>{badge}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
