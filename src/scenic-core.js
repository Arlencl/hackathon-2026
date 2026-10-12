import {PLACES,PILOT_ID,realPhoto,completionPhoto} from './scenic-places.js';
// The creator's draft and the visitor's published snapshot are deliberately separate.
export const ANGLES = [
  {id:'front', name:'正面全景', hint:'能看清主体与周边环境'},
  {id:'left', name:'左侧视角', hint:'向侧面走动，保留重叠区域'},
  {id:'rear', name:'右侧视角', hint:'从另一侧观察主体'},
  {id:'back', name:'背面视角', hint:'绕到主体背后，检查遮挡部分'},
  {id:'top', name:'俯视全景', hint:'从上方检查屋顶、占地与周边关系'},
  {id:'inside', name:'内部 / 近景', hint:'入口、内部或关键细节'},
];
export const copy = value => structuredClone(value);
const PILOT_ASSET = Object.freeze({worldId:'55dcc5ef-342c-4548-b937-6ffe6fb330ed',referenceUrl:'/assets/real/huagang.jpg'});
export function newSpot(id, x=.5, y=.5) {
  return {id,name:'新的景点',description:'',x,y,photos:{},revision:0,confirmedRevision:null,world:null};
}
export function createScenicState() {
  const spots=PLACES.map(p=>({...newSpot(p.id,p.x,p.y),...p,photos:{front:realPhoto(p.id,p.photoName)}}));
  spots[0].world={kind:'pilot',label:'御碑亭实拍试点',revision:0};
  spots[0].pilotAsset=copy(PILOT_ASSET);
  const draft={title:'西湖 · 六处风景',map:{url:'/assets/scenic/garden-map.png',name:'西湖灵感游览图 · AI 插画',custom:false},spots};
  const published=copy(draft);
  for(const {id,name} of ANGLES.filter(a=>a.id!=='front'))published.spots[0].photos[id]={...completionPhoto(id,name),accepted:true};
  return {schema:6,draft,published,publishedAt:null,publishNumber:1};
}
export function upgradeScenicState(state){
  if(state.schema===6)return state;
  const seed=createScenicState();
  // The existing real asset is bound to its source photo, independently of mock jobs.
  const bindPilot=()=>{
    for(const key of ['draft','published']){
      const s=state[key].spots.find(s=>s.id===PILOT_ID);
      if(s&&canCompleteDemo(s))s.pilotAsset=copy(PILOT_ASSET);
    }
    state.schema=6;return state;
  };
  if(state.schema===5)return bindPilot();
  if(state.schema===3||state.schema===4){
    for(const key of ['draft','published']){
      const s=state[key].spots.find(s=>s.id===PILOT_ID);
      if(s&&s.revision===0&&canCompleteDemo(s))s.world=copy(seed[key].spots[0].world);
    }
    for(const s of state.draft.spots){
      if(s.confirmedRevision!==null&&pendingAngles(s).length)touchSpot(s);
    }
    // Only extend the built-in visitor sample; keep user-published snapshots intact.
    if(!state.publishedAt){
      const s=state.published.spots.find(s=>s.id===PILOT_ID);
      if(s&&canCompleteDemo(s))for(const id of ['back','top'])if(!s.photos[id])s.photos[id]=copy(seed.published.spots[0].photos[id]);
    }
    return bindPilot();
  }
  // Keep earlier work accessible as a backup, and never overwrite uploaded material or custom pins.
  const ids=new Set(['pavilion','willow','bridge','lotus','corridor','landing']);
  const untouched=project=>!project.map.custom&&project.spots.every(s=>ids.has(s.id)&&!Object.values(s.photos).some(p=>p.kind==='upload'));
  if(untouched(state.draft)&&untouched(state.published)){
    seed.previousDemo=copy(state);return seed;
  }
  return bindPilot();
}
export function canCompleteDemo(spot){return spot.id===PILOT_ID&&spot.photos.front?.url==='/assets/real/huagang.jpg';}
export function touchSpot(spot) {
  spot.revision++; spot.confirmedRevision=null; spot.world=null;
  return spot;
}
export function putPhoto(spot, angle, photo) {
  if(!ANGLES.some(a=>a.id===angle))throw Error('未知视角');
  spot.photos[angle]=photo; return touchSpot(spot);
}
export function removePhoto(spot, angle) {delete spot.photos[angle];return touchSpot(spot);}
export function pendingAngles(spot) {return ANGLES.filter(a=>!spot.photos[a.id]);}
export function completeDemo(spot) {
  if(!Object.values(spot.photos).some(p=>p.kind!=='ai-demo'))throw Error('请先上传至少一张参考图片');
  if(!canCompleteDemo(spot))throw Error('本版仅提供花港观鱼原始实拍的补全样例；其他景点请上传实拍视角');
  const missing=pendingAngles(spot);
  if(!missing.length)throw Error('全部视角均已准备好');
  for(const {id} of missing)spot.photos[id]=completionPhoto(id,ANGLES.find(a=>a.id===id).name);
  touchSpot(spot); return spot;
}
export function confirmProblem(spot) {
  if(!spot.name.trim())return '请填写景点名称';
  if(pendingAngles(spot).length)return '请补齐正面、两侧、背面、俯视和近景，再进行确认';
  if(Object.values(spot.photos).some(p=>p.kind==='ai-demo'&&!p.accepted))return '请逐张查看并接受 AI 补全图片';
  return '';
}
export function confirmSpot(spot) {
  const problem=confirmProblem(spot);if(problem)throw Error(problem);
  spot.confirmedRevision=spot.revision;return spot;
}
export function createDemoWorld(spot, expectedRevision) {
  if(spot.revision!==expectedRevision||spot.confirmedRevision!==spot.revision)throw Error('素材已变化，请重新审核确认');
  spot.world={kind:'demo',label:'世界模型流程样例',revision:spot.revision};return spot;
}
export function publishScenic(state) {
  const {draft}=state;
  if(!draft.title.trim()||!draft.spots.length)throw Error('请填写景区名称并添加至少一个景点');
  for(const s of draft.spots){
    if(!s.name.trim()||!Object.keys(s.photos).length)throw Error('每个景点至少需要名称和一张图片');
    if(Object.values(s.photos).some(p=>p.kind==='ai-demo'&&!p.accepted))throw Error('还有未审核的 AI 图片，请先接受或移除');
    if(s.world&&s.world.revision!==s.revision)throw Error('场景对应的素材版本已过期');
  }
  state.published=copy(draft);state.publishNumber++;state.publishedAt=new Date().toISOString();return state;
}
export function visitorExperience(spot) {
  // Supplemental photo review and mocked jobs do not replace this pre-generated asset.
  // Replacing or removing the actual input photo must sever its visitor association.
  return spot.id===PILOT_ID&&spot.pilotAsset?.worldId===PILOT_ASSET.worldId&&
    spot.pilotAsset.referenceUrl===PILOT_ASSET.referenceUrl&&
    spot.photos.front?.kind==='real'&&spot.photos.front.url===PILOT_ASSET.referenceUrl?'world':'gallery';
}
