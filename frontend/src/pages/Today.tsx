import { useEffect, useMemo, useState } from "react";
import { buildDailyPlan, speak } from "../lib/plan";
import { loadDailyChecks, loadManualPicks, loadProfile, saveDailyChecks, saveManualPicks, todayStr } from "../lib/storage";
export default function Today(){
  const profile=loadProfile();
  const [dateStr]=useState(todayStr());
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const [manualIds,setManualIds]=useState<string[]>([]);
  const [tick,setTick]=useState(0);
  useEffect(()=>{ const dc=loadDailyChecks()[dateStr]; if(dc) setChecks(dc.checks??{}); const mp=loadManualPicks()[dateStr]; if(mp) setManualIds(mp); },[dateStr,tick]);
  const plan=useMemo(()=>{ if(!profile) return null; return buildDailyPlan({grade:profile.grade,dateStr,enableEnglish:profile.enableEnglish,enableQuality:profile.enableQuality,dailyChecks:checks,manualIds}); },[profile,dateStr,checks,manualIds]);
  function toggle(id:string){ const next={...checks,[id]:!checks[id]}; if(!next[id]) delete next[id]; setChecks(next); const all=loadDailyChecks(); all[dateStr]={date:dateStr,checks:next,manualPicks:manualIds,repeatable:true} as any; saveDailyChecks(all); setTick(x=>x+1); }
  function removeManual(id:string){ const next=manualIds.filter(x=>x!==id); setManualIds(next); const mp=loadManualPicks(); mp[dateStr]=next; saveManualPicks(mp); const all=loadDailyChecks(); if(all[dateStr]){ all[dateStr].manualPicks=next; saveDailyChecks(all);} setTick(x=>x+1); }
  if(!profile) return (<div className="empty">请先到“档案”设置年级与教材。<a href="/profile">去设置</a></div>);
  if(!plan) return null;
  return (<div className="page"><div className="page-head"><h2>今日 · {dateStr} · {plan.gradeKey} · {plan.weekTheme}</h2><div className="sub">{profile.nickname} · {profile.grade}年级{profile.semester}学期 · {profile.textbook.chinese}/{profile.textbook.math}/{profile.textbook.english}</div></div>
  {plan.manualItems.length>0 && (<section className="card highlight"><h3>今日加入（手工）</h3>{plan.manualItems.map(it=> (<div key={it.id} className="item"><label><input type="checkbox" checked={!!checks[it.id]} onChange={()=>toggle(it.id)} /> <b>{it.title}</b> <span className="muted">· {it.duration}</span></label><div className="how">{it.how} <span className="muted">｜材料：{it.materials}</span></div><div className="row"><button onClick={()=>removeManual(it.id)}>移除</button>{it.subject==="英语" && <button onClick={()=>speak(it.how)}>\uD83D\uDD0A 播报</button>}</div><div className="safety">{it.safety} <span className="muted">· 可跳过/明日再补</span></div></div>))}</section>)}
  {plan.modules.map(m=> (<section key={m.moduleKey} className="card" id={m.moduleKey}><h3>{m.title} <span className="badge">{m.items.length} 项</span></h3>{m.items.map(it=> (<div key={it.id} className="item"><label><input type="checkbox" checked={!!checks[it.id]} onChange={()=>toggle(it.id)} /> <b>{it.title}</b> <span className="muted">· {it.theme} · {it.duration}</span></label><div className="how">{it.how}</div><div className="meta">材料：{it.materials} {it.subject==="英语" && <button onClick={()=>speak(it.how)}>\uD83D\uDD0A 播报</button>}</div><div className="safety">{it.safety} <span className="muted">· 可跳过/明日再补</span></div></div>))}</section>))}
  </div>);
}
