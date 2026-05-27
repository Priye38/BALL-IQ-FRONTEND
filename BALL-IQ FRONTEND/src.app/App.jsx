// ─────────────────────────────────────────────────────────────
//  hoops-oracle / src/App.jsx
//  LIVE VERSION — calls the Python backend on Replit
//  Replace BACKEND_URL with your actual backend Repl URL
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";

// ── IMPORTANT: Replace with your backend Repl URL after deploy ──
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://your-backend-repl-url.replit.app";

// ── Constants ─────────────────────────────────────────────────
const PICK_COLOR = { OVER: "#F97316", UNDER: "#3B82F6", PASS: "#64748B" };
const CONF_META  = {
  HIGH: { color: "#22C55E", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.22)",  units: 3, emoji: "🟢" },
  MED:  { color: "#EAB308", bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.22)",  units: 2, emoji: "🟡" },
  LOW:  { color: "#F97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.22)", units: 1, emoji: "🟠" },
  PASS: { color: "#64748B", bg: "rgba(100,116,139,0.08)",border: "rgba(100,116,139,0.2)", units: 0, emoji: "⚪" },
};

const gKey = g => `${g.visitor_team.abbreviation}-${g.home_team.abbreviation}`;
const avg  = arr => arr?.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : "—";

// ── CSS (same dark theme — update with your custom UI design) ─
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,#root{background:#080B12;color:#C8D6E5;font-family:Outfit,sans-serif;min-height:100vh;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#1E2D45;border-radius:4px;}
  .dash{display:grid;grid-template-rows:56px 1fr;grid-template-columns:248px 1fr 292px;
    grid-template-areas:"hd hd hd" "sb mn pn";height:100vh;overflow:hidden;}
  .hd{grid-area:hd;background:#0C1220;border-bottom:1px solid #1A2540;
    display:flex;align-items:center;padding:0 18px;gap:12px;}
  .logo{font-family:'Barlow Condensed',sans-serif;font-size:21px;font-weight:700;color:#fff;
    display:flex;align-items:center;gap:8px;}
  .ldot{width:8px;height:8px;border-radius:50%;background:#F97316;}
  .hdiv{width:1px;height:22px;background:#1A2540;}
  .hdate{font-family:'DM Mono',monospace;font-size:11px;color:#64748B;}
  .hsp{flex:1;}
  .badge{font-family:'DM Mono',monospace;font-size:10px;padding:3px 9px;border-radius:20px;
    display:flex;align-items:center;gap:5px;}
  .bg{background:rgba(34,197,94,.12);color:#22C55E;border:1px solid rgba(34,197,94,.25);}
  .by{background:rgba(234,179,8,.1);color:#EAB308;border:1px solid rgba(234,179,8,.25);}
  .br{background:rgba(239,68,68,.1);color:#EF4444;border:1px solid rgba(239,68,68,.25);}
  .bpulse{width:5px;height:5px;border-radius:50%;background:currentColor;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .sb{grid-area:sb;background:#0A0F1C;border-right:1px solid #1A2540;overflow-y:auto;padding:10px;}
  .sblbl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:#3D5275;
    padding:8px 4px 5px;text-transform:uppercase;}
  .sbdate{font-family:'DM Mono',monospace;font-size:10px;background:rgba(249,115,22,.1);
    color:#F97316;border:1px solid rgba(249,115,22,.2);border-radius:4px;
    padding:2px 8px;display:inline-block;margin-bottom:8px;}
  .gc{margin-bottom:5px;padding:11px 12px;border-radius:10px;border:1px solid transparent;
    cursor:pointer;transition:all .15s;position:relative;}
  .gc:hover{background:#111828;border-color:#1E2D45;}
  .gc.sel{background:#111828;border-color:#F97316;}
  .gctime{font-family:'DM Mono',monospace;font-size:10px;color:#3D5275;margin-bottom:6px;}
  .gcteams{display:flex;flex-direction:column;gap:3px;margin-bottom:6px;}
  .gcteam{display:flex;align-items:center;gap:7px;}
  .tabbr{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;color:#E2E8F0;width:33px;}
  .tcity{font-size:11px;color:#64748B;flex:1;}
  .gcfoot{display:flex;align-items:center;justify-content:space-between;}
  .oul{font-family:'DM Mono',monospace;font-size:11px;color:#64748B;}
  .oul span{color:#C8D6E5;}
  .rdot{width:6px;height:6px;border-radius:50%;position:absolute;top:11px;right:11px;}
  .gc-risk{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;}
  .mn{grid-area:mn;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
  .stitle{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
    color:#3D5275;margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .lbadge{font-family:'DM Mono',monospace;font-size:9px;color:#22C55E;
    background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:3px;padding:1px 5px;}
  .card{background:#0C1220;border:1px solid #1A2540;border-radius:14px;padding:15px 19px;}
  .mh{background:#0C1220;border:1px solid #1A2540;border-radius:14px;padding:15px 19px;
    display:flex;align-items:center;}
  .mht{flex:1;display:flex;flex-direction:column;gap:3px;}
  .mht.r{align-items:flex-end;}
  .mha{font-family:'Barlow Condensed',sans-serif;font-size:42px;font-weight:700;line-height:1;color:#fff;}
  .mhf{font-size:11px;color:#64748B;}
  .mhc{flex:0 0 88px;display:flex;flex-direction:column;align-items:center;gap:3px;}
  .vst{font-family:'Barlow Condensed',sans-serif;font-size:11px;color:#1E2D45;}
  .mhtime{font-family:'DM Mono',monospace;font-size:10px;color:#64748B;text-align:center;}
  .mhstat{font-size:11px;color:#22C55E;background:rgba(34,197,94,.1);
    border:1px solid rgba(34,197,94,.2);border-radius:4px;padding:2px 7px;}
  .itag{font-size:10px;color:#EF4444;background:rgba(239,68,68,.08);
    border:1px solid rgba(239,68,68,.18);border-radius:4px;padding:1px 7px;
    display:inline-block;margin-top:3px;}
  .pmrow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
  .pmlbl{font-family:'DM Mono',monospace;font-size:9px;color:#3D5275;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;}
  .pmval{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:700;color:#fff;}
  .pmval.ov{color:#F97316;} .pmval.un{color:#3B82F6;}
  .risk-card{border-radius:14px;padding:15px 19px;}
  .risk-top{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;}
  .risk-lbl{font-family:'DM Mono',monospace;font-size:9px;color:#3D5275;letter-spacing:.07em;text-transform:uppercase;margin-bottom:3px;}
  .risk-big{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:700;line-height:1;}
  .risk-sub{font-size:11px;color:#64748B;margin-top:2px;}
  .units-row{display:flex;gap:4px;margin-top:3px;}
  .unit-dot{width:16px;height:16px;border-radius:3px;}
  .edge-track{height:4px;background:#1A2540;border-radius:2px;overflow:hidden;margin-top:4px;}
  .edge-fill{height:100%;border-radius:2px;transition:width .6s ease;}
  .cond-item{display:flex;align-items:flex-start;gap:7px;padding:6px 0;
    border-bottom:1px solid #111828;font-size:11px;color:#64748B;line-height:1.5;}
  .cond-item:last-child{border-bottom:none;}
  .srow{display:grid;grid-template-columns:70px 1fr 70px;align-items:center;
    gap:6px;padding:6px 0;border-bottom:1px solid #1A2540;}
  .srow:last-child{border-bottom:none;}
  .sv{font-family:'DM Mono',monospace;font-size:13px;color:#C8D6E5;}
  .sv.hm{text-align:right;} .sv.hi{color:#F97316;}
  .snm{font-family:'DM Mono',monospace;font-size:10px;color:#3D5275;text-align:center;letter-spacing:.05em;}
  .rbox{background:#080B12;border:1px solid #1A2540;border-radius:10px;
    padding:12px;font-size:12px;color:#94A3B8;line-height:1.7;
    white-space:pre-wrap;word-break:break-word;min-height:60px;}
  .rbox.done{color:#C8D6E5;} .rbox.thinking{color:#3D5275;font-style:italic;}
  .fb-lbl{font-family:'DM Mono',monospace;font-size:10px;color:#F97316;
    letter-spacing:.08em;text-transform:uppercase;margin:10px 0 6px;
    display:flex;align-items:center;gap:6px;}
  .fb-dot{width:6px;height:6px;border-radius:50%;background:#F97316;animation:pulse 2s infinite;}
  .fb-inp{width:100%;background:#0C1220;border:1px solid #2D3F55;border-radius:8px;
    padding:9px 12px;color:#C8D6E5;font-family:Outfit,sans-serif;font-size:12px;
    resize:none;outline:none;line-height:1.6;transition:border-color .2s;}
  .fb-inp:focus{border-color:#F97316;}
  .fb-inp::placeholder{color:#2D3F55;}
  .fb-btn{margin-top:6px;width:100%;background:#F97316;border:none;border-radius:7px;
    padding:9px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:14px;
    font-weight:700;cursor:pointer;transition:background .2s;}
  .fb-btn:hover{background:#EA6C0A;} .fb-btn:disabled{background:#2D3F55;cursor:not-allowed;}
  .refined-box{background:rgba(249,115,22,.05);border:1px solid rgba(249,115,22,.18);
    border-radius:10px;padding:12px;font-size:12px;color:#C8D6E5;line-height:1.7;
    white-space:pre-wrap;margin-top:10px;}
  .pn{grid-area:pn;background:#0A0F1C;border-left:1px solid #1A2540;overflow-y:auto;}
  .pnsec{padding:13px 14px;border-bottom:1px solid #1A2540;}
  .pnsec:last-child{border-bottom:none;}
  .rrow{display:flex;justify-content:space-between;align-items:center;padding:4px 0;}
  .rk{font-family:'DM Mono',monospace;font-size:10px;color:#3D5275;}
  .rv{font-family:'DM Mono',monospace;font-size:11px;color:#C8D6E5;}
  .sr{display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid #111828;cursor:pointer;}
  .sr:last-child{border-bottom:none;}
  .sr:hover .sg{color:#C8D6E5;}
  .sg{flex:1;color:#64748B;font-size:11px;transition:color .1s;}
  .spk{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;width:44px;text-align:center;}
  .mem-box{background:#080B12;border:1px solid #1A2540;border-radius:8px;
    padding:9px 11px;font-size:11px;color:#64748B;line-height:1.6;max-height:90px;overflow-y:auto;}
  .ci{display:flex;align-items:flex-start;gap:7px;font-size:11px;color:#64748B;
    padding:4px 0;border-bottom:1px solid #111828;line-height:1.4;}
  .ci:last-child{border-bottom:none;}
  .sum-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;}
  .sum-stat{background:#080B12;border:1px solid #1A2540;border-radius:8px;padding:8px 9px;}
  .sum-lbl{font-family:'DM Mono',monospace;font-size:9px;color:#3D5275;letter-spacing:.07em;text-transform:uppercase;margin-bottom:2px;}
  .sum-val{font-family:'Barlow Condensed',sans-serif;font-size:19px;font-weight:700;}
  .spinner{display:inline-block;width:11px;height:11px;border:2px solid #1A2540;
    border-top-color:#F97316;border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .err-box{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;
    padding:14px;font-size:12px;color:#EF4444;line-height:1.6;}
  .refresh-btn{background:transparent;border:1px solid #1A2540;border-radius:6px;
    padding:4px 10px;color:#64748B;font-family:'DM Mono',monospace;font-size:10px;
    cursor:pointer;transition:all .15s;}
  .refresh-btn:hover{border-color:#2D3F55;color:#C8D6E5;}
`;

// ── GameCard ──────────────────────────────────────────────────
function GameCard({ game, selected, onClick, odds, risk }) {
  const cm = risk ? CONF_META[risk.conf] : null;
  return (
    <div className={`gc${selected?" sel":""}`} onClick={onClick}>
      <div className="rdot" style={{background: cm?.color || "#2D3F55"}}/>
      <div className="gctime">{game.status}</div>
      <div className="gcteams">
        <div className="gcteam"><div className="tabbr">{game.visitor_team.abbreviation}</div><div className="tcity">{game.visitor_team.city}</div></div>
        <div className="gcteam"><div className="tabbr">{game.home_team.abbreviation}</div><div className="tcity">{game.home_team.city}</div></div>
      </div>
      <div className="gcfoot">
        <div className="oul">O/U <span>{odds?.line || "—"}</span></div>
        {cm && <div className="gc-risk" style={{background:cm.bg,color:cm.color,border:`1px solid ${cm.border}`}}>
          {risk.pick==="PASS" ? "PASS" : `${risk.pick} · ${risk.conf}`}
        </div>}
      </div>
    </div>
  );
}

function StatRow({ label, home, away }) {
  const h=parseFloat(home)||0, aw=parseFloat(away)||0;
  return (
    <div className="srow">
      <div className={`sv hm${h>aw?" hi":""}`}>{home||"—"}</div>
      <div className="snm">{label}</div>
      <div className={`sv${aw>h?" hi":""}`}>{away||"—"}</div>
    </div>
  );
}

function RiskCard({ risk, odds }) {
  if (!risk) return null;
  const cm = CONF_META[risk.conf];
  const pc = PICK_COLOR[risk.pick] || "#64748B";
  const edgePct = risk.edge!=null ? Math.min(Math.abs(risk.edge)/10*100, 100) : 0;
  return (
    <div className="risk-card card" style={{border:`1px solid ${cm.border}`,background:cm.bg}}>
      <div className="stitle" style={{marginBottom:10}}>
        Risk scorecard
        <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:cm.color,
          background:cm.bg,border:`1px solid ${cm.border}`,borderRadius:3,padding:"1px 5px"}}>
          {cm.emoji} {risk.conf}
        </span>
      </div>
      <div className="risk-top">
        <div><div className="risk-lbl">Pick</div><div className="risk-big" style={{color:pc}}>{risk.pick}</div><div className="risk-sub">Line {odds?.line}</div></div>
        <div>
          <div className="risk-lbl">Projected</div>
          <div className="risk-big" style={{color:"#C8D6E5",fontSize:24}}>{risk.proj||"—"}</div>
          {risk.edge!=null && <><div className="risk-sub">{risk.edge>0?"+":""}{risk.edge} pts edge</div>
            <div className="edge-track"><div className="edge-fill" style={{width:`${edgePct}%`,background:risk.edge>0?"#F97316":"#3B82F6"}}/></div></>}
        </div>
        <div><div className="risk-lbl">Bet size</div><div className="risk-big" style={{color:cm.color}}>{risk.units}u</div>
          <div className="units-row">{[1,2,3].map(u=><div key={u} className="unit-dot" style={{background:u<=risk.units?cm.color:"#1A2540"}}/>)}</div>
        </div>
        <div><div className="risk-lbl">Comb L5</div><div className="risk-big" style={{color:"#C8D6E5",fontSize:22}}>{risk.combinedL5||"—"}</div><div className="risk-sub">Pace gap {risk.paceGap}</div></div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:10}}>
        {(risk.conditions||[]).map((c,i)=>(
          <div key={i} className="cond-item">
            <span>{c.ok===true?"✅":c.ok===false?"❌":"⚠️"}</span><span>{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [games,   setGames]   = useState([]);
  const [pm,      setPm]      = useState({});
  const [sel,     setSel]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [updated, setUpdated] = useState("");

  // Per-game state
  const [analyses,      setAnalyses]      = useState({});
  const [aStates,       setAStates]       = useState({});
  const [risks,         setRisks]         = useState({});
  const [refinements,   setRefinements]   = useState({});
  const [refineLoading, setRefineLoading] = useState({});
  const [memory,        setMemory]        = useState({profile:"",feedbackCount:0});
  const fbRef = useRef({});

  const today = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  const k     = sel ? gKey(sel) : null;
  const odds  = k ? pm[k] : null;
  const risk  = k ? risks[k] : null;
  const aState = k ? aStates[k] : null;
  const cm    = risk ? CONF_META[risk.conf] : null;
  const pc    = risk ? PICK_COLOR[risk.pick] : "#64748B";

  // ── Load games from backend ──
  const loadGames = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BACKEND_URL}/api/games`);
      if (!r.ok) throw new Error(`Backend ${r.status} — is the backend Repl running?`);
      const d = await r.json();
      setGames(d.games || []);
      setPm(d.pm_odds || {});
      setUpdated(new Date().toLocaleTimeString());
      if (d.games?.length) setSel(d.games[0]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  // Load memory
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/memory`)
      .then(r=>r.json()).then(setMemory).catch(()=>{});
  }, []);

  // ── Auto-analyse on select ──
  useEffect(() => {
    if (!k || aStates[k] || !odds) return;
    runAnalysis(k);
  }, [sel, pm]);

  const runAnalysis = useCallback(async (gameKey) => {
    setAStates(p=>({...p,[gameKey]:"thinking"}));
    try {
      const r = await fetch(`${BACKEND_URL}/api/analyse/${gameKey}`);
      if (!r.ok) throw new Error(`Analysis failed: ${r.status}`);
      const d = await r.json();
      setAnalyses(p=>({...p,[gameKey]:d.analysis}));
      setRisks(p=>({...p,[gameKey]:d.risk}));
      setAStates(p=>({...p,[gameKey]:"done"}));
    } catch(e) {
      setAnalyses(p=>({...p,[gameKey]:`Error: ${e.message}`}));
      setAStates(p=>({...p,[gameKey]:"error"}));
    }
  }, []);

  const submitFeedback = useCallback(async (game) => {
    const gk  = gKey(game);
    const inp = fbRef.current[gk]?.value || "";
    if (!inp.trim()) return;
    setRefineLoading(p=>({...p,[gk]:true}));
    try {
      const r = await fetch(`${BACKEND_URL}/api/refine/${gk}`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({user_input: inp}),
      });
      if (!r.ok) throw new Error(`Refine failed: ${r.status}`);
      const d = await r.json();
      setRefinements(p=>({...p,[gk]:d.refined}));
      setRisks(p=>({...p,[gk]:d.risk}));
      setAStates(p=>({...p,[gk]:"refined"}));
      if (d.mem_update) {
        setMemory(prev=>({
          ...prev,
          profile: prev.profile ? `${prev.profile}\n- ${d.mem_update}` : `- ${d.mem_update}`,
          feedbackCount: (prev.feedbackCount||0)+1,
        }));
      }
    } catch(e) { console.error(e); }
    finally { setRefineLoading(p=>({...p,[gk]:false})); }
  }, []);

  const bets   = Object.values(risks).filter(r=>r&&r.pick!=="PASS");
  const passes = Object.values(risks).filter(r=>r?.pick==="PASS");
  const totalUnits = bets.reduce((s,r)=>s+r.units,0);

  return (
    <>
      <style>{css}</style>
      <div className="dash">

        {/* Header */}
        <header className="hd">
          <div className="logo"><div className="ldot"/>HOOPS ORACLE</div>
          <div className="hdiv"/>
          <div className="hdate">{today}</div>
          <div className="hsp"/>
          {updated && <div className="hdate" style={{marginRight:8}}>↻ {updated}</div>}
          <div className={`badge ${error?"br":loading?"by":"bg"}`}>
            <div className="bpulse"/>
            {error?"ERROR":loading?"LOADING":"LIVE"}
          </div>
          <button className="refresh-btn" style={{marginLeft:8}} onClick={loadGames}>↺ Refresh</button>
        </header>

        {/* Sidebar */}
        <aside className="sb">
          <div className="sblbl">{loading?"Loading…":`${games.length} Games Tonight`}</div>
          <div className="sbdate">{new Date().toISOString().split("T")[0]}</div>

          {loading && <div style={{padding:"20px",textAlign:"center"}}>
            <div className="spinner" style={{width:24,height:24,borderWidth:3}}/>
          </div>}

          {error && <div style={{padding:10,fontSize:11,color:"#EF4444",lineHeight:1.5}}>
            ⚠ {error}<br/><br/>
            <span style={{color:"#3D5275"}}>Make sure your backend Repl is running and BACKEND_URL is set correctly.</span>
          </div>}

          {!loading && !error && games.length===0 && (
            <div style={{padding:"20px 10px",textAlign:"center",color:"#3D5275",fontSize:12}}>
              🏀 No games tonight.<br/>Check back on a game night.
            </div>
          )}

          {!loading && games.map(g=>(
            <GameCard key={g.id} game={g} selected={sel?.id===g.id}
              onClick={()=>setSel(g)} odds={pm[gKey(g)]} risk={risks[gKey(g)]}/>
          ))}

          <div style={{padding:"10px 4px 4px",borderTop:"1px solid #111828",marginTop:6}}>
            {[["#22C55E","Scored"],["#EAB308","Analysing"],["#2D3F55","Pending"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}}/>
                <span style={{fontSize:10,color:"#3D5275",fontFamily:"DM Mono,monospace"}}>{l}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="mn">
          {!sel ? (
            <div style={{display:"flex",height:"100%",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:.4}}>
              <div style={{fontSize:32}}>🏀</div>
              <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:18}}>
                {loading?"Loading games…":"Select a game"}
              </div>
            </div>
          ) : (
            <>
              {/* Matchup */}
              <div className="mh">
                <div className="mht">
                  <div className="mha">{sel.visitor_team.abbreviation}</div>
                  <div className="mhf">{sel.visitor_team.full_name}</div>
                  {(sel.stats?.away?.injuries||[]).map(i=><div key={i} className="itag">⚠ {i}</div>)}
                </div>
                <div className="mhc">
                  <div className="vst">AT</div>
                  <div className="mhtime">{sel.status}</div>
                  {sel.status_code===2 && <div className="mhstat">LIVE</div>}
                </div>
                <div className="mht r">
                  <div className="mha">{sel.home_team.abbreviation}</div>
                  <div className="mhf">{sel.home_team.full_name}</div>
                  {(sel.stats?.home?.injuries||[]).map(i=><div key={i} className="itag">⚠ {i}</div>)}
                </div>
              </div>

              {/* Polymarket */}
              {odds && (
                <div className="card">
                  <div className="stitle">Polymarket <span className="lbadge">LIVE</span></div>
                  <div className="pmrow">
                    <div><div className="pmlbl">O/U Line</div><div className="pmval">{odds.line}</div></div>
                    <div><div className="pmlbl">Over</div><div className="pmval ov">{Math.round(odds.overOdds*100)}¢</div></div>
                    <div><div className="pmlbl">Under</div><div className="pmval un">{Math.round(odds.underOdds*100)}¢</div></div>
                    <div><div className="pmlbl">Vol · Move</div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:15,color:"#C8D6E5",marginTop:4}}>{odds.volume}</div>
                      <div style={{fontSize:11,color:odds.movement?.startsWith("↑")?"#22C55E":odds.movement?.startsWith("↓")?"#EF4444":"#64748B"}}>{odds.movement}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk scorecard */}
              {risk && <RiskCard risk={risk} odds={odds}/>}

              {/* Agent reasoning */}
              <div className="card">
                <div className="stitle">
                  Agent reasoning
                  {aState==="thinking"&&<><div className="spinner"/><span style={{fontSize:10,color:"#EAB308"}}>Analysing…</span></>}
                  {aState==="done"&&<span className="lbadge">AWAITING YOUR INPUT</span>}
                  {aState==="refined"&&<span className="lbadge">REFINED ✓</span>}
                </div>
                <div className={`rbox${aState==="thinking"?" thinking":aState?" done":""}`}>
                  {!aState&&!odds&&"Waiting for odds…"}
                  {!aState&&odds&&"Preparing analysis…"}
                  {aState==="thinking"&&"Reasoning through this matchup…"}
                  {(aState==="done"||aState==="refined"||aState==="error")&&(analyses[k]||"")}
                </div>
                {(aState==="done"||aState==="refined")&&(
                  <>
                    <div className="fb-lbl"><div className="fb-dot"/>Your read — add your analysis or push back</div>
                    <textarea className="fb-inp" rows={3}
                      placeholder="Add your take or push back on the agent's reasoning…"
                      ref={el=>{if(el)fbRef.current[k]=el;}}
                      defaultValue={""}/>
                    <button className="fb-btn" onClick={()=>submitFeedback(sel)} disabled={refineLoading[k]}>
                      {refineLoading[k]?"Incorporating your thinking…":"Submit → Refine + Rescore"}
                    </button>
                  </>
                )}
                {refinements[k]&&(
                  <>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#F97316",letterSpacing:".1em",textTransform:"uppercase",margin:"10px 0 5px"}}>Refined analysis</div>
                    <div className="refined-box">{refinements[k]}</div>
                  </>
                )}
              </div>

              {/* Team stats */}
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div className="stitle" style={{margin:0}}>Team stats</div>
                  <div style={{display:"flex",gap:12}}>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#F97316"}}>{sel.home_team.abbreviation}</span>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#3B82F6"}}>{sel.visitor_team.abbreviation}</span>
                  </div>
                </div>
                <StatRow label="OFF RTG" home={sel.stats?.home?.offRtg} away={sel.stats?.away?.offRtg}/>
                <StatRow label="DEF RTG" home={sel.stats?.home?.defRtg} away={sel.stats?.away?.defRtg}/>
                <StatRow label="PACE"    home={sel.stats?.home?.pace}   away={sel.stats?.away?.pace}/>
                <StatRow label="L5 AVG"  home={avg(sel.stats?.home?.last5)} away={avg(sel.stats?.away?.last5)}/>
              </div>
            </>
          )}
        </main>

        {/* Right Panel */}
        <aside className="pn">
          {/* Tonight's plan */}
          <div className="pnsec">
            <div className="stitle">Tonight's plan</div>
            <div className="sum-stats">
              <div className="sum-stat"><div className="sum-lbl">Bets</div><div className="sum-val" style={{color:"#22C55E"}}>{bets.length}</div></div>
              <div className="sum-stat"><div className="sum-lbl">Pass</div><div className="sum-val" style={{color:"#64748B"}}>{passes.length}</div></div>
              <div className="sum-stat"><div className="sum-lbl">Units</div><div className="sum-val" style={{color:"#F97316"}}>{totalUnits}u</div></div>
            </div>
            {games.map(g=>{
              const gk=gKey(g); const gr=risks[gk]; const gcm=gr?CONF_META[gr.conf]:null;
              return(
                <div key={g.id} className="sr" onClick={()=>setSel(g)}>
                  <div className="sg">{g.visitor_team.abbreviation} @ {g.home_team.abbreviation}</div>
                  <div className="spk" style={{color:gr?PICK_COLOR[gr.pick]:"#2D3F55"}}>{gr?.pick||"—"}</div>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:gcm?.color||"#2D3F55",width:28,textAlign:"right"}}>{gr?`${gr.units}u`:""}</div>
                </div>
              );
            })}
          </div>

          {/* Current pick */}
          {risk&&cm&&(
            <div className="pnsec">
              <div className="stitle">Current pick</div>
              <div style={{background:cm.bg,border:`1px solid ${cm.border}`,borderRadius:10,padding:11,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:26,fontWeight:700,color:pc}}>{risk.pick}</div>
                  <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:18,fontWeight:700,color:cm.color}}>{cm.emoji} {risk.conf}</div>
                </div>
                <div style={{height:1,background:"rgba(255,255,255,.06)"}}/>
                {[["LINE",odds?.line],["PROJ",risk.proj||"—"],["EDGE",risk.edge!=null?(risk.edge>0?"+":"")+risk.edge+" pts":"—"],["SIZE",`${risk.units}u`]].map(([lbl,val])=>(
                  <div key={lbl} className="rrow"><div className="rk">{lbl}</div><div className="rv">{val}</div></div>
                ))}
                <div className="rrow">
                  <div className="rk">STATUS</div>
                  <div className="rv" style={{color:aState==="refined"?"#F97316":"#64748B"}}>{aState==="refined"?"User-refined":"Agent only"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Memory */}
          <div className="pnsec">
            <div className="stitle">Agent memory <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#3D5275"}}>{memory.feedbackCount||0} inputs</span></div>
            <div className="mem-box">
              {memory.profile
                ?<span>{memory.profile}</span>
                :<span style={{color:"#2D3F55",fontStyle:"italic"}}>No profile yet — submit your first analysis to start building it.</span>}
            </div>
          </div>

          {/* Backend status */}
          <div className="pnsec">
            <div className="stitle">System</div>
            {[
              {ok:!error, label: error?"Backend error":"Backend connected"},
              {ok:Object.keys(pm).length>0, label:`Polymarket: ${Object.keys(pm).length} markets`},
              {ok:games.length>0, label:`NBA API: ${games.length} games tonight`},
              {ok:true, label:"Telegram bot: running on backend"},
            ].map(s=>(
              <div key={s.label} className="ci">
                <span style={{color:s.ok?"#22C55E":"#EF4444",flexShrink:0}}>{s.ok?"✓":"✗"}</span>
                <span style={{color:s.ok?"#64748B":"#EF4444"}}>{s.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
