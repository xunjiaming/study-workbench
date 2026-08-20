import { useState } from "react";
import { loadProfile, saveProfile, loadCalibrations, saveCalibrations } from "../lib/storage";
import type { Calibration, StudentProfile } from "../lib/types";

const SUBJECTS: Calibration["subject"][] = ["语文","数学","英语"];

function PhaseBadge({ phase }: { phase: string }) {
  return <span className={phase==="preview" ? "badge preview" : "badge"}>{phase==="preview" ? "🎒 预习" : "📚 同步"}</span>;
}

export default function GlobalProgress({ onChanged }: { onChanged?: ()=>void }){
  const p = loadProfile();
  if(!p) return null;
  const [profile,setProfile]=useState<StudentProfile>(p);
  const [cals,setCals]=useState<Calibration[]>(loadCalibrations());
  const [confirm,setConfirm]=useState<null | "to_preview" | "to_term">(null);
  const isPreview=profile.termPhase==="preview";

  function saveProfilePhase(next: StudentProfile){
    saveProfile(next); setProfile(next);
    window.dispatchEvent(new Event("study:profile-changed"));
    onChanged?.();
  }
  function setTermPhase(nextPhase: "preview" | "in_term"){
    const cur=loadProfile(); if(!cur) return;
    const next={ ...cur, termPhase: nextPhase, updatedAt: new Date().toISOString() } as StudentProfile;
    if(nextPhase==="preview" && !next.previewUnits){
      next.previewUnits={ "语文": 1, "数学": 1, "英语": 1 };
    }
    saveProfilePhase(next); setConfirm(null);
  }
  function setPreviewUnit(subject: string, unit: number){
    const cur=loadProfile(); if(!cur) return;
    const nextUnits={ ...(cur.previewUnits ?? { "语文":1,"数学":1,"英语":1 }), [subject]: unit };
    const next={ ...cur, previewUnits: nextUnits, updatedAt: new Date().toISOString() } as StudentProfile;
    saveProfilePhase(next);
  }
  function setCal(subject: Calibration["subject"], unit: number){
    const next=[...cals.filter(c=>c.subject!==subject), {subject, currentUnit:unit, updatedAt:new Date().toISOString()}].sort((a,b)=>a.subject.localeCompare(b.subject));
    setCals(next); saveCalibrations(next);
    window.dispatchEvent(new Event("study:calibrations-changed"));
    onChanged?.();
  }
  function clearCal(subject: Calibration["subject"]){
    const next=cals.filter(c=>c.subject!==subject); setCals(next); saveCalibrations(next);
    window.dispatchEvent(new Event("study:calibrations-changed"));
    onChanged?.();
  }

  return (<>
    <div className={`global-progress ${isPreview ? "preview" : "term"}`}>
      <div className="gp-left">
        <PhaseBadge phase={profile.termPhase} />
        {isPreview ? (
          <span className="gp-title">假期预习 · 档案{profile.grade}年级 → 预习{profile.previewTargetGrade}年级上 · 开学 {profile.schoolStartDate ?? "未设"}</span>
        ) : (
          <span className="gp-title">学期同步 · {profile.grade}年级{profile.semester}学期</span>
        )}
      </div>
      <div className="gp-center">
        {isPreview ? (
          SUBJECTS.map(s=>{
            const u=profile.previewUnits?.[s] ?? 1;
            return (<div key={s} className="gp-stepper">
              <span className="gp-label">{s}</span>
              <button className="gp-btn" onClick={()=>setPreviewUnit(s, Math.max(1, u-1))} aria-label={`${s}减`}>◀</button>
              <span className="gp-unit">第{u}单元</span>
              <button className="gp-btn" onClick={()=>setPreviewUnit(s, Math.min(4, u+1))} aria-label={`${s}加`}>▶</button>
              <div className="progress mini"><div className="progress-fill" style={{width: `${(u/4)*100}%`}} /></div>
            </div>);
          })
        ) : (
          SUBJECTS.map(s=>{
            const cur=cals.find(c=>c.subject===s)?.currentUnit;
            return (<div key={s} className="gp-select">
              <span className="gp-label">{s}</span>
              <select value={cur ?? ""} onChange={e=>{ const v=Number(e.target.value); if(v) setCal(s,v); else clearCal(s); }}>
                <option value="">未校准</option>{[1,2,3,4,5,6,7,8].map(u=> <option key={u} value={u}>第{u}单元</option>)}
              </select>
              {cur && <button className="gp-clear" onClick={()=>clearCal(s)}>×</button>}
            </div>);
          })
        )}
      </div>
      <div className="gp-right">
        {isPreview
          ? <button className="btn ghost" onClick={()=>setConfirm("to_term")}>已开学，切为同步</button>
          : <button className="btn ghost" onClick={()=>setConfirm("to_preview")}>切为预习</button>}
      </div>
    </div>
    {confirm && (
      <div className="modal-mask" onClick={()=>setConfirm(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <h3>{confirm==="to_term" ? "切换到学期同步？" : "切换到假期预习？"}</h3>
          <p className="muted">{confirm==="to_term" ? "预习记录将按学期归档，次日计划按校内进度重排。此操作次日生效。" : "将进入预习节奏（前4单元轻量，10-15分/条），校准权重暂停。此操作次日生效。"}</p>
          <div className="row" style={{justifyContent:"flex-end"}}>
            <button className="btn ghost" onClick={()=>setConfirm(null)}>取消</button>
            <button className="btn" onClick={()=>setTermPhase(confirm==="to_term" ? "in_term" : "preview")}>确认切换</button>
          </div>
        </div>
      </div>
    )}
  </>);
}