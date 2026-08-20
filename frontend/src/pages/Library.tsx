import { useMemo, useState } from "react";
import { CONTENT_POOL } from "../data/contentPool";
import { loadManualPicks, saveManualPicks, loadDailyChecks, saveDailyChecks, todayStr, loadCollections, saveCollections, loadProfile } from "../lib/storage";
import { speak } from "../lib/plan";
export default function Library(){
  const profile=loadProfile();
  const termPhase=(profile as any)?.termPhase ?? "in_term";
  const previewTarget=(profile as any)?.previewTargetGrade ?? 2;
  const gradeKey=profile? (termPhase==="preview" && previewTarget ? `g${previewTarget}` : `g${profile.grade}`):"g1";
  const [subject,setSubject]=useState("全部"); const [theme,setTheme]=useState("全部"); const [q,setQ]=useState("");
  const [onlyPreview,setOnlyPreview]=useState(false);
  const subjects=["全部","语文","数学","英语","运动健康","素质劳动"];
  const themes=useMemo(()=>{ const s=new Set(CONTENT_POOL.filter(c=> subject==="全部"||c.subject===subject).map(c=>c.theme)); return ["全部", ...Array.from(s)]; },[subject]);
  const list=useMemo(()=> CONTENT_POOL.filter(c=>{
    if(c.subject==="观察提醒") return false;
    if(c.gradeKey!==gradeKey) return false;
    if(onlyPreview && !c.preview) return false;
    if(subject!=="全部" && c.subject!==subject) return false;
    if(theme!=="全部" && c.theme!==theme) return false;
    if(q && !c.title.includes(q) && !c.how.includes(q)) return false;
    return true;
  }).slice(0,120), [gradeKey,subject,theme,q,onlyPreview]);
  function addToday(id:string){ const d=todayStr(); const mp=loadManualPicks(); const cur=mp[d]??[]; if(cur.includes(id)) return alert("已在今日"); cur.push(id); mp[d]=cur; saveManualPicks(mp); const dc=loadDailyChecks(); if(!dc[d]) dc[d]={date:d, checks:{}, manualPicks:[], repeatable:true} as any; dc[d].manualPicks=cur; saveDailyChecks(dc); alert("已加入今日"); }
  function collect(id:string){ const col=loadCollections(); if(col.includes(id)) return alert("已收藏"); col.push(id); saveCollections(col); alert("已收藏"); }
  return (<div className="page"><h2>活动库 · {gradeKey} {termPhase==="preview" && <span className="badge">预习</span>}</h2>
    <div className="filters"><select value={subject} onChange={e=>{setSubject(e.target.value); setTheme("全部");}}>{subjects.map(s=> <option key={s} value={s}>{s}</option>)}</select><select value={theme} onChange={e=>setTheme(e.target.value)}>{themes.map(t=> <option key={t} value={t}>{t}</option>)}</select><input placeholder="搜索标题/玩法" value={q} onChange={e=>setQ(e.target.value)} />
      <label className="check"><input type="checkbox" checked={onlyPreview} onChange={e=>setOnlyPreview(e.target.checked)} />仅看预习</label>
    </div>
    <p className="muted">{termPhase==="preview" ? `预习态：显示${previewTarget}年级上学期前4单元预习内容` : "学期同步态：按当前年级内容，校准后已教转巩固"} · 筛选后可“加入今日”</p>
    <div className="grid">{list.map(it=> (<div key={it.id} className="card small"><b>{it.title}</b> <span className="muted">· {it.subject}·{it.theme}·{it.duration}{it.preview?"·预习":""}{it.unit?`·第${it.unit}单元`:""}</span><div className="how">{it.how}</div><div className="muted">材料：{it.materials}</div><div className="row"><button onClick={()=>addToday(it.id)}>加入今日</button><button onClick={()=>collect(it.id)}>收藏</button>{it.subject==="英语" && <button onClick={()=>speak(it.how)}>🔊</button>}</div></div>))}{list.length===0 && <div className="muted">无结果，试试换个年级或主题，或关闭“仅看预习”。</div>}</div></div>);
}