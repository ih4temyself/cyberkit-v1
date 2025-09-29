import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameForModule } from '../games/index.js'
import { fetchModule, gradeQuiz } from '../api.js'

export default function Module(){
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState('content') 
  const [qIndex, setQIndex] = useState(0)

  useEffect(()=>{
    setResult(null); setAnswers({}); setStep('content'); setQIndex(0)
    fetchModule(id).then(setData)
  }, [id])

  const audio = useMemo(()=>({
    beep(ok=true){
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = ok ? 'sine' : 'square'
      o.frequency.value = ok ? 820 : 200
      o.connect(g); g.connect(ctx.destination)
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
      o.start()
      const t = ok ? 0.18 : 0.28
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.01)
    }
  }), [])

  if(!data) return <p className="muted">Завантаження…</p>

  const startQuiz = () => setStep('quiz')

  const pick = (qid, idx) => setAnswers(a => ({...a, [qid]: idx}))

  const next = async () => {
    const last = qIndex === (data.quiz?.length || 0) - 1
    if (!last) { setQIndex(qIndex + 1); return }
    setBusy(true)
    const res = await gradeQuiz(id, answers)
    setResult(res)
    setBusy(false)
    setStep('done')
    const prog = JSON.parse(localStorage.getItem('progress') || '{}')
    const best = Math.max(res.score, (prog[id]?.best || 0))
    localStorage.setItem('progress', JSON.stringify({...prog, [id]: {best}}))
    audio.beep(res.score === res.total)
  }

  const prev = () => { if(qIndex>0) setQIndex(qIndex-1) }

  return (
    <div className="module">
      <Link to="/" className="back">← До списку</Link>
      <h1>{data.title}</h1>

      {step==='content' && (
        <>
          <section className="lesson">
            {data.content?.map((block, idx) => {
              if(block.type === 'p') return <p key={idx}>{block.text}</p>
              if(block.type === 'ul') return (
                <ul key={idx}>{block.items.map((it,i)=><li key={i}>{it}</li>)}</ul>
              )
              if(block.type === 'tip') return <div key={idx} className="tip">💡 {block.text}</div>
              return null
            })}
          </section>
          <div className="actions">
            <button className="primary" onClick={startQuiz}>Почати запитання</button>
          </div>
        </>
      )}

      {step==='quiz' && (
        <section className="quiz">
          <h2>Питання {qIndex+1} / {data.quiz.length}</h2>
          {(() => {
            const q = data.quiz[qIndex]
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
            <button onClick={prev} disabled={qIndex===0}>Назад</button>
            <button className="primary" disabled={answers[data.quiz[qIndex].id]===undefined || busy} onClick={next}>
              {qIndex === data.quiz.length-1 ? 'Завершити модуль' : 'Далі'}
            </button>
          </div>
        </section>
      )}

      {step==='done' && result && (
        <section className="results">
          <h3>Результат модуля: {result.score} / {result.total}</h3>
          {result.results.map(r => (
            <div key={r.questionId} className={`rline ${r.correct?'ok':'bad'}`}>
              <span>{r.correct ? '✅' : '❌'}</span>
              <span className="ex">{r.explanation}</span>
            </div>
          ))}
          <div className="actions">
            <button className="ghost" onClick={()=>{ setResult(null); setAnswers({}); setStep('quiz'); setQIndex(0) }}>
              Спробувати ще раз
            </button>
            <Link to="/" className="primary" style={{display:'inline-block', textAlign:'center'}}>На головну</Link>
            {(() => {
              const g = getGameForModule(data.id)
              if(!g) return null
              return (
                <Link to={`/game/${g.id}`} className="ghost" style={{display:'inline-block', textAlign:'center'}}>
                  Спробувати гру: {g.title}
                </Link>
              )
            })()}
          </div>
        </section>
      )}
    </div>
  )
}
