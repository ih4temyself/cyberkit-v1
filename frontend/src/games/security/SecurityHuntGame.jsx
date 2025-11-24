import React, { useEffect, useMemo, useRef, useState } from 'react'
import soundManager from '../../utils/sounds.js'

export default function SecurityHuntGame(){
  const [secured, setSecured] = useState(() => new Set())
  const [mistakes, setMistakes] = useState(0)
  const [lastTip, setLastTip] = useState(null)
  const [startTs] = useState(()=> Date.now())
  const [showHints, setShowHints] = useState(false)

  const items = useMemo(()=> [
    {
      id: 'sticky-note',
      label: 'Sticky note with password',
      tip: 'Never write passwords on sticky notes. Use a password manager instead.',
      x: 16, y: 58,
    },
    {
      id: 'usb-drive',
      label: 'Unknown USB flash drive',
      tip: 'Unknown USB media can contain malware. Hand it to IT; never plug it in.',
      x: 72, y: 70,
    },
    {
      id: 'unlocked-pc',
      label: 'Unattended, unlocked workstation',
      tip: 'Lock your screen (Win+L / Ctrl+Cmd+Q) whenever you step away.',
      x: 46, y: 28,
    },
    {
      id: 'phish-email',
      label: 'Suspicious email attachment',
      tip: 'Verify sender, hover links, and report phish. When in doubt, don’t click.',
      x: 60, y: 24,
    },
    {
      id: 'update-ignored',
      label: 'Ignored OS updates',
      tip: 'Apply updates promptly to patch known vulnerabilities.',
      x: 32, y: 18,
    },
  ], [])

  const total = items.length
  const seconds = Math.ceil((Date.now() - startTs) / 1000)
  const passed = secured.size === total

  const toggleItem = (id) => {
    setLastTip(null)
    setSecured(prev => {
      const next = new Set(prev)
      if(next.has(id)){
        // Unsecuring an item (mistake)
        next.delete(id)
        setMistakes(m => m + 1)
        soundManager.play('wrong_answer')
      }else{
        // Securing an item (correct)
        next.add(id)
        soundManager.play('right_answer')
      }
      return next
    })
    const it = items.find(i => i.id === id)
    if(it) setLastTip({ id: it.id, label: it.label, tip: it.tip })
  }

  const reset = () => {
    setSecured(new Set())
    setMistakes(0)
    setLastTip(null)
    setShowHints(false)
  }

  return (
    <div className="game-overlay">
      <div className="game-stage">
        <div className="game-card slide-in" style={{maxWidth: 980}}>
          <div className="actions" style={{justifyContent:'space-between'}}>
            <a href="/" className="back">← Back</a>
            <div className="actions" style={{gap: 8}}>
              <button onClick={reset}>Reset</button>
              <label className="toggle"><input type="checkbox" checked={showHints} onChange={e=> setShowHints(e.target.checked)}/> Show hints</label>
            </div>
          </div>

          <h1 className="glow">Security Hunt: Spot the Risks</h1>
          <p className="muted">Click the risky items in the scene to secure them. Learn a quick tip for each one.</p>

          <div className="demo fade-in" style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:16}}>
            <OfficeScene items={items} secured={secured} onToggle={toggleItem} showHints={showHints} />

            <div className="sidepanel" style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="stats" style={{border:'1px solid var(--border)', borderRadius:12, padding:12}}>
                <div className="rline"><span>Found:</span><span className="ex">{secured.size} / {total}</span></div>
                <div className="rline"><span>Mistakes:</span><span className="ex">{mistakes}</span></div>
                <div className="rline"><span>Time:</span><span className="ex">{seconds}s</span></div>
                {passed && (
                  <div className="actions center" style={{marginTop:8}}>
                    <button className="primary pulse" onClick={()=> alert('✅ Passed! Great spotting!')}>Pass</button>
                  </div>
                )}
              </div>

              <div className="list" style={{border:'1px solid var(--border)', borderRadius:12, padding:12}}>
                <div style={{fontWeight:600, marginBottom:8}}>Items</div>
                <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:6}}>
                  {items.map(it=> (
                    <li key={it.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                      <button
                        className={secured.has(it.id)? 'badge ok' : 'badge'}
                        onClick={()=> toggleItem(it.id)}
                        aria-label={secured.has(it.id) ? `${it.label} secured` : `Secure ${it.label}`}
                      >{secured.has(it.id)? 'Secured' : 'Secure'}</button>
                      <div className="muted" style={{flex:1}}>{it.label}</div>
                    </li>
                  ))}
                </ul>
              </div>

              {lastTip && (
                <div className="tip pop-in" style={{borderLeftColor:'var(--focus)'}}>
                  <div style={{fontWeight:600, marginBottom:4}}>{lastTip.label}</div>
                  {lastTip.tip}
                </div>
              )}
            </div>
          </div>

          <LearningNotes />
        </div>
      </div>
    </div>
  )
}

function OfficeScene({ items, secured, onToggle, showHints }){
  return (
    <div
      className="scene"
      style={{
        position:'relative', height: 400, border:'1px solid var(--border)', borderRadius:12,
        background: 'linear-gradient(#f7f9fb, #eef3f7)'
      }}
      aria-label="Office scene with clickable items"
    >
      <div style={{position:'absolute', left:'10%', bottom:60, width:'55%', height:120, background:'#e5e9f0', border:'1px solid #d0d7e1', borderRadius:12}} />
      <div style={{position:'absolute', left:'40%', bottom:190, width:140, height:90, background:'#1f2937', borderRadius:8}} />
      <div style={{position:'absolute', left:'44%', bottom:180, width:64, height:10, background:'#9aa3af', borderRadius:6}} />
      <div style={{position:'absolute', left:'22%', bottom:170, width:110, height:70, background:'#111827', borderRadius:8}} />
      <div style={{position:'absolute', left:'22%', bottom:165, width:110, height:10, background:'#4b5563', borderRadius:3}} />
      <div style={{position:'absolute', left:'33%', bottom:220, width:110, height:40, background:'#ffffff', border:'1px solid #d1d5db', borderRadius:6, display:'grid', placeItems:'center', fontSize:12}}>Update available</div>
      <div style={{position:'absolute', left:'52%', bottom:230, width:120, height:56, background:'#ffffff', border:'1px solid #d1d5db', borderRadius:6, display:'grid', placeItems:'center', fontSize:12}}>📎 Invoice.zip</div>
      <div style={{position:'absolute', left:'14%', bottom:150, width:52, height:42, background:'#fde68a', transform:'rotate(-8deg)', border:'1px solid #fbbf24'}}>pass: Summer2024!</div>
      <div style={{position:'absolute', left:'66%', bottom:150, width:38, height:18, background:'#374151', borderRadius:3}} />

      {items.map(it => (
        <Hotspot
          key={it.id}
          x={it.x}
          y={it.y}
          active={secured.has(it.id)}
          label={it.label}
          showHint={showHints}
          onClick={()=> onToggle(it.id)}
        />
      ))}
    </div>
  )
}

function Hotspot({ x, y, label, onClick, active, showHint }){
  const btnRef = useRef(null)
  useEffect(()=>{
    if(active && btnRef.current){
      btnRef.current.classList.add('pulse')
      const t = setTimeout(()=> btnRef.current && btnRef.current.classList.remove('pulse'), 600)
      return ()=> clearTimeout(t)
    }
  }, [active])

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={`hotspot ${active? 'ok' : ''}`}
      style={{
        position:'absolute', left: `${x}%`, top: `${y}%`, transform:'translate(-50%, -50%)',
        borderRadius: 999, border: '2px solid var(--focus, #3b82f6)',
        background: active? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.08)',
        width: 28, height: 28, display:'grid', placeItems:'center', cursor:'pointer',
        outline: 'none'
      }}
      aria-label={`Toggle: ${label}`}
      title={label}
    >
      <span style={{fontSize:12}}>{active? '✓' : '•'}</span>
      {showHint && !active && (
        <span
          className="hint"
          style={{
            position:'absolute', top:-28, left:'50%', transform:'translateX(-50%)',
            background:'white', border:'1px solid var(--border)', borderRadius:8, padding:'2px 6px', fontSize:11,
            whiteSpace:'nowrap'
          }}
        >Click me</span>
      )}
    </button>
  )
}

function LearningNotes(){
  return (
    <div className="notes" style={{marginTop:16}}>
      <details>
        <summary className="muted">Why these items?</summary>
        <ul>
          <li><b>Passwords on notes</b>: high risk of shoulder surfing and leakage. Use a password manager.</li>
          <li><b>Unknown USB</b>: common malware vector. Follow your incident/reporting policy.</li>
          <li><b>Unlocked workstation</b>: enables misuse and data exfiltration. Always lock your screen.</li>
          <li><b>Phishing attachment</b>: compressed files often hide malware. Verify and report.</li>
          <li><b>Ignored updates</b>: unpatched systems are a top breach cause. Update promptly.</li>
        </ul>
      </details>
    </div>
  )
}

SecurityHuntGame.id = 'security-hunt'
SecurityHuntGame.title = 'Security Hunt (Point & Click)'

