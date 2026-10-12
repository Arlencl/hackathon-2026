import { SEED } from './data.js';
export const clone=x=>JSON.parse(JSON.stringify(x));
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
export function initialState(){return {draft:clone(SEED),versions:[{id:'demo-v1',number:1,createdAt:'2026-10-10T08:00:00Z',project:clone(SEED),label:'内置演示版'}],activeId:'demo-v1',events:[]};}
export function validateProject(input){
  if(!input||input.schemaVersion!==1||!Array.isArray(input.points)||input.points.length<1||input.points.length>20)throw Error('需要 schemaVersion: 1 和 1–20 个讲解点。');
  const str=(s,max=2000)=>typeof s==='string'?s.slice(0,max):'';
  if(!str(input.title,80).trim())throw Error('请填写项目名称。');
  if(!Array.isArray(input.sources)||input.sources.length>30)throw Error('来源格式不正确。');
  const sources=input.sources.map(s=>({id:str(s.id,50),title:str(s.title,160),url:safeURL(s.url),license:str(s.license,250),accessed:str(s.accessed,30)}));
  if(sources.some(s=>!s.id||!s.title)||new Set(sources.map(s=>s.id)).size!==sources.length)throw Error('来源 ID 必须唯一且非空。');
  const ids=new Set();const points=input.points.map(p=>{
    if(!/^[a-zA-Z0-9_-]{1,40}$/.test(p.id)||ids.has(p.id))throw Error('点位 ID 需为唯一的英文字母、数字或短横线。');ids.add(p.id);
    if(!Array.isArray(p.position)||p.position.length!==3||p.position.some(v=>!Number.isFinite(v)||Math.abs(v)>1000))throw Error('点位坐标需为三个有效数字。');
    return {id:p.id,name:str(p.name,80),nameEn:str(p.nameEn,120),tag:str(p.tag,80),position:[...p.position],minutes:Math.min(60,Math.max(1,Number(p.minutes)||5)),interest:['relax','photo','culture'].includes(p.interest)?p.interest:'culture',reviewed:p.reviewed===true,text:str(p.text),textEn:str(p.textEn),notice:str(p.notice,300),noticeEn:str(p.noticeEn,500),sourceIds:Array.isArray(p.sourceIds)?[...new Set(p.sourceIds.filter(id=>sources.some(s=>s.id===id)))]:[]};
  });
  return {schemaVersion:1,title:str(input.title,80),subtitle:str(input.subtitle,200),description:str(input.description,1000),rightsConfirmed:input.rightsConfirmed===true,sources,points,world:{mode:input.world?.mode==='splat'?'splat':'procedural',url:safeURL(input.world?.url),prompt:str(input.world?.prompt,2000)}};
}
export function publish(state,now=new Date().toISOString()){
  const p=validateProject(state.draft);
  if(!p.rightsConfirmed)throw Error('请先确认素材的使用权与来源。');
  if(p.points.some(x=>!x.reviewed||!x.name.trim()||!x.nameEn.trim()||!x.text.trim()||!x.textEn.trim()||!x.sourceIds.length))throw Error('每个点位需要中英文名称、讲解、来源，并逐项审核通过。');
  if(p.points.some(x=>Boolean(x.notice.trim())!==Boolean(x.noticeEn.trim())))throw Error('运营提示需要同时填写中英文。');
  if(p.world.mode==='splat'&&!p.world.url)throw Error('请填写有效的 3D 资产地址。');
  const number=Math.max(0,...state.versions.map(v=>v.number))+1;
  const version={id:`v${number}-${Date.now().toString(36)}`,number,createdAt:now,project:clone(p),label:'审核发布'};
  return {...state,versions:[version,...state.versions].slice(0,10),activeId:version.id};
}
export function getPublished(state){return state.versions.find(v=>v.id===state.activeId)||state.versions[0];}
export function planTour(project,budget,interest){
  const max=Math.min(60,Math.max(5,Number(budget)||15));let used=0;
  const ranked=[...project.points].sort((a,b)=>Number(b.interest===interest)-Number(a.interest===interest));
  const chosen=[];for(const p of ranked){const cost=p.minutes+(chosen.length?1:0);if(used+cost<=max){used+=cost;chosen.push(p.id)}}
  return {pointIds:chosen,minutes:used,budget:max,kind:'preview',disclaimer:'预览体验时长，不是实地路线、交通或步行时间。'};
}
export function answerGuide(project,question,pointId,lang='zh'){
  const en=lang==='en';const p=project.points.find(x=>x.id===pointId)||project.points[0];const q=String(question).toLowerCase().trim();
  const result=(text,ids=[],known=true)=>({text,sourceIds:ids,known,mode:'retrieval',pointId:p.id});
  if(/开放|几点|营业|票价|门票|价格|轮椅|无障碍|天气|排队|拥挤|今天|明天|闭园|hours|open|ticket|price|wheelchair|weather|crowd|today|tomorrow|close|accessib/.test(q)){
    if(p.notice&&!/票价|门票|价格|轮椅|无障碍|天气|排队|拥挤|ticket|price|wheelchair|weather|crowd|accessib/.test(q)&&( /开放|营业|今天|明天|闭园|open|today|tomorrow|close|notice|提示/.test(q)))return result(en?p.noticeEn:p.notice,p.sourceIds);
    return result(en?'The published material does not verify that information. Please check the attraction’s official service channel. This scene cannot establish opening hours, prices, weather or accessibility.':'已发布资料中没有核实这项信息。请向景区官方服务渠道确认；不能根据生成场景判断开放时间、票价、天气或无障碍条件。',[],false);
  }
  if(/提示|通知|notice|update/.test(q))return p.notice?result(en?p.noticeEn:p.notice,p.sourceIds):result(en?'There is no published service notice for this viewpoint. This does not mean there are no restrictions.':'这个点位还没有已发布的运营提示；这不代表实地没有限制。',[],false);
  if(/路线|多久|分钟|推荐|route|minute|long|recommend|plan/.test(q))return result(en?'Use “My preview” to choose your interests and time. The plan orders these virtual viewpoints, not real-world travel. A visit to the actual lake needs verified transport and access information.':'点击「我的预览」，选择兴趣和时间，就能生成概念场景内的体验顺序。这里的规划服务于线上预览；实地游览仍需核实交通、开放和通行条件。',['editorial']);
  const direct=project.points.find(x=>q.includes(x.name.toLowerCase())||q.includes(x.nameEn.toLowerCase()));
  if(direct)return {...result(en?direct.textEn:direct.text,direct.sourceIds),pointId:direct.id};
  if(/这里|这个|眼前|介绍|讲讲|故事|文化|为什么|怎么理解|风景|看|西湖|what|this|here|tell|story|culture|why|lake|explain|view|pavilion|causeway|pagoda/.test(q))return result(en?p.textEn:p.text,p.sourceIds);
  return result(en?'I cannot find an answer in the published material. Try asking about this viewpoint, its cultural context, or a virtual preview plan.':'在已发布资料中没有找到这道问题的答案。你可以问眼前的景物、文化背景，或如何安排线上预览。',[],false);
}
export function recordEvent(state,type,detail=''){return {...state,events:[...state.events,{type,detail,time:new Date().toISOString()}].slice(-500)};}
