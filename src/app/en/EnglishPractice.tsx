"use client";
import { useState } from "react";
import styles from "@/app/nasil-oynanir/guide.module.css";
const boards = [
  [{ title: "Fruit", words: ["APPLE","PEAR","PLUM","PEACH"] }, { title: "Musical instruments", words: ["PIANO","FLUTE","HARP","DRUM"] }, { title: "Weather", words: ["RAIN","FOG","SNOW","HAIL"] }, { title: "Things with a key", words: ["LOCK","MAP","KEYBOARD","CIPHER"] }],
  [{ title: "Birds", words: ["SWAN","ROBIN","EAGLE","HERON"] }, { title: "Writing tools", words: ["PENCIL","PEN","MARKER","CRAYON"] }, { title: "Planets", words: ["MARS","VENUS","SATURN","NEPTUNE"] }, { title: "Swimming strokes", words: ["CRAWL","BREASTSTROKE","BACKSTROKE","BUTTERFLY"] }],
  [{ title: "Kitchen utensils", words: ["WHISK","LADLE","SPATULA","TONGS"] }, { title: "Trees", words: ["OAK","PINE","ELM","MAPLE"] }, { title: "Clothing", words: ["COAT","SKIRT","SOCK","SHIRT"] }, { title: "Shapes", words: ["CIRCLE","OVAL","SQUARE","TRIANGLE"] }],
] as const;
const order = [5,0,11,14,2,7,12,9,15,4,1,10,6,13,8,3];
export function EnglishPractice() {
  const [board,setBoard] = useState(0);
  const [selected,setSelected] = useState<string[]>([]);
  const [solved,setSolved] = useState<number[]>([]);
  const [mistakes,setMistakes] = useState(0);
  const [message,setMessage] = useState("");
  const groups = boards[board]!;
  const words = order.map(i => groups.flatMap(g => [...g.words])[i]!);
  const done = solved.length === 4 || mistakes >= 4;
  function reset(next: number) { setBoard(next); setSelected([]); setSolved([]); setMistakes(0); setMessage(""); }
  function submit() {
    if (done || selected.length !== 4) return;
    const match = groups.findIndex(g => selected.every(w => (g.words as readonly string[]).includes(w)));
    if (match >= 0 && !solved.includes(match)) { setSolved(s => [...s,match]); setMessage("Correct connection!"); }
    else { setMistakes(n => n+1); setMessage("Not quite. Try another connection."); }
    setSelected([]);
  }
  async function share() {
    const text = "Quadro English practice " + (board+1) + ": " + solved.length + "/4 connections. Try it: https://playquadro.com.tr/en?utm_source=player_share&utm_medium=referral&utm_campaign=english_practice";
    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); setMessage("Shared or copied!"); } catch { setMessage(text); }
  }
  return <section className={styles.panel}><h2>Practice board {board+1} / {boards.length}</h2>
    <p>Mistakes remaining: {4-mistakes} · Groups solved: {solved.length}/4</p>
    {solved.map(i => <p key={i}><strong>{groups[i]!.title}:</strong> {groups[i]!.words.join(" · ")}</p>)}
    {!done && <><div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:6, margin:"16px 0" }}>
      {words.filter(w => !solved.some(i => (groups[i]!.words as readonly string[]).includes(w))).map(w => <button key={w} type="button" aria-pressed={selected.includes(w)} onClick={() => setSelected(s => s.includes(w) ? s.filter(x=>x!==w) : s.length < 4 ? [...s,w] : s)} style={{ minHeight:52, fontSize:"clamp(10px,2.8vw,16px)", overflowWrap:"anywhere", background:selected.includes(w)?"#f2cf62":"#fff", color:"#20242d", border:"2px solid #629ad1", borderRadius:8, padding:3 }}>{w}</button>)}
    </div><button type="button" onClick={submit} disabled={selected.length!==4}>Submit group</button>{" "}<button type="button" onClick={()=>setSelected([])}>Clear</button></>}
    {done && <><h3>{solved.length === 4 ? "Well done!" : "Board complete — answers"}</h3>{groups.filter((_,i)=>!solved.includes(i)).map(g=><p key={g.title}>{g.title}: {g.words.join(" · ")}</p>)}<p><button type="button" onClick={()=>void share()}>Share score</button></p></>}
    <p style={{ marginTop:16 }} role="status">{message}</p>
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:16 }}><button type="button" onClick={()=>reset(board)}>Restart</button><button type="button" onClick={()=>reset((board+1)%boards.length)}>Next board</button></div>
  </section>;
}
