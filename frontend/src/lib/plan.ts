import { CONTENT_POOL } from "../data/contentPool";
import { MODULES, MODULE_OFFSET, weekThemeOf } from "../data/themes";
import type { DailyPlan, ContentEntry, Calibration, TermPhase } from "./types";

function daysSinceMonthStart(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.floor((+d - +start)/86400000);
}
function deterministicPick<T>(pool: T[], count: number, seed: number): T[] {
  if (pool.length===0) return [];
  const n = pool.length;
  const start = ((seed % n)+n)%n;
  return Array.from({length: Math.min(count,n)}, (_,i)=> pool[(start+i)%n]);
}
function preferUncompleted(pool: ContentEntry[], checks: Record<string,boolean>): ContentEntry[] {
  if (!checks || Object.keys(checks).length===0) return pool;
  const un = pool.filter(c=> !checks[c.id]);
  const done = pool.filter(c=> checks[c.id]);
  return un.length>= pool.length/2 ? [...un, ...done] : pool;
}
function resolveGradeKey(grade: number): string {
  return `g${grade}`;
}
function applyPreviewFilter(pool: ContentEntry[], termPhase: TermPhase, subject: string, previewUnits?: Record<string, number>): ContentEntry[] {
  if (termPhase !== "preview") return pool;
  const maxUnit = previewUnits?.[subject] ?? 1;
  const cur = pool.filter(c=> c.preview && c.unit === maxUnit);
  if (cur.length>0) return cur;
  const genericPreview = pool.filter(c=> c.preview);
  return genericPreview.length>0 ? genericPreview : pool;
}
function subjectTextbook(subject: string, tb?: { chinese: string; math: string; english: string }): string | undefined {
  if (!tb) return undefined;
  if (subject === "语文") return tb.chinese;
  if (subject === "数学") return tb.math;
  if (subject === "英语") return tb.english;
  return undefined;
}
function matchesTextbook(entry: ContentEntry, tbVersion?: string): boolean {
  if (!entry.textbook) return true;
  if (!tbVersion || tbVersion === "其他") return true;
  return entry.textbook === tbVersion;
}
function applyCalibrationWeight(pool: ContentEntry[], calibrations: Calibration[], subject: string): ContentEntry[] {
  const cal = calibrations.find(c=> c.subject === subject);
  if (!cal) return pool;
  const cur = pool.filter(c=> c.unit === cal.currentUnit);
  const withDetail = (arr: ContentEntry[]) => {
    const d = arr.filter(c=> (c as any).detail);
    return d.length>0 ? [...d, ...arr.filter(c=> !(c as any).detail)] : arr;
  };
  return withDetail(cur);
}


function mulberry32(a: number){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^ t>>>15, t|1); t^=t+Math.imul(t^ t>>>7, t|61); return ((t^ t>>>14)>>>0)/4294967296; }; }
function choice<T>(rng:()=>number, arr:T[]):T{ return arr[Math.floor(rng()*arr.length)]; }
function randInt(rng:()=>number, lo:number, hi:number){ return Math.floor(rng()*(hi-lo+1))+lo; }

// ---- Math problem generators by grade/theme ----
function genProblems(grade:number, theme:string, rng:()=>number, count=6){
  const out:{q:string,a:string}[]=[];
  const g=Math.max(1,Math.min(6,grade));
  for(let i=0;i<count;i++){
    if(theme==="口算"){
      if(g<=1){ const a=randInt(rng,2,9), b=randInt(rng,1, Math.min(9, 10-a)); const op=choice(rng,["+","-"] as const); if(op==="+"){out.push({q:a+" + "+b+" = ",a:String(a+b)});} else { const s=a+b; out.push({q:s+" - "+a+" = ",a:String(b)});} }
      else if(g===2){ const kind=choice(rng,["len","add2","sub2","mul","add3","story"] as const);
        if(kind==="len"){ const opts=[["1米 = ( )厘米","100"],["30厘米 + 20厘米 = ( )厘米","50"],["1米 - 40厘米 = ( )厘米","60"],["比一比：1米 ○ 90厘米","＞"]]; const [q,a]=choice(rng,opts); out.push({q,a}); }
        else if(kind==="add2"){ const a=randInt(rng,20,69), b=randInt(rng,10, Math.min(79,99-a)); out.push({q:a+" + "+b+" = ",a:String(a+b)}); }
        else if(kind==="sub2"){ const a=randInt(rng,40,95), b=randInt(rng,10, Math.min(35,a-5)); out.push({q:a+" - "+b+" = ",a:String(a-b)}); }
        else if(kind==="mul"){ const a=randInt(rng,2,9), b=randInt(rng,2,9); out.push({q:a+" × "+b+" = ",a:String(a*b)}); }
        else if(kind==="add3"){ const a=randInt(rng,10,40), b=randInt(rng,10,30), c=randInt(rng,5,20); out.push({q:a+" + "+b+" + "+c+" = ",a:String(a+b+c)}); }
        else { const a=randInt(rng,20,50), b=randInt(rng,10,40); out.push({q:"小明有"+a+"颗糖，又买了"+b+"颗，一共？",a:(a+b)+"颗"}); }
      } else if(g===3){ const kind=choice(rng,["time","mix","mul2"] as const); if(kind==="time"){ out.push(choice(rng,[{q:"1时 = ( )分",a:"60"},{q:"2分30秒 = ( )秒",a:"150"}])); } else if(kind==="mix"){ const a=randInt(rng,10,20), b=randInt(rng,2,6), c=randInt(rng,5,15); out.push({q:a+" + "+b+"×"+c+" = ",a:String(a+b*c)}); } else { const a=randInt(rng,12,35), b=randInt(rng,2,5); out.push({q:a+"×"+b+" = ",a:String(a*b)}); } }
      else if(g===4){ const a=randInt(rng,100,600), b=randInt(rng,100,400); out.push(choice(rng,[{q:a+" + "+b+" = ",a:String(a+b)},{q:(a+b)+" - "+a+" = ",a:String(b)}])); }
      else { const a=randInt(rng,12,48), b=randInt(rng,12,48); out.push({q:a+" × "+b+" = ",a:String(a*b)}); }
    } else if(theme==="应用题"){
      if(g<=2){ let a=randInt(rng,8,30), b=randInt(rng,5,20); if(b>a) [a,b]=[b,a]; out.push({q:"妈妈买了"+a+"个苹果，吃掉"+b+"个，还剩？",a:(a-b)+"个"}); }
      else { const a=randInt(rng,12,36), b=randInt(rng,3,7); out.push({q:"每盒"+a+"个，"+b+"盒共有？",a:(a*b)+"个"}); }
    } else if(theme==="思维"){
      out.push(choice(rng,[{q:"找规律：2,4,6,( )",a:"8"},{q:"数一数：正方形有( )条边",a:"4"},{q:"一题多解：8+6=？写2种方法",a:"14"}]));
    } else {
      out.push(choice(rng,[{q:"量一量书桌长约( )厘米",a:"约60-80"},{q:"统计家里3种水果数量做小表",a:"动手做"}]));
    }
  }
  return out;
}
function patchMathEntries(items: ContentEntry[], grade:number, dateStr:string): ContentEntry[]{
  return items.map((it,i)=>{
    if(it.subject!=="数学") return it;
    const seedStr=dateStr+"|"+grade+"|"+it.id+"|"+i;
    let h=0; for(let k=0;k<seedStr.length;k++) h=(h*31+seedStr.charCodeAt(k))>>>0;
    const rng=mulberry32(h);
    const problems=genProblems(grade, it.theme, rng, it.theme==="口算"?6:3);
    const howMap:Record<string,string>={ "口算":"按题型随机出6题（长度/100以内加减/乘法/连加），计时5分钟。", "应用题":"随机应用题3题，列式并写答语。", "思维":"思维随机题：规律/图形/多解各1。", "生活数学":"生活数学随机任务1项，动手量/统计。", };
    const how=howMap[it.theme] ?? it.how;
    return {...it, how, detail:{...(it.detail as any), problems}} as ContentEntry;
  });
}
export function buildDailyPlan(opts: {
  grade: number;
  textbook?: { chinese: string; math: string; english: string };
  dateStr: string;
  enableEnglish: boolean;
  enableQuality: boolean;
  termPhase: TermPhase;
  previewUnits?: Record<string, number>;
  calibrations: Calibration[];
  dailyChecks: Record<string,boolean>;
  manualIds: string[];
}): DailyPlan {
  const gradeKey = resolveGradeKey(opts.grade);
  const weekTheme = weekThemeOf(opts.dateStr);
  const dayIndex = daysSinceMonthStart(opts.dateStr);
  const isPreview = opts.termPhase === "preview";
  const modules = MODULES
    .filter(m=> !(m.subject==="英语" && !opts.enableEnglish))
    .filter(m=> !(m.subject==="素质劳动" && !opts.enableQuality))
    .map(m=>{
      const tbVersion = subjectTextbook(m.subject, opts.textbook);
      let pool = CONTENT_POOL.filter(c=> c.gradeKey===gradeKey && c.subject===m.subject && c.reviewed && matchesTextbook(c, tbVersion)) as ContentEntry[];
      if (pool.length===0) pool = CONTENT_POOL.filter(c=> c.gradeKey===gradeKey && c.subject===m.subject && c.reviewed) as ContentEntry[];
      if (isPreview) {
        pool = applyPreviewFilter(pool, opts.termPhase, m.subject, opts.previewUnits);
        const withDetail = pool.filter(c=> (c as any).detail && (((c as any).detail.problems && (c as any).detail.problems.length) || ((c as any).detail.chars && (c as any).detail.chars.length) || ((c as any).detail.vocab && (c as any).detail.vocab.length)));
        if (withDetail.length > 0) pool = [...withDetail, ...pool.filter(c=> !withDetail.includes(c))];
      } else {
        pool = pool.filter(c=> !(c as any).preview); // sync must not show preview items
        pool = applyCalibrationWeight(pool, opts.calibrations, m.subject);
        const syncDetail = pool.filter(c=> (c as any).detail && (((c as any).detail.problems && (c as any).detail.problems.length) || ((c as any).detail.chars && (c as any).detail.chars.length) || ((c as any).detail.vocab && (c as any).detail.vocab.length)));
        if(syncDetail.length>0 && m.subject!=="数学"){
          const remaining = pool.filter(c=> !syncDetail.includes(c));
          pool = [...syncDetail, ...remaining.filter(c=> !syncDetail.includes(c))];
          pool = [...new Map(pool.map(c=>[c.id,c])).values()];
        }
      }
      const prePool = [...pool];
      pool = preferUncompleted(pool, opts.dailyChecks);
      const quota = isPreview ? Math.min(m.quota, 2) : m.quota;
      let items: ContentEntry[];
      if(m.subject==="观察提醒"){
        // align observation with learning phase, not calendar
        if(isPreview){
          const cu = Math.min(4, Math.max(1, Math.max(...Object.values(opts.previewUnits ?? { "观察提醒":1 }))));
          // take first cu*? or simply first 2 of pool sorted by id numeric
          const sorted=[...prePool].sort((a,b)=> a.id.localeCompare(b.id));
          const start = ((cu-1)*2) % Math.max(1, sorted.length);
          items = sorted.slice(start, start+quota);
          if(items.length < quota) items = items.concat(sorted.slice(0, quota-items.length));
        } else {
          // sync: use calibration if any, else calendar pick
          const cal = opts.calibrations.find(c=> c.subject==="语文"||c.subject==="数学"||c.subject==="英语");
          if(cal){
            const sorted=[...prePool].sort((a,b)=> a.id.localeCompare(b.id));
            const start = ((cal.currentUnit-1)*2) % Math.max(1, sorted.length);
            items = sorted.slice(start, start+quota);
            if(items.length < quota) items = items.concat(sorted.slice(0, quota-items.length));
          } else {
            const off = MODULE_OFFSET[m.moduleKey] ?? 0;
            items = deterministicPick(pool, quota, dayIndex + off + opts.grade*13);
          }
        }
      } else if(m.subject==="运动健康"){
        // sync: U1→01/02 开学基础, preview: 预习进度决定; otherwise calendar
        if(isPreview){
          const cu = Math.min(4, Math.max(1, Math.max(...Object.values(opts.previewUnits ?? { "运动健康":1 }))));
          const byNum=[...prePool].sort((a,b)=>{ const na=Number((a.title.match(/第(\d+)练/)||[])[1]||0); const nb=Number((b.title.match(/第(\d+)练/)||[])[1]||0); return na-nb || a.id.localeCompare(b.id); });
          const start = ((cu-1)*2) % Math.max(1, byNum.length);
          items = byNum.slice(start, start+quota);
          if(items.length < quota) items = items.concat(byNum.slice(0, quota-items.length));
        } else {
          const cal = opts.calibrations.find(c=> c.subject==="语文"||c.subject==="数学"||c.subject==="英语");
          if(cal){
            const byNum=[...prePool].sort((a,b)=>{ const na=Number((a.title.match(/第(\d+)练/)||[])[1]||0); const nb=Number((b.title.match(/第(\d+)练/)||[])[1]||0); return na-nb || a.id.localeCompare(b.id); });
            const start = ((cal.currentUnit-1)*2) % Math.max(1, byNum.length);
            items = byNum.slice(start, start+quota);
            if(items.length < quota) items = items.concat(byNum.slice(0, quota-items.length));
          } else {
            const off = MODULE_OFFSET[m.moduleKey] ?? 0;
            items = deterministicPick(pool, quota, dayIndex + off + opts.grade*13);
          }
        }
      } else {
        if(!isPreview && opts.calibrations.length>0){
          // calibrated sync: take head of calibrated order (U1 first), no calendar rotation
          items = pool.slice(0, quota);
          if(items.length < quota) items = items.concat(pool.slice(0, quota - items.length));
          if(m.subject==="数学") items = patchMathEntries(items, opts.grade, opts.dateStr);
        } else {
          const off = MODULE_OFFSET[m.moduleKey] ?? 0;
          items = deterministicPick(pool, quota, dayIndex + off + opts.grade*13);
          if(m.subject==="数学") items = patchMathEntries(items, opts.grade, opts.dateStr);
        }
      }
      return { moduleKey: m.moduleKey, title: m.title, items };
    });
  let manualItems = opts.manualIds.map(id=> CONTENT_POOL.find(c=>c.id===id)).filter(Boolean) as ContentEntry[];
  manualItems = patchMathEntries(manualItems, opts.grade, opts.dateStr);
  return { date: opts.dateStr, gradeKey, weekTheme, termPhase: opts.termPhase, previewUnits: opts.previewUnits, calibrations: opts.calibrations, modules, manualItems };
}
export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.9;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}