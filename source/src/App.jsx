import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { P, MOB, BYID, GROUPS, GROUP_KEYS, ORDER_ALL, ROAD, TIERS, LEVEL, MINS } from "./data.js";
import Diagram from "./Diagram.jsx";

/* ---------- tiện ích ---------- */
const load = (k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){ return d; } };
const save = (k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
function usePersist(key, init){
  const [v,setV] = useState(()=>load(key,init));
  useEffect(()=>save(key,v),[key,v]);
  return [v,setV];
}
function useHash(){
  const [h,setH] = useState(()=>location.hash.slice(1));
  useEffect(()=>{ const f=()=>setH(location.hash.slice(1)); window.addEventListener("hashchange",f); return ()=>window.removeEventListener("hashchange",f); },[]);
  return h;
}
function useMedia(q){
  const [m,setM] = useState(()=>window.matchMedia(q).matches);
  useEffect(()=>{ const mq=window.matchMedia(q), f=()=>setM(mq.matches); mq.addEventListener("change",f); return ()=>mq.removeEventListener("change",f); },[q]);
  return m;
}
const go = h => { location.hash = "#"+h; };
const pad = n => String(n).padStart(2,"0");
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase();
const short = t => t.replace(/\s*\(.*\)$/,"");
const html = s => ({ dangerouslySetInnerHTML:{ __html:s } });

function modulesFor(mode){
  if (mode==="mobile") return [0,1,2,3].map(t=>({ key:"t"+t, num:t, title:TIERS[t].n, full:"Mobile · "+TIERS[t].n, col:TIERS[t].tint, items:ROAD.filter(id=>MOB[id].t===t).map(id=>BYID[id]) }));
  return GROUP_KEYS.map((g,i)=>({ key:g, num:i+1, title:GROUPS[g].sh, full:GROUPS[g].vi, col:GROUPS[g].col, items:P.filter(p=>p.g===g) }));
}

/* ---------- icon ---------- */
const I = {
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>', map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chev:'<path d="m9 6 6 6-6 6"/>', folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', signal:'<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>', list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  replay:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', pause:'<path d="M8 5v14M16 5v14"/>', play:'<path d="m7 4 13 8-13 8z"/>',
  left:'<path d="M19 12H5M11 6l-6 6 6 6"/>', right:'<path d="M5 12h14M13 6l6 6-6 6"/>', bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>', copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>', target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>', check:'<path d="m5 12 5 5 9-10"/>', code:'<path d="m8 8-5 4 5 4M16 8l5 4-5 4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', expand:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>', shrink:'<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>'
};
const Ic = ({ n, s, className="" }) => <svg className={"i "+className} style={s?{width:s,height:s}:undefined} viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html:I[n]}}/>;

/* ---------- highlight ---------- */
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function highlight(src){
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(class|interface|extends|implements|new|return|if|else|private|public|protected|static|const|let|var|val|fun|this|null|void|abstract|function|for|of|in|constructor|switch|case|break|true|false|throw|async|await|readonly|override|data|sealed|object|suspend|when|import|final|type|is|as)\b|(@\w+)|\b([A-Z][A-Za-z0-9]*)\b/gm;
  let out="", last=0, m;
  while ((m=re.exec(src))){ out+=esc(src.slice(last,m.index)); const c=m[1]?"tk-c":m[2]?"tk-s":m[3]?"tk-k":m[4]?"tk-n":"tk-t"; out+=`<span class="${c}">${esc(m[0])}</span>`; last=re.lastIndex; }
  return out+esc(src.slice(last));
}
const langOf = code => /\bfun |val |override fun|@Composable|@Inject|@Module/.test(code) ? "Kotlin" : /Widget|final |copyWith\(/.test(code) && !/interface /.test(code) ? "Dart" : "TypeScript";

/* =============================================================== */
export default function App(){
  const hash = useHash();
  const [mode,setMode] = usePersist("dp3-mode","group");
  const [visitedArr,setVisitedArr] = usePersist("dp3-visited",[]);
  const [nosb,setNosb] = usePersist("dp3-nosb",false);
  const [drawer,setDrawer] = useState(false);
  const [focus,setFocus] = usePersist("dp3-focus",false);
  const [theme,setTheme] = usePersist("dp3-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  useEffect(()=>{ document.documentElement.dataset.theme = theme; },[theme]);
  const small = useMedia("(max-width:900px)");
  const visited = useMemo(()=>new Set(visitedArr),[visitedArr]);
  const mods = useMemo(()=>modulesFor(mode),[mode]);
  const order = useMemo(()=>mods.flatMap(m=>m.items),[mods]);
  const lastL = load("dp3-last", order[0].id+"-1");

  // route
  let route = { view:"home" };
  const mm = hash.match(/^([a-z-]+?)-(\d+)$/);
  if (mm && BYID[mm[1]]) route = { view:"lesson", pid:mm[1], si:Math.min(Math.max(+mm[2],1),BYID[mm[1]].steps.length)-1 };
  else if (BYID[hash]) route = { view:"lesson", pid:hash, si:0 };
  else if (hash==="cheatsheet") route = { view:"cheatsheet" };
  else if (hash!=="home" && /^([a-z-]+?)-(\d+)$/.test(lastL) && BYID[lastL.replace(/-\d+$/,"")]) route = { view:"lesson", pid:lastL.replace(/-\d+$/,""), si:+lastL.match(/(\d+)$/)[1]-1 };

  useEffect(()=>{
    if (route.view!=="lesson") return;
    const k = route.pid+"-"+(route.si+1);
    save("dp3-last",k);
    if (!visited.has(k)) setVisitedArr(a=>[...a,k]);
  },[route.view, route.pid, route.si]);
  useEffect(()=>{ window.scrollTo({top:0}); },[route.view, route.pid]);

  const done = p => p.steps.every((_,i)=>visited.has(p.id+"-"+(i+1)));
  const ctx = { mode, setMode, visited, done, mods, order, route, focus, setFocus, theme };
  const focused = focus && route.view==="lesson" && !small;
  const sideOpen = small ? drawer : (!nosb && !focused);
  const toggleSide = ()=> small ? setDrawer(d=>!d) : focused ? setFocus(false) : setNosb(v=>!v);

  return (<>
    <Header active={route.view==="lesson"?"learn":route.view} lastL={lastL} onMenu={toggleSide} theme={theme} onTheme={()=>setTheme(t=>t==="dark"?"light":"dark")}/>
    <div className={"shell"+(sideOpen?"":" nosb")}>
      <AnimatePresence initial={false}>
        {sideOpen && (
          <motion.aside key="side" className="side"
            initial={small?{x:-300}:{opacity:0, x:-20}} animate={{x:0, opacity:1}} exit={small?{x:-300}:{opacity:0, x:-20}}
            transition={{type:"spring", stiffness:320, damping:32}}>
            <Sidebar {...ctx} curPid={route.view==="lesson"?route.pid:null} onPick={()=>setDrawer(false)}/>
          </motion.aside>
        )}
      </AnimatePresence>
      {small && drawer && <div className="scrim on" onClick={()=>setDrawer(false)}/>}
      <main>
          <motion.div key={route.view==="lesson"?route.pid:route.view}
            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:.25, ease:"easeOut"}}>
            {route.view==="lesson" ? <Lesson {...ctx} p={BYID[route.pid]} si={route.si}/>
             : route.view==="cheatsheet" ? <Cheatsheet {...ctx}/>
             : <Home {...ctx}/>}
          </motion.div>
      </main>
    </div>
  </>);
}

/* ---------------- Header ---------------- */
function Header({ active, lastL, onMenu, theme, onTheme }){
  const tabs = [["learn","book","Học","#"+lastL],["home","map","Lộ trình","#home"],["cheatsheet","grid","Cheatsheet","#cheatsheet"]];
  return (
    <header className="top">
      <button className="ham" onClick={onMenu} aria-label="Ẩn/hiện danh sách bài"><Ic n="menu"/></button>
      <a className="logo" href="#home">
        <svg width="30" height="30" viewBox="0 0 32 32"><path d="M16 3 28 9.5 16 16 4 9.5Z" fill="#cfe3b2" stroke="#1d1b18" strokeWidth="1.4" strokeLinejoin="round"/><path d="M4 9.5V14L16 20.5V16Z" fill="#b2d491" stroke="#1d1b18" strokeWidth="1.4" strokeLinejoin="round"/><path d="M28 9.5V14L16 20.5V16Z" fill="#7fc278" stroke="#1d1b18" strokeWidth="1.4" strokeLinejoin="round"/><path d="M4 17.5 16 24l12-6.5V22L16 28.5 4 22Z" fill="#e7ddf5" stroke="#1d1b18" strokeWidth="1.4" strokeLinejoin="round"/></svg>
        <span>Design <mark>Patterns</mark></span>
      </a>
      <nav className="tabs">
        {tabs.map(([k,icn,label,href])=>(
          <a key={k} className={"tab"+(active===k?" on":"")} href={href}>
            {active===k && <motion.span layoutId="tabpill" className="tabpill" transition={{type:"spring", stiffness:420, damping:34}}/>}
            <Ic n={icn}/><span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="spacer"/>
      <Search/>
      <motion.button className="themebtn" onClick={onTheme} whileTap={{scale:.9}} aria-label={theme==="dark"?"Chuyển sang giao diện sáng":"Chuyển sang giao diện tối"} title={theme==="dark"?"Giao diện sáng":"Giao diện tối"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={theme} style={{display:"flex"}} initial={{rotate:-90,opacity:0,scale:.6}} animate={{rotate:0,opacity:1,scale:1}} exit={{rotate:90,opacity:0,scale:.6}} transition={{duration:.22}}>
            <Ic n={theme==="dark"?"sun":"moon"}/>
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </header>
  );
}

function Search(){
  const [q,setQ] = useState(""); const [open,setOpen]=useState(false); const [sel,setSel]=useState(0);
  const ref = useRef(null), inp = useRef(null);
  const hits = useMemo(()=>{ const n=norm(q.trim()); if(!n) return []; return P.filter(p=>norm(p.t+" "+p.tag+" "+GROUPS[p.g].vi+" "+p.g+" "+p.id+" "+MOB[p.id].a+" "+MOB[p.id].i+" "+MOB[p.id].f).includes(n)).slice(0,10); },[q]);
  useEffect(()=>{
    const k = e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); inp.current.focus(); } else if(e.key==="/" && e.target.tagName!=="INPUT"){ e.preventDefault(); inp.current.focus(); } };
    const c = e=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown",k); document.addEventListener("click",c);
    return ()=>{ document.removeEventListener("keydown",k); document.removeEventListener("click",c); };
  },[]);
  const pick = p=>{ go(p.id+"-1"); setQ(""); setOpen(false); inp.current.blur(); };
  return (
    <div className="search" ref={ref}>
      <label><Ic n="search"/><input ref={inp} value={q} placeholder="Tìm bài học & khái niệm…" autoComplete="off"
        onChange={e=>{setQ(e.target.value); setSel(0); setOpen(true);}} onFocus={()=>setOpen(true)}
        onKeyDown={e=>{ if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); if(hits.length) setSel(s=>(s+(e.key==="ArrowDown"?1:hits.length-1))%hits.length); }
          if(e.key==="Enter"&&hits[sel]) pick(hits[sel]); if(e.key==="Escape"){ setQ(""); setOpen(false); e.target.blur(); } }}/><kbd>⌘K</kbd></label>
      <AnimatePresence>
        {open && q.trim() && (
          <motion.div className="results show" initial={{opacity:0,y:-6,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6}} transition={{duration:.15}}>
            {hits.length ? hits.map((p,i)=>(
              <a key={p.id} className={i===sel?"sel":""} href={"#"+p.id+"-1"} onClick={e=>{e.preventDefault(); pick(p);}}><b>{p.t}</b><small>{GROUPS[p.g].vi} · {p.tag.slice(0,70)}…</small></a>
            )) : <div className="empty">Không tìm thấy “{q}”</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ mode, setMode, visited, done, mods, curPid, onPick }){
  const curMod = curPid ? mods.find(m=>m.items.some(p=>p.id===curPid))?.key : null;
  const [openKey,setOpenKey] = useState(curMod || mods[0].key);
  useEffect(()=>{ if(curMod) setOpenKey(curMod); },[curMod, mode]);
  const total=P.length, dn=P.filter(done).length;
  return (<>
    <div className="side-h"><Ic n="folder"/>Khóa học<span>{total} bài</span></div>
    <div className="seg">
      {[["group","Chủ đề"],["mobile","📱 Mobile"]].map(([k,l])=>(
        <button key={k} className={mode===k?"on":""} onClick={()=>setMode(k)}>
          {mode===k && <motion.span layoutId="segpill" className="segpill" transition={{type:"spring",stiffness:420,damping:34}}/>}<span style={{position:"relative"}}>{l}</span>
        </button>))}
    </div>
    <div className="side-scroll">
      <LayoutGroup id="sidebar">
      {mods.map(m=>{
        const open = openKey===m.key;
        return (
          <div key={m.key} className={"mod"+(open?" open":"")}>
            <button className="mod-h" onClick={()=>setOpenKey(open?null:m.key)}>
              <motion.span animate={{rotate:open?90:0}} style={{display:"flex"}} transition={{duration:.2}}><Ic n="chev" className="chev"/></motion.span>
              <i className="fold" style={{background:m.col}}/><span className="mt">{pad(m.num)}. {m.title}</span>
              <span className="cnt">{m.items.filter(done).length}/{m.items.length}</span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div className="mod-items" style={{display:"block",overflow:"hidden"}}
                  initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.25,ease:[.4,0,.2,1]}}>
                  {m.items.map(p=>(
                    <a key={p.id} href={"#"+p.id+"-1"} title={p.t} onClick={onPick}
                      className={"les"+(curPid===p.id?" on":"")+(done(p)?" done":"")}>
                      {curPid===p.id && <motion.span layoutId="lespill" className="lespill" transition={{type:"spring",stiffness:380,damping:32}}/>}
                      <i className="fi"/><span className="nm">{short(p.t)}</span>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      </LayoutGroup>
    </div>
    <div className="prog"><div className="prog-h">TIẾN ĐỘ<span>{dn} / {total}</span></div>
      <div className="bar"><motion.i initial={false} animate={{width:(dn/total*100)+"%"}} transition={{type:"spring",stiffness:120,damping:20}}/></div></div>
  </>);
}

/* ---------------- Lesson ---------------- */
function Lesson({ p, si, visited, mods, order, focus, setFocus, theme }){
  const st = p.steps[si], N = p.steps.length;
  const mod = mods.find(m=>m.items.includes(p)), inMod = mod.items.indexOf(p), idx = order.indexOf(p);
  const [paused,setPaused] = useState(false);
  const [runKey,setRunKey] = useState(0);
  const [showCode,setShowCode] = usePersist("dp3-code",false);
  const narrow = useMedia("(max-width:1240px)");
  const phone = useMedia("(max-width:900px)");
  const seen = p.steps.filter((_,i)=>visited.has(p.id+"-"+(i+1))).length;
  const prev = si>0 ? `${p.id}-${si}` : (idx>0 ? `${order[idx-1].id}-${order[idx-1].steps.length}` : null);
  const next = si<N-1 ? `${p.id}-${si+2}` : (idx<order.length-1 ? `${order[idx+1].id}-1` : "home");
  const nextLbl = si<N-1 ? `Tiếp: ${p.steps[si+1].t}` : (idx<order.length-1 ? `Bài tiếp: ${short(order[idx+1].t)}` : "Hoàn thành khóa học 🎉");
  const replay = useCallback(()=>{ setPaused(false); setRunKey(k=>k+1); },[]);
  useEffect(()=>{ setPaused(false); },[p.id, si]);
  useEffect(()=>{
    const k = e=>{
      if (e.target.tagName==="INPUT") return;
      if (e.key==="ArrowRight" && next) go(next);
      else if (e.key==="ArrowLeft" && prev) go(prev);
      else if (e.key==="r"||e.key==="R") replay();
      else if (e.key===" "){ e.preventDefault(); setPaused(v=>!v); }
      else if (e.key==="f"||e.key==="F") setFocus(v=>!v);
    };
    document.addEventListener("keydown",k); return ()=>document.removeEventListener("keydown",k);
  },[next, prev, replay]);
  const tag = st.tag || (si===0 ? "VẤN ĐỀ" : "KỸ THUẬT");
  const stageH = phone ? "auto" : focus ? "clamp(420px, calc(100vh - 300px), 760px)" : "clamp(400px, calc(100vh - 320px), 680px)";

  const stepCard = (
    <div className={"card stepcard"+(narrow?" inline":"")}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={p.id+si} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-14}} transition={{duration:.22,ease:"easeOut"}}>
          <div className="sc-h">BƯỚC {si+1} / {N}<span className={"tagb tag-"+tag.replace(/\s/g,"")}>{tag}</span></div>
          <h2>{st.t}</h2>
          {st.p.map((t,i)=><motion.p key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:.06+i*.07}} {...html(t)}/>)}
          {st.key && <motion.div className="callout" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{delay:.2}}><span className="ic"><Ic n="bulb"/></span><div><small>GHI NHỚ</small><span {...html(st.key)}/></div></motion.div>}
        </motion.div>
      </AnimatePresence>
      <div className="navb">
        <button className="btn" disabled={!prev} onClick={()=>prev&&go(prev)}><Ic n="left"/>Lùi</button>
        <motion.button className="btn next" whileHover={{y:-1}} whileTap={{y:1.5, boxShadow:"0 0 0 #1d1b18"}} onClick={()=>go(next)}>
          <span className="nl">{nextLbl}</span><Ic n="right"/></motion.button>
      </div>
      <div className="hints"><span className="kb">←</span><span className="kb">→</span> chuyển bước · <span className="kb">R</span> phát lại · <span className="kb">Space</span> dừng · <span className="kb">F</span> phóng to</div>
    </div>
  );

  const mb = MOB[p.id];
  return (
    <div className={"lgrid"+(focus&&!narrow?" focus":"")}>
      <section className="card center">
        <div className="crumb"><a href="#home">{pad(mod.num)}. {mod.full}</a><span>/</span><span>Bài {inMod+1} / {mod.items.length}</span></div>
        <div className="trow"><h1>{p.t}</h1>
          <div className="badges"><span className="badge b-amber"><Ic n="clock"/>{MINS(p)} phút</span><span className="badge b-green"><Ic n="signal"/>{LEVEL(p)}</span><span className="badge b-violet"><Ic n="list"/>{N} bước</span></div></div>
        <p className="subt">{p.tag}</p>
        <div className="stage">
          <div className="stage-top">
            <div className="chip"><small><Ic n="layers" s={11}/>Chủ đề</small><b>{GROUPS[p.g].en}</b></div>
            <div className="chip"><small><Ic n="phone" s={11}/>Mobile</small><b>{TIERS[mb.t].n}</b></div>
            <div className="chip"><small><Ic n="target" s={11}/>Đã xem</small><b>{seen} / {N}</b></div>
            <div className="chip hl"><small><Ic n="list" s={11}/>Bước</small><AnimatePresence mode="popLayout" initial={false}><motion.b key={si} initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-10,opacity:0}}>{si+1} / {N}</motion.b></AnimatePresence></div>
            <div className="sbtns">
              <motion.button className="sbtn" whileTap={{scale:.94}} onClick={replay} title="Phát lại (R)"><Ic n="replay"/>Phát lại</motion.button>
              <motion.button className="sbtn" whileTap={{scale:.94}} onClick={()=>setPaused(v=>!v)} title="Tạm dừng (Space)"><Ic n={paused?"play":"pause"}/>{paused?"Chạy":"Dừng"}</motion.button>
              {!narrow && <motion.button className="sbtn" whileTap={{scale:.94}} onClick={()=>setFocus(v=>!v)} title="Phóng to (F)"><Ic n={focus?"shrink":"expand"}/>{focus?"Thu nhỏ":"Phóng to"}</motion.button>}
            </div>
          </div>
          <Diagram st={st} stepKey={p.id+"-"+si} paused={paused} runKey={runKey} theme={theme}/>
          <div className="legend"><span><i style={{background:"#e8834d"}}/>luồng gọi</span><span><i style={{background:"#7fc278"}}/>kết quả / hợp lệ</span><span><em/>phụ thuộc · kế thừa</span></div>
        </div>
        <Stepper p={p} si={si} visited={visited}/>
        {narrow && stepCard}
        <div className="codecard">
          <button className="code-h" onClick={()=>setShowCode(v=>!v)}><Ic n="code"/>CODE<span>· {langOf(st.code||"")}</span>
            <span className="tg">{showCode?"Ẩn code ▲":"Xem code ▼"}</span>
            <span className="copyb" role="button" onClick={e=>{ e.stopPropagation(); const b=e.currentTarget; navigator.clipboard?.writeText(st.code).then(()=>{b.textContent="Đã copy";},()=>{b.textContent="Lỗi copy";}); setTimeout(()=>b.textContent="Copy",1400); }}>Copy</span></button>
          <AnimatePresence initial={false}>
            {showCode && <motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} transition={{duration:.28,ease:[.4,0,.2,1]}} style={{overflow:"hidden"}}>
              <pre {...html(highlight(st.code||""))}/></motion.div>}
          </AnimatePresence>
        </div>
      </section>
      <motion.aside className="right" layout transition={{type:"spring",stiffness:300,damping:30}}>
          {!narrow && stepCard}
          <AnimatePresence initial={false}>
          {!(focus&&!narrow) && <motion.div key="extra" className="extra" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}} transition={{duration:.2}}>
          <div className="card minic"><h3><Ic n="check"/>BẠN SẼ HỌC</h3>
            {p.steps.map((s,i)=>{ const v=visited.has(p.id+"-"+(i+1)); return (
              <div key={i} className={"chk"+(v?" done":"")+(i===si?" cur":"")} onClick={()=>go(p.id+"-"+(i+1))}>
                <i>{v && <motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:500,damping:15}}>✓</motion.span>}</i>{s.t}</div>); })}
          </div>
          <div className="card minic"><h3><Ic n="phone"/>TRÊN MOBILE</h3><p className="why">{mb.why}.</p>
            <dl className="mobl"><dt>Android</dt><dd>{mb.a}</dd><dt>iOS</dt><dd>{mb.i}</dd><dt>Flutter</dt><dd>{mb.f}</dd></dl></div>
          <div className="card minic"><h3><Ic n="target"/>KHI NÀO DÙNG</h3><ul className="uses yes">{p.when.map((x,i)=><li key={i}>{x}</li>)}</ul>
            <h3 style={{marginTop:10}}>CÂN NHẮC KHI</h3><ul className="uses no">{p.avoid.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
          </motion.div>}
          </AnimatePresence>
      </motion.aside>
    </div>
  );
}

function Stepper({ p, si, visited }){
  const N = p.steps.length;
  return (
    <div className="stepper"><div className="st-h">TRONG BÀI NÀY<span>Bước {si+1} / {N}</span></div>
      <div className="steps">
        <div className="track"><motion.div className="fill" initial={false} animate={{width: N>1 ? (si/(N-1)*100)+"%" : "0%"}} transition={{type:"spring",stiffness:160,damping:24}}/></div>
        {p.steps.map((s,i)=>(
          <a key={i} className={"sp"+(i===si?" on":visited.has(p.id+"-"+(i+1))?" done":"")} href={"#"+p.id+"-"+(i+1)}>
            <span className="c">{i===si && <motion.span layoutId={"stepdot-"+p.id} className="cdot" transition={{type:"spring",stiffness:380,damping:28}}/>}<span style={{position:"relative"}}>{i+1}</span></span>
            <span className="l">{s.t}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
const listV = { hidden:{}, show:{ transition:{ staggerChildren:.04 } } };
const itemV = { hidden:{ opacity:0, y:10 }, show:{ opacity:1, y:0, transition:{ type:"spring", stiffness:260, damping:24 } } };
function Home({ setMode, done, order }){
  const nOOP=P.filter(p=>p.g==="OOP").length, nS=P.filter(p=>p.g==="SOLID").length;
  let n=0;
  return (
    <div className="page">
      <motion.div className="card hero" variants={itemV} initial="hidden" animate="show">
        <div className="eyebrow">Khóa học tương tác · tiếng Việt</div>
        <h1>OOP → SOLID → Design Patterns</h1>
        <p>{nOOP} bài OOP, {nS} nguyên lý SOLID và đủ {P.length-nOOP-nS} design pattern của Gang of Four. Mỗi bài bắt đầu từ <b>một vấn đề thực tế</b>, rồi bạn bấm qua từng bước để xem lời giải được dựng lên trên sơ đồ động. Mỗi bài có code mẫu và ví dụ trên Android, iOS và Flutter.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <motion.a whileHover={{y:-2}} className="btn next" style={{flex:"none",minWidth:200}} href={"#"+order[0].id+"-1"}>Bắt đầu học <Ic n="right"/></motion.a>
          <a className="btn" href="#cheatsheet"><Ic n="grid"/> Xem cheatsheet</a></div>
      </motion.div>
      <div className="sect"><Ic n="phone"/> Lộ trình cho Mobile dev</div>
      <p className="sectd">Thứ tự gợi ý cho lập trình viên Android, iOS và Flutter. Bấm vào một bài để học theo đúng thứ tự này.</p>
      <motion.div className="road" variants={listV} initial="hidden" animate="show">
        {[0,1,2,3].map(t=>{ const ids=ROAD.filter(id=>MOB[id].t===t); const start=n+1; n+=ids.length; return (
          <motion.div key={t} variants={itemV} className="card tier" style={{borderTopColor:TIERS[t].col}}>
            <div className="tier-h"><b>{pad(t)}. {TIERS[t].n}</b><span>{ids.length} bài</span></div><p>{TIERS[t].d}</p>
            <ol start={start}>{ids.map(id=><li key={id}><a href={"#"+id+"-1"} onClick={()=>setMode("mobile")}><b>{BYID[id].t}</b>{done(BYID[id])?" ✓":""}<span>{MOB[id].why}</span></a></li>)}</ol>
          </motion.div>); })}
      </motion.div>
      <div className="sect"><Ic n="layers"/> Theo chủ đề</div><p className="sectd">Học theo cách chia kinh điển.</p>
      <motion.div className="mods" variants={listV} initial="hidden" animate="show">
        {GROUP_KEYS.map((g,i)=>{ const items=P.filter(p=>p.g===g); return (
          <motion.div key={g} variants={itemV} whileHover={{y:-3}} className="card modc">
            <div className="modc-h"><i className="fold" style={{background:GROUPS[g].col}}/>{pad(i+1)}. {GROUPS[g].vi}<span>{items.filter(done).length}/{items.length}</span></div>
            <p>{GROUPS[g].d}</p>
            <div className="pills">{items.map(p=><a key={p.id} className={"pill"+(done(p)?" done":"")} href={"#"+p.id+"-1"} onClick={()=>setMode("group")}>{short(p.t)}</a>)}</div>
          </motion.div>); })}
      </motion.div>
    </div>
  );
}

/* ---------------- Cheatsheet ---------------- */
function Cheatsheet(){
  const [f,setF] = useState("all");
  const list = P.filter(p=>f==="all"||p.g===f);
  return (
    <div className="page">
      <div className="card hero" style={{padding:"16px 20px"}}><div className="eyebrow">Tra cứu nhanh</div><h1 style={{fontSize:24}}>Cheatsheet</h1>
        <p style={{marginBottom:0}}>Ý chính của toàn bộ {P.length} bài trên một trang, kèm mức ưu tiên cho mobile. Bấm vào một dòng để mở bài.</p></div>
      <div className="card" style={{marginTop:12,overflow:"hidden"}}>
        <div className="csbar">{["all",...GROUP_KEYS].map(g=>(
          <button key={g} className={f===g?"on":""} onClick={()=>setF(g)}>{f===g && <motion.span layoutId="cspill" className="cspill" transition={{type:"spring",stiffness:420,damping:34}}/>}<span style={{position:"relative"}}>{g==="all"?"Tất cả":GROUPS[g].vi}</span></button>))}</div>
        <table className="cs"><thead><tr><th>#</th><th>BÀI</th><th className="d">NHÓM</th><th>Ý CHÍNH</th><th className="d">MOBILE</th></tr></thead>
          <tbody><AnimatePresence initial={false}>{list.map(p=>{ const t=MOB[p.id].t; return (
            <motion.tr key={p.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>go(p.id+"-1")} style={{cursor:"pointer"}}>
              <td className="n">{pad(ORDER_ALL.indexOf(p.id)+1)}</td><td className="t">{p.t}</td>
              <td className="d"><span className="gtag"><i className="fold" style={{background:GROUPS[p.g].col}}/>{GROUPS[p.g].en}</span></td>
              <td>{p.tag}</td><td className="d"><span className="gtag"><i className={"td t"+t}/>{TIERS[t].n}</span></td></motion.tr>); })}</AnimatePresence></tbody></table>
      </div>
    </div>
  );
}
