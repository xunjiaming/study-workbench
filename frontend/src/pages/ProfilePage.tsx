import { useState } from "react";
import { loadProfile, saveProfile } from "../lib/storage";
import type { StudentProfile } from "../lib/types";

const empty: StudentProfile = {
  nickname: "乖乖", grade: 1, semester: "上",
  textbook: { chinese: "人教版", math: "人教版", english: "人教版" },
  dailyTimeSlot: "每天下午约45分钟", weakSubjects: [], enableEnglish: true, enableQuality: true,
  termPhase: "in_term", schoolStartDate: "2026-09-01",
  previewUnits: { "语文": 1, "数学": 1, "英语": 1 },
  updatedAt: new Date().toISOString()
};

export default function ProfilePage(){
  const [p,setP]=useState<StudentProfile>(()=>{ const cur=loadProfile(); if(!cur) return empty; return { ...empty, ...cur } as StudentProfile; });
  const [msg,setMsg]=useState("");
  function save(){
    if(!p.nickname.trim()) return setMsg("请填写昵称");
    const next={...p, updatedAt:new Date().toISOString()};
    saveProfile(next);
    window.dispatchEvent(new Event("study:profile-changed"));
    setMsg(p.termPhase==="preview" ? "已保存为预习态，进度可在顶部全局条按学科拨到对应单元" : "已保存，进度已在顶部全局条按学科独立管理");
  }
  const isPreview=p.termPhase==="preview";
  return (<div className="page"><h2>档案 / 设置</h2>
    <div className="form">
      <label>昵称<input value={p.nickname} onChange={e=>setP({...p, nickname:e.target.value})} /></label>
      <label>年级<select value={p.grade} onChange={e=>setP({...p, grade: Number(e.target.value) as any})}><option value={1}>一年级</option><option value={2}>二年级</option><option value={3}>三年级</option><option value={4}>四年级</option><option value={5}>五年级</option><option value={6}>六年级</option></select></label>
      <label>学期<select value={p.semester} onChange={e=>setP({...p, semester:e.target.value as any})}><option value="上">上</option><option value="下">下</option></select></label>
      <label>学段状态<select value={p.termPhase} onChange={e=>setP({...p, termPhase:e.target.value as any})}><option value="in_term">学期同步</option><option value="preview">假期预习</option></select></label>
      {isPreview && (<>
        <label>开学日期<input type="date" value={p.schoolStartDate ?? ""} onChange={e=>setP({...p, schoolStartDate:e.target.value})} /></label>
        <p className="muted">预习单元可在顶部全局条按语文/数学/英语各拨 1-4 单元，无需在此设置。</p>
      </>)}
      <label>语文教材<select value={p.textbook.chinese} onChange={e=>setP({...p, textbook:{...p.textbook, chinese:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>数学教材<select value={p.textbook.math} onChange={e=>setP({...p, textbook:{...p.textbook, math:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>英语教材<select value={p.textbook.english} onChange={e=>setP({...p, textbook:{...p.textbook, english:e.target.value as any}})}><option>人教版</option><option>北师大版</option><option>苏教版</option><option>其他</option></select></label>
      <label>每日时段<input value={p.dailyTimeSlot} onChange={e=>setP({...p, dailyTimeSlot:e.target.value})} /></label>
      <label className="check"><input type="checkbox" checked={p.enableEnglish} onChange={e=>setP({...p, enableEnglish:e.target.checked})} />启用英语模块</label>
      <label className="check"><input type="checkbox" checked={p.enableQuality} onChange={e=>setP({...p, enableQuality:e.target.checked})} />启用素质与劳动</label>
      <button onClick={save}>保存</button>{msg && <span className="muted">{msg}</span>}
    </div>
    <p className="muted">年级与学段已在顶部全局条固化为可随时调整的进度控件，此页仅作档案总览。</p>
  </div>);
}