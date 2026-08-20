import { useState } from "react";
import { loadProfile, saveProfile, loadCalibrations, saveCalibrations } from "../lib/storage";
import type { StudentProfile, Calibration } from "../lib/types";

const empty: StudentProfile = {
  nickname: "乖乖", grade: 1, semester: "上",
  textbook: { chinese: "人教版", math: "人教版", english: "人教版" },
  dailyTimeSlot: "每天下午约45分钟", weakSubjects: [], enableEnglish: true, enableQuality: true,
  termPhase: "in_term", previewTargetGrade: 2, schoolStartDate: "2026-09-01",
  updatedAt: new Date().toISOString()
};

function CalibrationsBlock(){
  const [list,setList]=useState<Calibration[]>(loadCalibrations());
  const [msg,setMsg]=useState("");
  const subjects: Calibration["subject"][] = ["语文","数学","英语"];
  function upsert(subject: Calibration["subject"], unit: number){
    const next=[...list.filter(c=>c.subject!==subject), {subject, currentUnit:unit, updatedAt:new Date().toISOString()}].sort((a,b)=>a.subject.localeCompare(b.subject));
    setList(next); saveCalibrations(next); setMsg(`${subject} 已校准到第${unit}单元，次日计划生效`);
  }
  function clear(subject: Calibration["subject"]){
    const next=list.filter(c=>c.subject!==subject); setList(next); saveCalibrations(next); setMsg(`已清除${subject}校准`);
  }
  return (<div className="card"><h3>校准进度（按校内实际，下拉选单元，次日生效）</h3>
    {subjects.map(s=>{
      const cur=list.find(c=>c.subject===s)?.currentUnit;
      return (<div key={s} className="row" style={{gap:8, alignItems:"center", marginBottom:8}}><span style={{minWidth:48}}>{s}</span>
        <select value={cur ?? ""} onChange={e=>{ const v=Number(e.target.value); if(v) upsert(s, v); }}>
          <option value="">未校准（按教材默认）</option>{[1,2,3,4,5,6,7,8].map(u=> <option key={u} value={u}>第{u}单元</option>)}
        </select>
        {cur && <button onClick={()=>clear(s)}>清除</button>}
        {cur && <span className="muted">当前第{cur}单元</span>}
      </div>);
    })}
    <p className="muted">已教单元转巩固、正在教单元加权、未教单元不提前；建议每1-2周校准一次，容差±1周。</p>
    {msg && <span className="muted">{msg}</span>}
  </div>);
}

export default function ProfilePage(){
  const [p,setP]=useState<StudentProfile>(()=>{ const cur=loadProfile(); if(!cur) return empty; return { ...empty, ...cur } as StudentProfile; });
  const [msg,setMsg]=useState("");
  function save(){
    if(!p.nickname.trim()) return setMsg("请填写昵称");
    if(p.termPhase==="preview" && !p.previewTargetGrade) return setMsg("请选择预习目标年级");
    const next={...p, updatedAt:new Date().toISOString()};
    saveProfile(next); setMsg(p.termPhase==="preview" ? "已保存为预习态，次日计划为目标年级预习包" : "已保存，次日计划按新设置与校准生效");
  }
  const isPreview=p.termPhase==="preview";
  return (<div className="page"><h2>档案 / 设置</h2>
    <div className="form">
      <label>昵称<input value={p.nickname} onChange={e=>setP({...p, nickname:e.target.value})} /></label>
      <label>年级<select value={p.grade} onChange={e=>setP({...p, grade: Number(e.target.value) as any})}><option value={1}>一年级</option><option value={2}>二年级</option><option value={3}>三年级</option><option value={4}>四年级</option><option value={5}>五年级</option><option value={6}>六年级</option></select></label>
      <label>学期<select value={p.semester} onChange={e=>setP({...p, semester:e.target.value as any})}><option value="上">上</option><option value="下">下</option></select></label>
      <label>学段状态<select value={p.termPhase} onChange={e=>setP({...p, termPhase:e.target.value as any})}><option value="in_term">学期同步</option><option value="preview">假期预习</option></select></label>
      {isPreview && (<>
        <label>预习目标年级<select value={p.previewTargetGrade ?? 2} onChange={e=>setP({...p, previewTargetGrade: Number(e.target.value) as any})}><option value={1}>一年级</option><option value={2}>二年级</option><option value={3}>三年级</option><option value={4}>四年级</option><option value={5}>五年级</option><option value={6}>六年级</option></select></label>
        <label>开学日期<input type="date" value={p.schoolStartDate ?? ""} onChange={e=>setP({...p, schoolStartDate:e.target.value})} /></label>
        <p className="muted">示例：女儿一年级已完成，选“假期预习→二年级”，开学日期填 2026-09-01；开学后切回“学期同步”即可。</p>
      </>)}
      <label>语文教材<select value={p.textbook.chinese} onChange={e=>setP({...p, textbook:{...p.textbook, chinese:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>数学教材<select value={p.textbook.math} onChange={e=>setP({...p, textbook:{...p.textbook, math:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>英语教材<select value={p.textbook.english} onChange={e=>setP({...p, textbook:{...p.textbook, english:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>每日时段<input value={p.dailyTimeSlot} onChange={e=>setP({...p, dailyTimeSlot:e.target.value})} /></label>
      <label className="check"><input type="checkbox" checked={p.enableEnglish} onChange={e=>setP({...p, enableEnglish:e.target.checked})} />启用英语模块</label>
      <label className="check"><input type="checkbox" checked={p.enableQuality} onChange={e=>setP({...p, enableQuality:e.target.checked})} />启用素质与劳动</label>
      <button onClick={save}>保存</button>{msg && <span className="muted">{msg}</span>}
    </div>
    <p className="muted">修改年级/学期/学段状态后，次日计划按新年级与校准生成，旧记录可在“我的-归档”回看。</p>
    <CalibrationsBlock />
  </div>);
}