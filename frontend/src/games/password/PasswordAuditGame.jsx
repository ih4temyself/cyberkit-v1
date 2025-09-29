import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { checkPassword } from '../../api.js'

export default function PasswordAuditGame(){
  const [pw, setPw] = useState('')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(true)

  useEffect(()=>{ setError('') }, [pw])

  const run = async () => {
    setBusy(true); setError('')
    try{
      const res = await checkPassword(pw)
      setData(res)
    }catch(e){
      setError(String(e?.message || e))
    }finally{
      setBusy(false)
    }
  }

  useEffect(()=>{
    if(auto){
      const t = setTimeout(()=>{ if(pw) run() }, 350)
      return ()=> clearTimeout(t)
    }
  }, [pw, auto])

  const score = data?.score ?? 0
  const passed = score >= 3 && !data?.breached
  const scoreLabel = useMemo(()=>{
    const labels = ['Very weak','Weak','Fair','Good','Strong']
    return labels[Math.max(0, Math.min(4, score))]
  }, [score])

  const navigate = useNavigate()
  const location = useLocation()
  const fromIndex = Math.max(0, Number(location.state?.index ?? 0))

  return (
    <div className="game-overlay">
      <div className="game-stage">
        <div className="game-card slide-in">
          <div className="actions" style={{justifyContent:'space-between'}}>
            <Link to="/" className="back">← На головну</Link>
            <button onClick={()=> navigate('/run', { state: { startAtIndex: fromIndex + 1 } })}>Наступний модуль</button>
          </div>
          <h1 className="glow">Audit your password</h1>
          <p className="muted">Strength via zxcvbn and breach status via Pwned Passwords (k-anonymity).</p>
          <div className="demo fade-in">
            <input type="text" className="pwinput" value={pw} onChange={e=> setPw(e.target.value)} placeholder="Enter password"/>
            <div className="actions space-between">
              <label className="toggle"><input type="checkbox" checked={auto} onChange={e=> setAuto(e.target.checked)}/> Auto-check</label>
              <button className="primary" onClick={run} disabled={!pw || busy}>{busy? 'Checking…':'Check now'}</button>
            </div>
          </div>

          {error && <div className="tip wobble" style={{borderLeftColor:'var(--bad)'}}>⚠️ {error}</div>}

          {data && (
            <div className="results pop-in">
              <div className={`badge ${passed? 'ok' : 'bad'}`}>{passed ? 'Looks good' : 'Improve it'}</div>
              <div className="rline"><span>Score:</span><span className="ex">{score} / 4 ({scoreLabel})</span></div>
              <div className="rline"><span>Crack time (slow 1e4/s):</span><span className="ex">{data.crack_time_display || 'n/a'}</span></div>
              <div className="rline"><span>Breached:</span><span className="ex">{data.breached ? `Yes (${data.breach_count})` : 'No'}</span></div>
              <div className="actions center">
                <button className={passed? 'primary pulse' : ''} disabled={!passed} onClick={()=> alert('✅ Passed!')}>
                  {passed ? 'Pass' : 'Try a different password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

PasswordAuditGame.id = 'password-audit'
PasswordAuditGame.title = 'Password Audit (zxcvbn + Pwned)'


