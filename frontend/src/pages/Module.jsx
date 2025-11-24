import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameForModule } from '../games/index.js'
import { fetchModule, gradeQuiz, checkAnswer } from '../api.js'
import soundManager from '../utils/sounds.js'

export default function Module(){
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState('content') 
  const [qIndex, setQIndex] = useState(0)
  const [answerFeedback, setAnswerFeedback] = useState({}) 
  const [showVideo, setShowVideo] = useState(false)
  const [videoSrc, setVideoSrc] = useState(null) // video yay or boom 

  useEffect(()=>{
    setResult(null); setAnswers({}); setStep('content'); setQIndex(0); setAnswerFeedback({}); setShowVideo(false); setVideoSrc(null)
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
  const quizLen = (data.quiz?.length || 0)

  const pick = (qid, idx) => setAnswers(a => ({...a, [qid]: idx}))

  const next = async () => {
    const last = qIndex === (data.quiz?.length || 0) - 1
    
    // Check current answer and play sound before moving to next
    if (!last) {
      const currentQ = data.quiz[qIndex]
      const userAnswer = answers[currentQ.id]
      if (userAnswer !== undefined) {
        try {
          const result = await checkAnswer(id, currentQ.id, userAnswer)
          soundManager.play(result.correct ? 'right_answer' : 'wrong_answer')
          setAnswerFeedback(prev => ({ ...prev, [currentQ.id]: result.correct ? 'correct' : 'incorrect' }))
          setTimeout(() => {
            setQIndex(qIndex + 1)
          }, 800) 
          return
        } catch (err) {
          console.warn('Could not check answer:', err)
        }
      }
      setQIndex(qIndex + 1)
      return
    }
    
    // Last question - check it first, then grade all
    const currentQ = data.quiz[qIndex]
    const userAnswer = answers[currentQ.id]
    if (userAnswer !== undefined) {
      try {
        const result = await checkAnswer(id, currentQ.id, userAnswer)
        soundManager.play(result.correct ? 'right_answer' : 'wrong_answer')
        // Store feedback for animation
        setAnswerFeedback(prev => ({ ...prev, [currentQ.id]: result.correct ? 'correct' : 'incorrect' }))
      } catch (err) {
        console.warn('Could not check answer:', err)
      }
    }
    
    // Wait for animation, then show results
    setTimeout(async () => {
      setBusy(true)
      const res = await gradeQuiz(id, answers)
      setResult(res)
      setBusy(false)
      
      // Play win/lose sound based on score (passing is 50% or more)
      const passingScore = res.total / 2
      const passed = res.score >= passingScore
      
      // Set video based on pass/fail
      setVideoSrc(passed ? '/yay.MOV' : '/boom.MOV')
      setShowVideo(true)
      
      if (passed) {
        soundManager.play('win')
      } else {
        soundManager.play('lose')
      }
      
      const prog = JSON.parse(localStorage.getItem('progress') || '{}')
      const best = Math.max(res.score, (prog[id]?.best || 0))
      localStorage.setItem('progress', JSON.stringify({...prog, [id]: {best}}))
      setStep('done')
    }, 800)
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
            {quizLen > 0 ? (
              <button className="primary" onClick={startQuiz}>Почати запитання</button>
            ) : (
              (() => {
                const g = getGameForModule(data.id)
                if(!g) return null
                return (
                  <Link to={`/game/${g.id}`} className="primary" style={{display:'inline-block', textAlign:'center'}}>
                    Перейти до гри: {g.title}
                  </Link>
                )
              })()
            )}
          </div>
        </>
      )}

      {step==='quiz' && quizLen > 0 && (
        <section className="quiz">
          <h2>Питання {qIndex+1} / {quizLen}</h2>
          {(() => {
            const q = data.quiz[qIndex]
            const feedback = answerFeedback[q.id]
            return (
              <div className={`qcard ${feedback === 'correct' ? 'answer-correct' : feedback === 'incorrect' ? 'answer-incorrect' : ''}`}>
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
              {qIndex === quizLen-1 ? 'Завершити модуль' : 'Далі'}
            </button>
          </div>
        </section>
      )}

      {step==='done' && result && (
        <section className="results">
          {showVideo && videoSrc && (
            <div className="result-video-container">
              <video 
                className="result-video"
                src={videoSrc}
                autoPlay
                muted={false}
                playsInline
                onEnded={() => setShowVideo(false)}
                onError={(e) => {
                  console.warn('Video playback error:', e)
                  setShowVideo(false)
                }}
              />
            </div>
          )}
          <h3>Результат модуля: {result.score} / {result.total}</h3>
          {result.results.map(r => (
            <div key={r.questionId} className={`rline ${r.correct?'ok':'bad'}`}>
              <span>{r.correct ? '✅' : '❌'}</span>
              <span className="ex">{r.explanation}</span>
            </div>
          ))}
          <div className="actions">
            <button className="ghost" onClick={()=>{ setResult(null); setAnswers({}); setStep('quiz'); setQIndex(0); setShowVideo(false); setVideoSrc(null) }}>
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
