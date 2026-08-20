import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { buildDailyPlan, speak } from "../lib/plan";
import { loadDailyChecks, loadManualPicks, loadProfile, saveDailyChecks, saveManualPicks, todayStr, loadCalibrations } from "../lib/storage";
import type { StudentProfile } from "../lib/types";

export default function Today(){
  const [profile,setProfile]=useState<StudentProfile | null>(()=>loadProfile());
  const [dateStr]=useState(todayStr());
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const [manualIds,setManualIds]=useState<string[]>([]);
  const [tick,setTick]=useState(0);
  useEffect(()=>{ const dc=loadDailyChecks()[dateStr]; if(dc) setChecks(dc.checks??{}); const mp=loadManualPicks()[dateStr]; if(mp) setManualIds(mp); },[dateStr,tick]);
  useEffect(()=>{
    const h=()=>{ const p=loadProfile(); setProfile(p); setTick(x=>x+1); };
    window.addEventListener("study:profile-changed", h as any);
    window.addEventListener("study:calibrations-changed", h as any);
    return ()=>{ window.removeEventListener("study:profile-changed", h as any); window.removeEventListener("study:calibrations-changed", h as any); };
  },[]);
  const plan=useMemo(()=>{
    if(!profile) return null;
    const cals=loadCalibrations();
    const termPhase=(profile as any).termPhase ?? "in_term";
    return buildDailyPlan({
      grade:profile.grade, dateStr,
      textbook: profile.textbook as any,
      enableEnglish:profile.enableEnglish, enableQuality:profile.enableQuality,
      termPhase,
      previewUnits:(profile as any).previewUnits,
      calibrations:cals, dailyChecks:checks, manualIds
    });
  },[profile,dateStr,checks,manualIds,tick]);
  function toggle(id:string){ const next={...checks,[id]:!checks[id]}; if(!next[id]) delete next[id]; setChecks(next); const all=loadDailyChecks(); all[dateStr]={date:dateStr,checks:next,manualPicks:manualIds,repeatable:true} as any; saveDailyChecks(all); setTick(x=>x+1); }
  function removeManual(id:string){ const next=manualIds.filter(x=>x!==id); setManualIds(next); const mp=loadManualPicks(); mp[dateStr]=next; saveManualPicks(mp); const all=loadDailyChecks(); if(all[dateStr]){ all[dateStr].manualPicks=next; saveDailyChecks(all);} setTick(x=>x+1); }
  if(!profile) return (<div className="empty">请先到“档案”设置年级与教材。<Link to="/profile">去设置</Link></div>);
  if(!plan) return null;
  const isPreview=plan.termPhase==="preview";
  const calText=plan.calibrations && plan.calibrations.length>0 ? plan.calibrations.map(c=>`${c.subject}第${c.currentUnit}单元`).join(" · ") : "未校准（按教材默认）";
  const preText=plan.previewUnits ? Object.entries(plan.previewUnits).map(([k,v])=>`${k}第${v}单元`).join(" · ") : "";
  return (<div className="page"><div className="page-head"><h2>今日 · {dateStr} {isPreview && <span className="badge preview">预习</span>}</h2>
    <div className="sub">{profile.nickname} · {profile.grade}年级{profile.semester}学期 · {profile.textbook.chinese}/{profile.textbook.math}/{profile.textbook.english}</div>
    <div className="muted">{isPreview ? `预习进度：${preText} · 顶部可按学科各拨 1-4 单元` : `校准：${calText}`} </div>
  </div>
  {plan.manualItems.length>0 && (<section className="card highlight"><h3>今日加入（手工）</h3>{plan.manualItems.map(it=> (<div key={it.id} className="item"><label><input type="checkbox" checked={!!checks[it.id]} onChange={()=>toggle(it.id)} /> <b>{it.title}</b> <span className="muted">· {it.duration}</span></label><div className="how">{it.how} <span className="muted">｜材料：{it.materials}</span></div>
            {it.detail?.chars && <div className="detail-grid">{it.detail.chars.map(c=> <span key={c.char} className="char-chip"><b>{c.char}</b><small>{c.pinyin}</small><small className="muted">{c.words.join(" / ")}</small></span>)}</div>}
            {it.detail?.problems && <div className="problem-list">{it.detail.problems.map((p,i)=> <div key={i} className="problem-row"><span>{p.q}</span><details className="answer"><summary>答案</summary>{p.a}</details></div>)}</div>}
            {it.detail?.vocab && <div className="vocab-list">{it.detail.vocab.map(v=> <div key={v.en} className="vocab-row"><b>{v.en}</b><span className="muted"> {v.cn}</span><span> — {v.sentence}</span></div>)}</div>}
            {it.textbook && <span className="badge outline">{it.textbook}·{it.unit?`第`+it.unit+`单元`:""}</span>}
            <div className="row"><button onClick={()=>removeManual(it.id)}>移除</button>{it.subject==="英语" && <button onClick={()=>speak(it.how)}>🔊 播报</button>}</div><div className="safety">{it.safety} <span className="muted">· 可跳过/明日再补</span></div></div>))}</section>)}
  {plan.modules.map(m=> (<section key={m.moduleKey} className="card" id={m.moduleKey}><h3>{m.title} <span className="badge">{m.items.length} 项</span></h3>{m.items.map(it=> (<div key={it.id} className="item"><label><input type="checkbox" checked={!!checks[it.id]} onChange={()=>toggle(it.id)} /> <b>{it.title}</b> <span className="muted">· {it.theme} · {it.duration}{it.preview ? " · 预习" : ""}{it.unit ? ` · 第${it.unit}单元` : ""}</span></label><div className="how">{it.how}</div>
            {it.detail?.chars && <div className="detail-grid">{it.detail.chars.map(c=> <span key={c.char} className="char-chip"><b>{c.char}</b><small>{c.pinyin}</small><small className="muted">{c.words.join(" / ")}</small></span>)}</div>}
            {it.detail?.problems && <div className="problem-list">{it.detail.problems.map((p,i)=> <div key={i} className="problem-row"><span>{p.q}</span><details className="answer"><summary>答案</summary>{p.a}</details></div>)}</div>}
            {it.detail?.vocab && <div className="vocab-list">{it.detail.vocab.map(v=> <div key={v.en} className="vocab-row"><b>{v.en}</b><span className="muted"> {v.cn}</span><span> — {v.sentence}</span></div>)}</div>}
            {it.textbook && <span className="badge outline">{it.textbook}·{it.unit?`第`+it.unit+`单元`:""}</span>}
            <div className="meta">材料：{it.materials} {it.subject==="英语" && <button onClick={()=>speak(it.how)}>🔊 播报</button>}</div><div className="safety">{it.safety} <span className="muted">· 可跳过/明日再补</span></div></div>))}</section>))}
  </div>);
}