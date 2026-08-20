import { NavLink, Outlet, useLocation } from "react-router-dom";
import GlobalProgress from "./GlobalProgress";
import { useEffect, useState } from "react";
const nav=[{to:"/",label:"今日",icon:"\u{1F4C5}"},{to:"/library",label:"活动库",icon:"\u{1F4DA}"},{to:"/observation",label:"观察",icon:"\u{1F440}"},{to:"/profile",label:"档案",icon:"\u{1F464}"},{to:"/me",label:"我的",icon:"\u2699\uFE0F"}];
export default function Layout(){
  const loc=useLocation();
  const [tick,setTick]=useState(0);
  useEffect(()=>{
    const h=()=>setTick(x=>x+1);
    window.addEventListener("storage", h);
    window.addEventListener("study:profile-changed", h as any);
    return ()=>{ window.removeEventListener("storage", h); window.removeEventListener("study:profile-changed", h as any); };
  },[]);
  return (<div className="app"><aside className="sidebar"><div className="brand">学习辅导<br/>工作台</div><nav>{nav.map(n=> (<NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=> isActive?"active":""}><span className="ico">{n.icon}</span>{n.label}</NavLink>))}</nav><div className="sidebar-foot">本机存储 \u00B7 无需登录</div></aside><main className="main"><GlobalProgress key={`${loc.pathname}-${tick}`} onChanged={()=>setTick(x=>x+1)} /><Outlet context={{onProgressChanged:()=>setTick(x=>x+1)}} /></main></div>);
}