import { useEffect, useState } from "react";
import { OBSERVATIONS } from "../data/observations";
import { loadObservationChecks, loadProfile, saveObservationChecks } from "../lib/storage";
export default function Observation(){
  const profile=loadProfile(); const gradeKey=profile? `g${profile.grade}`:"g1";
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  useEffect(()=> setChecks(loadObservationChecks()), []);
  function toggle(id:string){ const next={...checks,[id]:!checks[id]}; if(!next[id]) delete next[id]; setChecks(next); saveObservationChecks(next); }
  const list=OBSERVATIONS.filter(o=>o.gradeKey===gradeKey);
  const cats=Array.from(new Set(list.map(x=>x.category)));
  return (<div className="page"><h2>学习观察 · {gradeKey}</h2><p className="muted">仅作陪伴参考，专业评估以老师与医生为准。</p>{cats.map(cat=> (<section key={cat} className="card"><h3>{cat}</h3>{list.filter(x=>x.category===cat).map(it=> (<label key={it.id} className="check"><input type="checkbox" checked={!!checks[it.id]} onChange={()=>toggle(it.id)} />{it.label}</label>))}</section>))}</div>);
}
