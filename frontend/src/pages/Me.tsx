import { useEffect, useState } from "react";
import { buildExport, doImport, loadArchives, loadCollections, loadCalibrations } from "../lib/storage";
import { consumeInstallPrompt, getDeferredPrompt, subscribeInstallPrompt } from "../lib/install";
export default function Me(){
  function onExport(){ const data=buildExport(); const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`study-workbench-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }
  function onImport(e: React.ChangeEvent<HTMLInputElement>){ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ doImport(JSON.parse(String(r.result))); alert("导入成功"); location.reload(); } catch(err:any){ alert("导入失败: "+(err as Error).message); } }; r.readAsText(f); }
  const archives=loadArchives(); const cols=loadCollections(); const cals=loadCalibrations();
  const [installAvailable,setInstallAvailable]=useState(()=> !!getDeferredPrompt());
  const [isStandalone,setIsStandalone]=useState(()=> window.matchMedia("(display-mode: standalone)").matches);
  const [installMsg,setInstallMsg]=useState("");
  useEffect(()=>{
    const unsub=subscribeInstallPrompt((p)=> setInstallAvailable(!!p));
    const media=window.matchMedia("(display-mode: standalone)");
    const onChange=()=> setIsStandalone(media.matches);
    if(media.addEventListener) media.addEventListener("change", onChange); else (media as any).addListener(onChange);
    const onInstalled=()=>{ setInstallAvailable(false); setIsStandalone(true); setInstallMsg("已安装到桌面，可以像 App 一样使用。"); };
    window.addEventListener("appinstalled", onInstalled);
    return ()=>{ unsub(); window.removeEventListener("appinstalled", onInstalled); if(media.removeEventListener) media.removeEventListener("change", onChange); else (media as any).removeListener(onChange); };
  },[]);
  async function onInstall(){
    const prompt=consumeInstallPrompt();
    if(!prompt){ setInstallMsg("当前浏览器不支持一键安装，请用浏览器菜单“添加到主屏幕/桌面”。"); return; }
    try{ await prompt.prompt(); const choice=await prompt.userChoice; if(choice.outcome==="accepted") setInstallMsg("已接受安装，请在桌面查看图标。"); else setInstallMsg("已取消，可稍后在浏览器菜单中手动添加。"); } catch{ setInstallMsg("安装调用失败，请用浏览器菜单“添加到主屏幕”。"); }
    setInstallAvailable(!!getDeferredPrompt());
  }
  return (<div className="page"><h2>我的</h2><section className="card"><h3>安装到手机/电脑桌面</h3><p className="muted">添加到桌面后图标会出现在桌面，打开后像 App 一样使用，数据仍保存在本机，支持离线。</p><div className="row">{isStandalone ? <span className="badge">已添加到桌面</span> : <>{installAvailable && <button onClick={onInstall}>一键安装</button>}<span className="badge outline">浏览器菜单添加</span></>}</div>{installMsg && <p className="muted">{installMsg}</p>}{!isStandalone && <p className="muted">找不到“安装”按钮时：手机用 Chrome/Safari 打开本站，点浏览器菜单 → “添加到主屏幕/桌面”；电脑用 Chrome/Edge 点地址栏右侧安装图标。</p>}</section><section className="card"><h3>备份</h3><div className="row"><button onClick={onExport}>导出 JSON</button><label className="btn">导入 JSON<input type="file" accept=".json" hidden onChange={onImport} /></label></div><p className="muted">本机存储，无账号；换设备时导出后在另一设备导入即可恢复（含校准历史）。</p></section><section className="card"><h3>校准记录</h3>{cals.length===0 ? <span className="muted">暂无校准，在“档案”按学科校准当前单元。</span> : <ul>{cals.map(c=> <li key={c.subject}>{c.subject} · 第{c.currentUnit}单元 · {new Date(c.updatedAt).toLocaleDateString()}</li>)}</ul>}</section><section className="card"><h3>收藏</h3>{cols.length===0 ? <span className="muted">暂无收藏，去活动库收藏常用条目。</span> : <ul>{cols.map(id=> <li key={id}>{id}</li>)}</ul>}</section><section className="card"><h3>归档（按年级）</h3>{Object.keys(archives).length===0 ? <span className="muted">暂无归档，升年级后自动归档。</span> : Object.entries(archives).map(([k,v])=> <div key={k}><b>{k}</b> · {v.length} 天记录</div>)}</section><section className="card"><h3>说明</h3><ul><li>每日计划同年级同日稳定可复现，刷新不跳动。</li><li>每条可跳过/明日再补，不排名。</li><li>预习态仅前4单元轻量内容，学期态按校准重排次日计划。</li><li>PWA 可添加到桌面，离线可用。</li></ul></section></div>);
}
