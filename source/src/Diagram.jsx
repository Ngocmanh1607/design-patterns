import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

const PAL = {
  light:{
    COL:{ def:["#faf3e9","#e2d6c5","#1d1b18"], violet:["#ece4f8","#c3b0e8","#1d1b18"], green:["#dcefd2","#a6d38b","#1d1b18"],
      blue:["#d6e5f6","#98bfe6","#1d1b18"], accent:["#fcdcbd","#eba87a","#1d1b18"], gold:["#fde3a7","#e3ae3c","#1d1b18"],
      warn:["#f8d5cf","#e79a90","#1d1b18"], muted:["#efe7dc","#d5cabb","#8b847a"] },
    ECOL:{def:"#46413b",accent:"#b8602f",blue:"#1f63a0",green:"#2a7a3d",warn:"#c0392b",gold:"#a5650c",muted:"#a69d91",violet:"#5a43a6"},
    PCOL:{def:"#e8834d",accent:"#e8834d",blue:"#5aa0e0",green:"#7fc278",warn:"#e5534b",gold:"#e3ae3c",muted:"#c5bcb0",violet:"#9b84e0"},
    stroke:"#1d1b18", drop:"#1d1b18", pill:"#fbf7f1", pillText:"#1d1b18", sub:"#6f6961", grid:"#e4d9ca", shadow:["#503c23",.1], hi:.7
  },
  dark:{
    COL:{ def:["#2c2823","#1c1a16","#f1e8dc"], violet:["#3a3152","#251f38","#f1e8dc"], green:["#2c4123","#1b2a15","#f1e8dc"],
      blue:["#21364d","#142335","#f1e8dc"], accent:["#4d3220","#331f12","#f1e8dc"], gold:["#4b3c16","#31270c","#f1e8dc"],
      warn:["#4d2723","#331714","#f1e8dc"], muted:["#24211d","#1c1a16","#857d72"] },
    ECOL:{def:"#cfc4b5",accent:"#ef9a66",blue:"#6aa8e6",green:"#8fcf86",warn:"#ef6a60",gold:"#e8b94f",muted:"#6f675e",violet:"#ab96ec"},
    PCOL:{def:"#ef9a66",accent:"#ef9a66",blue:"#6aa8e6",green:"#8fcf86",warn:"#ef6a60",gold:"#e8b94f",muted:"#6f675e",violet:"#ab96ec"},
    stroke:"#a89e91", drop:"#000", pill:"#24211d", pillText:"#f1e8dc", sub:"#a39a8e", grid:"#26231f", shadow:["#000",.45], hi:.08
  }
};
const DEPTH = 7;
const SPRING = { type:"spring", stiffness:140, damping:20, mass:0.9 };

const textW = (s, px) => [...s].reduce((w,ch)=> w + (/\p{Extended_Pictographic}/u.test(ch) ? px*1.25 : px*0.6), 0);
export function nodeSize(n){
  if (n.k==="note") return { w: n.w || Math.max(90, textW(n.l,13)+34), h:32 };
  return { w:n.w||160, h:n.s?60:50 };
}

function clip(cx,cy,w,h,dx,dy,pad){
  const t = Math.min(dx?(w/2)/Math.abs(dx):Infinity, dy?(h/2)/Math.abs(dy):Infinity);
  const L = Math.hypot(dx,dy)||1;
  return [cx+dx*t+dx/L*pad, cy+dy*t+dy/L*pad];
}
function geom(e, pos){
  const A=pos[e.f], B=pos[e.t]; if(!A||!B) return null;
  const sa=nodeSize(A), sb=nodeSize(B);
  const ay=A.y+4+(A.k==="note"?0:DEPTH/2), by=B.y+4+(B.k==="note"?0:DEPTH/2);
  const ha=sa.h+(A.k==="note"?0:DEPTH), hb=sb.h+(B.k==="note"?0:DEPTH);
  const mx=(A.x+B.x)/2, my=(ay+by)/2, dx=B.x-A.x, dy=by-ay, L=Math.hypot(dx,dy)||1;
  const bend=e.b||0, cx=mx+(-dy/L)*bend, cy=my+(dx/L)*bend;
  const p0=clip(A.x,ay,sa.w,ha,cx-A.x,cy-ay,4), p1=clip(B.x,by,sb.w,hb,cx-B.x,cy-by,8);
  const c = bend ? [cx,cy] : [(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];
  return { p0, c, p1, d:`M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${p1[0]},${p1[1]}`, mid:[.25*p0[0]+.5*c[0]+.25*p1[0], .25*p0[1]+.5*c[1]+.25*p1[1]] };
}

function NodeBody({ n, T }){
  const { w, h } = nodeSize(n);
  if (n.k==="note") return (<>
    <rect x={-w/2+1.5} y={-h/2+2.5} width={w} height={h} rx={h/2} fill={T.drop}/>
    <rect x={-w/2} y={-h/2} width={w} height={h} rx={h/2} fill={T.pill} stroke={T.stroke} strokeWidth={1.5}/>
    <text x={0} y={4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={T.pillText}>{n.l}</text>
  </>);
  const c = T.COL[n.k||"def"]||T.COL.def, dash = n.k==="muted" ? "5 4" : undefined;
  return (<>
    <rect x={-w/2+3} y={-h/2+DEPTH+6} width={w} height={h} rx={12} fill={T.shadow[0]} opacity={T.shadow[1]}/>
    <rect x={-w/2} y={-h/2+DEPTH} width={w} height={h} rx={12} fill={c[1]} stroke={T.stroke} strokeWidth={1.5} strokeDasharray={dash}/>
    <rect x={-w/2} y={-h/2} width={w} height={h} rx={12} fill={c[0]} stroke={T.stroke} strokeWidth={1.5} strokeDasharray={dash}/>
    <path d={`M${-w/2+12} ${-h/2+1.6} H${w/2-12}`} stroke="#fff" opacity={T.hi} strokeWidth={1.4}/>
    <text x={0} y={n.s?-3:5} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={c[2]}>{n.l}</text>
    {n.s && <text x={0} y={15} textAnchor="middle" fontSize={10.5} fill={T.sub}>{n.s}</text>}
  </>);
}

function Node({ n, T }){
  return (
    <motion.g
      initial={{ opacity:0, scale:.6, x:n.x, y:n.y+14 }}
      animate={{ opacity:1, scale:1, x:n.x, y:n.y+4 }}
      exit={{ opacity:0, scale:.75, transition:{ duration:.25 } }}
      transition={SPRING}
      style={{ transformBox:"view-box", originX:0, originY:0 }}
    >
      <motion.g whileHover={{ y:-3 }} transition={{ type:"spring", stiffness:400, damping:20 }} style={{ cursor:"default" }}>
        <NodeBody n={n} T={T}/>
      </motion.g>
    </motion.g>
  );
}

/* các gói tin chạy dọc mũi tên — chạy bằng requestAnimationFrame cho mượt */
function Packets({ list, paused, runKey, stroke }){
  const refs = useRef([]);
  const pausedRef = useRef(paused);
  const offset = useRef(0);
  useEffect(()=>{ pausedRef.current = paused; }, [paused]);
  useEffect(()=>{
    let raf, start = performance.now()+950, pauseAt = 0, wasPaused = false;
    const hasSeq = list.some(p=>p.seq!==null);
    const maxSeq = Math.max(0,...list.map(p=>p.seq||0));
    const slot=1100, cycle=(maxSeq+1)*slot+700, TRAIL=4;
    const ease = x => x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2;
    const pt = (p,t)=>{ const u=1-t; return [u*u*p.p0[0]+2*u*t*p.c[0]+t*t*p.p1[0], u*u*p.p0[1]+2*u*t*p.c[1]+t*t*p.p1[1]]; };
    const tick = now=>{
      if (pausedRef.current){ if(!wasPaused){ pauseAt=now; wasPaused=true; } raf=requestAnimationFrame(tick); return; }
      if (wasPaused){ start += now-pauseAt; wasPaused=false; }
      const t = now-start;
      list.forEach((p,pi)=>{
        let prog=null;
        if (t>=0){
          if (!hasSeq) prog=((t/1800)+pi*.21)%1;
          else { const loc=(t%cycle)-p.seq*slot; if(loc>=0 && loc<=slot*.85) prog=ease(loc/(slot*.85)); }
        }
        for (let k=0;k<TRAIL;k++){
          const el = refs.current[pi*TRAIL+k]; if(!el) continue;
          if (prog===null){ el.setAttribute("opacity",0); continue; }
          const q = Math.max(0, prog - k*0.035);
          const [x,y] = pt(p,q);
          el.setAttribute("cx",x); el.setAttribute("cy",y);
          const fade = Math.min(1, prog*8, (1-prog)*8);
          el.setAttribute("opacity", (k===0?1:0.35/k) * fade);
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  }, [list, runKey]);
  return (<g>{list.flatMap((p,pi)=>[0,1,2,3].map(k=>(
    <circle key={pi+"-"+k} ref={el=>refs.current[pi*4+k]=el} r={k===0?5.5:5.5-k*1.1} fill={p.color}
      stroke={k===0?stroke:"none"} strokeWidth={1.4} opacity={0}/>
  )).reverse())}</g>);
}

export default function Diagram({ st, stepKey, paused, runKey, theme="light" }){
  const T = PAL[theme]||PAL.light, ECOL=T.ECOL, PCOL=T.PCOL;
  const pos = {}; st.n.forEach(n=>pos[n.i]=n);
  const hasSeq = st.e.some(e=>e.seq!==undefined);
  const edges = st.e.map((e,i)=>({ e, i, g:geom(e,pos), k:e.k||"def" })).filter(x=>x.g);
  const packets = edges.filter(x=>x.e.flow).map(x=>({ p0:x.g.p0, c:x.g.c, p1:x.g.p1, seq:hasSeq?(x.e.seq??0):null, color:PCOL[x.k] }));
  const ek = stepKey+"-"+runKey;
  return (
    <svg className="diagram" viewBox="0 0 800 450" role="img" aria-label="Sơ đồ minh họa">
      <defs>
        <pattern id="iso" width="46" height="26.56" patternUnits="userSpaceOnUse"><path d="M0 0 L46 26.56 M0 26.56 L46 0" stroke={T.grid} strokeWidth="1" fill="none"/></pattern>
        {Object.entries(ECOL).map(([k,c])=>(
          <marker key={k} id={"ar-"+theme+"-"+k} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>
        ))}
      </defs>
      <rect x="-400" y="-200" width="1600" height="850" fill="url(#iso)"/>
      <g key={"E"+ek}>
        {edges.map(({e,i,g,k})=> e.dash
          ? <motion.path key={i} d={g.d} fill="none" stroke={ECOL[k]} strokeWidth={1.8} strokeDasharray="6 5" markerEnd={`url(#ar-${theme}-${k})`} className="march"
              initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45, duration:.4}}/>
          : <motion.path key={i} d={g.d} fill="none" stroke={ECOL[k]} strokeWidth={1.8} markerEnd={`url(#ar-${theme}-${k})`}
              initial={{pathLength:0, opacity:0}} animate={{pathLength:1, opacity:1}} transition={{delay:.4+i*.05, duration:.65, ease:[.65,0,.35,1]}}/>
        )}
      </g>
      <g><AnimatePresence>{st.n.map(n=><Node key={n.i} n={n} T={T}/>)}</AnimatePresence></g>
      <Packets list={packets} paused={paused} runKey={ek} stroke={T.stroke}/>
      <g key={"L"+ek}>
        {edges.filter(x=>x.e.l).map(({e,i,g,k})=>{
          const w = textW(e.l,11)+14, [lx,ly]=g.mid;
          return (
            <motion.g key={i} initial={{opacity:0, scale:.7}} animate={{opacity:1, scale:1}} transition={{delay:.85+i*.04, type:"spring", stiffness:300, damping:18}}
              style={{ transformBox:"fill-box", originX:.5, originY:.5 }}>
              <rect x={lx-w/2+1} y={ly-10.5} width={w} height={19} rx={7} fill={T.drop}/>
              <rect x={lx-w/2} y={ly-12} width={w} height={19} rx={7} fill={T.pill} stroke={T.stroke} strokeWidth={1.2}/>
              <text x={lx} y={ly+1.8} textAnchor="middle" fontSize={11} fontWeight={600} fill={k==="def"||k==="muted"?T.pillText:ECOL[k]}>{e.l}</text>
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}
