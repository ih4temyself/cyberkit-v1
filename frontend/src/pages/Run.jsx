import React, { useEffect, useMemo, useState } from 'react'
import { fetchModules, fetchModule, gradeQuiz } from '../api.js'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { getGameForModule } from '../games/index.js'

export default function Run(){
  const [order, setOrder] = useState([])     
  const [index, setIndex] = useState(0)      
  const [mod, setMod] = useState(null)        
  const [phase, setPhase] = useState('loading')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [scores, setScores] = useState([])    
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    (async () => {
      const m = await fetchModules()
      const ids = (m.modules || []).map(x => x.id)
      setOrder(ids)
      if(ids.length){
        const startAt = Math.max(0, Math.min(ids.length - 1, (location.state?.startAtIndex ?? 0)))
        setIndex(startAt)
      }
    })()
  }, [])

  useEffect(()=>{
    if(!order.length) return
    setPhase('loading'); setAnswers({}); setQIndex(0)
    fetchModule(order[index]).then(d => { setMod(d); setPhase('content') })
  }, [order, index])

  const audio = useMemo(()=>({
    beep(ok=true){
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = ok ? 'sine' : 'square'
      o.frequency.value = ok ? 900 : 220
      o.connect(g); g.connect(ctx.destination)
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
      o.start()
      const t = ok ? 0.16 : 0.28
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.01)
    }
  }), [])

  const startQuiz = () => setPhase('quiz')
  const pick = (qid, idx) => setAnswers(a => ({...a, [qid]: idx}))

  const nextQ = async () => {
    const last = qIndex === (mod.quiz?.length || 0) - 1
    if (!last) { setQIndex(qIndex + 1); return }
    const res = await gradeQuiz(mod.id, answers)
    setScores(s => [...s, { id: mod.id, title: mod.title, score: res.score, total: res.total, details: res.results }])
    const prog = JSON.parse(localStorage.getItem('progress') || '{}')
    const best = Math.max(res.score, (prog[mod.id]?.best || 0))
    localStorage.setItem('progress', JSON.stringify({...prog, [mod.id]: {best}}))
    setPhase('result')
    audio.beep(res.score === res.total)
  }

  const nextModule = () => {
    const lastModule = index === order.length - 1
    if (lastModule) { setPhase('final'); return }
    setIndex(index + 1)
  }

  const totalScore = scores.reduce((a,c)=>a+c.score, 0)
  const totalMax = scores.reduce((a,c)=>a+c.total, 0)

  if(phase==='loading' || !mod) return <p className="muted">Завантаження…</p>

  return (
    <div className="module">
      <div className="runner-top">
        <Link to="/" className="back">← Вийти</Link>
        <div className="runner-progress">
          Модуль {index+1}/{order.length}
          <div className="meter small"><div className="bar" style={{width:`${((index)/order.length)*100}%`}}/></div>
        </div>
      </div>

      {phase==='content' && (
        <>
          <h1>{mod.title}</h1>
          <section className="lesson">
            {mod.content?.map((block, idx) => {
              if(block.type === 'p') return <p key={idx}>{block.text}</p>
              if(block.type === 'ul') return <ul key={idx}>{block.items.map((it,i)=><li key={i}>{it}</li>)}</ul>
              if(block.type === 'tip') return <div key={idx} className="tip">💡 {block.text}</div>
              return null
            })}
          </section>
          <div className="actions">
            <button className="primary" onClick={startQuiz}>Почати запитання</button>
          </div>
        </>
      )}

      {phase==='quiz' && (
        <section className="quiz">
          <h2>{mod.title}: питання {qIndex+1} / {mod.quiz.length}</h2>
          {(() => {
            const q = mod.quiz[qIndex]
            return (
              <div className="qcard">
                <div className="qtitle">{q.question}</div>
                <div className="opts">
                  {q.options.map((opt, idx) => {
                    const picked = answers[q.id] === idx
                    return (
                      <button key={idx}
                        className={`opt ${picked?'picked':''}`}
                        onClick={()=> pick(q.id, idx)}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          <div className="actions">
            <button onClick={()=> setQIndex(i=>Math.max(0,i-1))} disabled={qIndex===0}>Назад</button>
            <button className="primary"
              disabled={answers[mod.quiz[qIndex].id]===undefined}
              onClick={nextQ}
            >
              {qIndex===mod.quiz.length-1 ? 'Завершити модуль' : 'Далі'}
            </button>
          </div>
        </section>
      )}

      {phase==='result' && (
        <section className="results">
          <h2>Результат модуля: {scores[scores.length-1].score} / {scores[scores.length-1].total}</h2>
          {scores[scores.length-1].details.map(r => (
            <div key={r.questionId} className={`rline ${r.correct?'ok':'bad'}`}>
              <span>{r.correct ? '✅' : '❌'}</span>
              <span className="ex">{r.explanation}</span>
            </div>
          ))}
          <div className="actions">
            <button className="primary" onClick={nextModule}>
              {index === order.length-1 ? 'Показати підсумок тесту' : 'Наступний модуль'}
            </button>
            {(() => {
              const g = getGameForModule(mod.id)
              if(!g) return null
              return (
            <Link to={`/game/${g.id}`} state={{ index }} className="ghost" style={{display:'inline-block', textAlign:'center'}}>
                  Спробувати гру: {g.title}
                </Link>
              )
            })()}
          </div>
        </section>
      )}

      {phase==='final' && (
        <section className="results">
          <h1>Підсумок тесту</h1>
          <ul>
            {scores.map(s => (
              <li key={s.id} style={{margin:'6px 0'}}>
                <b>{s.title}</b>: {s.score}/{s.total}
              </li>
            ))}
          </ul>
          <h2>Загалом: {totalScore} / {totalMax}</h2>
          <div className="actions">
            <Link to="/" className="primary" style={{display:'inline-block', textAlign:'center'}}>На головну</Link>
            <button className="ghost" onClick={()=>{ setScores([]); setIndex(0); setPhase('loading') }}>Пройти ще раз</button>
          </div>
        </section>
      )}
    </div>
  )
}
