import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
      x: 7, y: 11, // Top left corner (left: 5% + 2%, bottom: 380px = top: 11%)
      icon: '📝'
    },
    {
      id: 'usb-drive',
      label: 'Unknown USB flash drive',
      tip: 'Unknown USB media can contain malware. Hand it to IT; never plug it in.',
      x: 83, y: 13, // Top right corner (left: 82% + 1%, bottom: 385px = top: 13%)
      icon: '💾'
    },
    {
      id: 'phish-email',
      label: 'Suspicious email attachment',
      tip: 'Verify sender, hover links, and report phish. When in doubt, do not click.',
      x: 47, y: 17, // Top center (left: 42% + 5%, bottom: 350px = top: 17%)
      icon: '📧'
    },
    {
      id: 'update-ignored',
      label: 'Ignored OS updates',
      tip: 'Apply updates promptly to patch known vulnerabilities.',
      x: 73, y: 52, // Right side, middle (left: 68% + 5%, bottom: 200px = top: 52%)
      icon: '⚠️'
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
        <div className="game-card slide-in security-hunt-card">
          <div className="actions" style={{justifyContent:'space-between', marginBottom: '16px'}}>
            <Link to="/" className="back">← Back</Link>
            <div className="actions" style={{gap: 10}}>
              <button onClick={reset}>Reset</button>
              <label className="toggle">
                <input type="checkbox" checked={showHints} onChange={e=> setShowHints(e.target.checked)}/> 
                Show hints
              </label>
            </div>
          </div>

          <h1 className="glow" style={{marginBottom: '8px'}}>Security Hunt: Spot the Risks</h1>
          <p className="muted" style={{marginBottom: '20px'}}>
            Click the risky items in the scene to secure them. Learn a quick tip for each one.
          </p>

          <div className="security-hunt-layout">
            <OfficeScene items={items} secured={secured} onToggle={toggleItem} showHints={showHints} />

            <div className="security-hunt-sidebar">
              <div className="stats-panel">
                <div className="rline">
                  <span>Found:</span>
                  <span className="ex">{secured.size} / {total}</span>
                </div>
                <div className="rline">
                  <span>Mistakes:</span>
                  <span className="ex">{mistakes}</span>
                </div>
                <div className="rline">
                  <span>Time:</span>
                  <span className="ex">{seconds}s</span>
                </div>
                {passed && (
                  <div className="actions center" style={{marginTop:12}}>
                    <button className="primary pulse" onClick={()=> alert('✅ Passed! Great spotting!')}>
                      Pass
                    </button>
                  </div>
                )}
              </div>

              <div className="items-list">
                <div style={{fontWeight:600, marginBottom:10, fontSize: '1.05em'}}>Items to Find</div>
                <ul className="items-list-ul">
                  {items.map(it=> (
                    <li key={it.id} className="item-list-item">
                      <button
                        className={`item-badge ${secured.has(it.id)? 'ok' : ''}`}
                        onClick={()=> toggleItem(it.id)}
                        aria-label={secured.has(it.id) ? `${it.label} secured` : `Secure ${it.label}`}
                      >
                        {secured.has(it.id)? '✓ Secured' : '○ Secure'}
                      </button>
                      <div className="muted item-label">
                        <span style={{marginRight: '6px'}}>{it.icon}</span>
                        {it.label}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {lastTip && (
                <div className="tip pop-in security-tip">
                  <div style={{fontWeight:600, marginBottom:6, fontSize: '1.05em'}}>{lastTip.label}</div>
                  <div>{lastTip.tip}</div>
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
    <div className="office-scene" aria-label="Office scene with clickable items">
      {/* Desk */}
      <div className="scene-desk" />
      
      {/* Update notification */}
      <div className="scene-update-notif">
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'2px'}}>
          <span style={{fontWeight:600}}>⚠️ Update Available</span>
          <span style={{fontSize:'9px', opacity:0.8}}>Security patch v2.4.1</span>
          <span style={{fontSize:'8px', opacity:0.6}}>Click to install</span>
        </div>
      </div>
      
      {/* Email attachment */}
      <div className="scene-email">
        <span>📎 Invoice.zip</span>
      </div>
      
      {/* Sticky note with password */}
      <div className="scene-sticky-note">
        <span>pass: Summer2024!</span>
      </div>
      
      {/* USB drive */}
      <div className="scene-usb" />

      {/* Hotspots */}
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
      className={`security-hotspot ${active? 'active' : ''}`}
      style={{
        position:'absolute', 
        left: `${x}%`, 
        top: `${y}%`, 
        transform:'translate(-50%, -50%)',
      }}
      aria-label={`Toggle: ${label}`}
      title={label}
    >
      <span className="hotspot-indicator">{active? '✓' : '•'}</span>
      {showHint && !active && (
        <span className="hotspot-hint">Click me</span>
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
          <li><b>Phishing attachment</b>: compressed files often hide malware. Verify and report.</li>
          <li><b>Ignored updates</b>: unpatched systems are a top breach cause. Update promptly.</li>
        </ul>
      </details>
    </div>
  )
}

SecurityHuntGame.id = 'security-hunt'
SecurityHuntGame.title = 'Security Hunt (Point & Click)'

