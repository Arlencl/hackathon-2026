import {escapeHTML as e} from './core.js';
import {ANGLES,copy,newSpot,putPhoto,removePhoto,pendingAngles,completeDemo,confirmProblem,confirmSpot,createDemoWorld,publishScenic,visitorExperience,canCompleteDemo} from './scenic-core.js';
import {loadScenic,saveScenic,imageFile} from './scenic-store.js';
import './scenic.css';

const ic=name=>`<i data-lucide="${name}"></i>`;
const photoLabel=p=>p.kind==='real'?'实景摄影':p.kind==='ai-demo'?'AI 补全 · 示例':p.kind==='concept'?'AI 概念图':p.kind==='reference'?'参考照片':'景区上传';
const cover=s=>s.photos.front||Object.values(s.photos)[0];
const spotLink=s=>'#spot?id='+encodeURIComponent(s.id);
const creditHTML=p=>p?.credit?`<div class="sw-attribution"><span>${e(p.credit.artist)} · ${e(p.credit.date?.split(' ')[0]||'')}</span><span><a href="${e(p.credit.source)}" target="_blank" rel="noopener noreferrer">原照片与作者</a> · <a href="${e(p.credit.licenseUrl)}" target="_blank" rel="noopener noreferrer">${e(p.credit.license)}</a></span><small>${e(p.credit.changes)}</small></div>`:'';
const imageInput=(id,label,multiple=false)=>`<label class="button outline small sw-upload">${ic('upload')}${label}<input id="${id}" type="file" accept="image/jpeg,image/png,image/webp" ${multiple?'multiple':''}></label>`;

export function mountScenic(host,{mode,hydrate,toast}) {
  let alive=true, state, selected='huagang', section='map', placement='', busy='', progress=0, saveError='', saving=false, listView=false, activeAngle='front', jobTimer;
  let galleryDialog;
  const $=s=>host.querySelector(s), $$=s=>[...host.querySelectorAll(s)];
  const isCreator=mode==='studio';
  const spot=()=>state.draft.spots.find(s=>s.id===selected);
  const notify=message=>{if(alive)toast(message);};
  function frame(body){
    return `<header class="header sw-header"><a class="brand" href="#home"><img src="/favicon.svg" alt=""><span>景见<small>JINGJIAN</small></span></a><nav aria-label="主导航"><a href="#home">发现风景</a><a href="#map" class="${isCreator?'':'active'}">景区地图</a><a href="#pitch">关于作品</a></nav><div class="header-actions"><a class="button small ${isCreator?'primary':'outline'}" href="${isCreator?'#map':'#studio'}">${ic(isCreator?'eye':'panels-top-left')}${isCreator?'游客端预览':'景区工作台'}</a></div></header>${body}`;
  }
  async function persist(message,redraw=true){
    saving=true;
    try{await saveScenic(state);saveError='';if(message)notify(message);}catch{saveError='本机保存失败。请立即导出备份，刷新可能丢失本次修改。';notify(saveError);}finally{saving=false;}
    if(redraw&&alive)draw();
  }
  function guarded(action){return async ev=>{try{if(!busy)await action(ev);}catch(err){notify(err.message);}};}
  function mapHTML(project,edit=false){
    return `<div class="sw-map-shell ${edit?'sw-edit-map':''}"><div class="sw-map-canvas ${placement?'is-placing':''}" id="scenic-map-canvas"><img class="sw-map-image" src="${e(project.map.url)}" alt="${e(project.map.name)}" draggable="false">${project.spots.map((s,i)=>`<button class="sw-marker ${selected===s.id?'selected':''}" style="left:${s.x*100}%;top:${s.y*100}%" data-marker="${e(s.id)}" aria-label="选择景点：${e(s.name)}" aria-pressed="${selected===s.id}"><span>${String(i+1).padStart(2,'0')}</span><b>${e(s.name)}</b></button>`).join('')}</div><div class="sw-map-legend"><span>${ic('map')} ${project.map.custom?'景区上传地图':'插画景点索引 · 位置非真实地理坐标'}</span><span>${edit?(placement==='add'?'点击地图放置新景点':placement==='move'?'点击地图设置新位置':'选择点位进行编辑'):'点击地图上的景点，看看那里的风景'}</span></div></div>`;
  }
  function pointList(project,edit=false){return project.spots.map((s,i)=>`<button class="sw-place-row ${selected===s.id?'selected':''}" data-select="${e(s.id)}"><span class="sw-row-number">${String(i+1).padStart(2,'0')}</span>${cover(s)?`<img loading="lazy" src="${e(cover(s).url)}" alt="">`:`<span class="sw-no-photo">${ic('image')}</span>`}<span><b>${e(s.name)}</b><small>${edit?(s.world?'场景已就绪 · '+(s.world.kind==='demo'?'演示':'已接入'):s.confirmedRevision===s.revision?'素材已确认':Object.keys(s.photos).length+' / '+ANGLES.length+' 个视角'):visitorExperience(s)==='world'?'可进入三维体验':'图片赏景'}</small></span>${ic('chevron-right')}</button>`).join('');}
  function drawVisitor(){
    const p=state.published;
    if(!p.spots.some(s=>s.id===selected))selected=p.spots[0]?.id;
    const s=p.spots.find(x=>x.id===selected);
    if(mode==='spot')return drawDetail();
    host.innerHTML=frame(`<main class="sw-visitor page"><div class="sw-visitor-heading"><div><div class="eyebrow">EXPLORE AT YOUR OWN PACE</div><h1>${e(p.title)}</h1><p>循着地图，找到让你心动的那一处。</p></div><div class="sw-segments" role="group" aria-label="展示方式"><button data-layout="map" class="${!listView?'active':''}">${ic('map')}地图</button><button data-layout="list" class="${listView?'active':''}">${ic('layout-grid')}景点</button></div></div>${listView?`<div class="sw-destination-grid">${p.spots.map(x=>`<a class="sw-destination" href="${spotLink(x)}"><img loading="lazy" src="${e(cover(x)?.url||'/assets/westlake-concept.png')}" alt="${e(x.name)}"><div><span class="sw-tag">${visitorExperience(x)==='world'?'三维漫游':'图片赏景'}</span><h2>${e(x.name)}</h2><p>${e(x.description)}</p><span class="sw-text-link">看看这里 ${ic('arrow-up-right')}</span></div></a>`).join('')}</div>`:`<div class="sw-explore-layout">${mapHTML(p)}</div><div class="sw-place-strip">${pointList(p)}</div>`}<div class="sw-visitor-foot"><span>一湖山色，慢慢相遇。</span><small>真实景点与实景摄影 · AI 图像单独标识</small></div></main>`);
    bindMap(false);
    $$('[data-layout]').forEach(b=>b.onclick=()=>{listView=b.dataset.layout==='list';draw();});
  }
  function drawDetail(){
    const id=new URLSearchParams(location.hash.split('?')[1]).get('id');
    const p=state.published,s=p.spots.find(x=>x.id===id);
    if(!s){host.innerHTML=frame(`<main class="page sw-empty"><h1>这个景点暂时没有开放预览</h1><p>回到地图，发现其他风景。</p><a class="button primary" href="#map">回到景区地图</a></main>`);return;}
    const photos=Object.entries(s.photos);if(!s.photos[activeAngle])activeAngle=photos[0]?.[0];const shown=s.photos[activeAngle];
    host.innerHTML=frame(`<main class="sw-detail page"><a class="sw-back" href="#map">${ic('arrow-left')}回到景区地图</a><div class="sw-detail-layout"><section><div class="sw-photo-stage"><img src="${e(shown?.url)}" alt="${e(s.name)} · ${e(ANGLES.find(a=>a.id===activeAngle)?.name||'景区图片')}"><span class="sw-photo-credit">${shown?photoLabel(shown):''}</span><span class="sw-photo-count">${photos.findIndex(([id])=>id===activeAngle)+1} / ${photos.length}</span><button class="sw-expand" id="visitor-enlarge" aria-label="放大当前图片">${ic('maximize')}</button></div><div class="sw-thumbnails">${photos.map(([id,p])=>`<button data-gallery="${id}" class="${id===activeAngle?'active':''}" aria-label="查看${e(ANGLES.find(a=>a.id===id)?.name||id)}" aria-pressed="${id===activeAngle}"><img src="${e(p.url)}" alt=""><span>${e(ANGLES.find(a=>a.id===id)?.name||id)}</span></button>`).join('')}</div>${creditHTML(shown)}</section><aside class="sw-story"><div class="eyebrow">A MOMENT BY THE LAKE</div><h1>${e(s.name)}</h1><div class="sw-story-tags"><span>${ic('map-pin')}${e(p.title)}</span><span>${ic('leaf')}慢赏风景</span></div><p>${e(s.description||'沿着自己的节奏，发现这里的风景。')}</p>${visitorExperience(s)==='world'?`<a class="button primary large full" href="#pilot">${ic('box')}走进这片风景 ${ic('arrow-up-right')}</a><small class="sw-quiet">实拍驱动的三维试点，可环顾与移动；未拍摄区域由模型推测。</small>`:`<div class="sw-photo-note">${ic('images')}<span>用照片，先与这里相遇。<small>此景点当前提供图片预览。</small></span></div>`}<div class="sw-story-note"><h3>关于这段风景</h3>${s.factSource?`<a class="sw-text-link" href="${e(s.factSource)}" target="_blank" rel="noopener noreferrer">景点资料 · 杭州文保导览</a>`:''}<p>${Object.values(s.photos).some(p=>['ai-demo','concept'].includes(p.kind))?'本页包含 AI 概念或补全图像，用于呈现游览氛围；未拍摄部分为推测，实际景观请以现场为准。':'图片用于景观参考；地图为游览示意，实际位置与开放情况请以景区信息为准。'}</p></div><a class="sw-text-link" href="#map">继续发现下一处 ${ic('arrow-right')}</a></aside></div></main>`);
    $$('[data-gallery]').forEach(b=>b.onclick=()=>{activeAngle=b.dataset.gallery;draw();});
    $('#visitor-enlarge').onclick=()=>showImage(s,activeAngle,false);
  }
  function creatorMap(){
    const p=state.draft,s=spot();
    return `<div class="sw-section-head"><div><div class="eyebrow">01 / SCENIC MAP</div><h1>从一张地图开始。</h1><p>上传景区地图，标记每个值得走进去的地方。</p></div>${imageInput('map-upload','上传景区地图')}</div><div class="sw-map-editor"><section><div class="sw-map-toolbar"><label>景区名称<input id="scenic-title" maxlength="60" value="${e(p.title)}"></label><div class="sw-map-buttons"><button class="button ${placement==='add'?'primary':'outline'} small" id="add-point">${ic('map-pin-plus')}${placement==='add'?'取消标记':'添加景点'}</button>${s?`<button class="button outline small" id="move-point">${ic('move')}${placement==='move'?'取消定位':'移动所选点位'}</button>`:''}</div></div>${mapHTML(p,true)}<p class="sw-hint">JPG / PNG / WebP，单张不超过 12 MB。点位随地图按比例定位；更换地图后请核对位置。</p></section><aside class="sw-map-inspector"><div class="sw-panel-caption"><span>景点目录</span><small>${p.spots.length} / 20</small></div>${pointList(p,true)}${s?`<div class="sw-spot-form"><label>景点名称<input id="spot-name" maxlength="40" value="${e(s.name)}"></label><label>游客看到的介绍<textarea id="spot-description" rows="3" maxlength="500" placeholder="介绍这里值得停留的理由">${e(s.description)}</textarea></label><div class="sw-position-fields"><label>横向位置 %<input id="spot-x" type="number" min="3" max="97" step="0.1" value="${(s.x*100).toFixed(1)}"></label><label>纵向位置 %<input id="spot-y" type="number" min="5" max="92" step="0.1" value="${(s.y*100).toFixed(1)}"></label></div><button class="button primary full" id="edit-photos">管理这个景点的素材 ${ic('arrow-right')}</button><button class="plain sw-danger" id="delete-spot">${ic('trash-2')}移除景点</button></div>`:`<div class="sw-empty"><p>先添加一个景点，<br>再为它准备多视角素材。</p></div>`}</aside></div>`;
  }
  function photoCard(s,a){
    const p=s.photos[a.id];
    return `<article class="sw-angle ${p?.kind==='ai-demo'?'is-ai':''}"><div class="sw-angle-top"><b>${a.name}</b><span>${p?(p.kind==='ai-demo'?(p.accepted?'已接受':'待审核'):'已导入'):'待补充'}</span></div>${p?`<button class="sw-angle-image" data-inspect="${a.id}" aria-label="查看${a.name}大图"><img src="${e(p.url)}" alt="${e(p.name)}"><span>${ic('maximize')}</span></button><div class="sw-angle-meta"><span class="sw-tag ${p.kind==='ai-demo'?'ai':''}">${photoLabel(p)}</span><small title="${e(p.name)}">${e(p.name)}</small></div><div class="sw-angle-actions">${p.kind==='ai-demo'?`<button class="plain" data-inspect="${a.id}">${ic(p.accepted?'circle-check':'scan-eye')}${p.accepted?'重新查看':'查看并审核'}</button>`:`<label class="plain sw-upload">${ic('replace')}替换<input type="file" data-angle-upload="${a.id}" accept="image/jpeg,image/png,image/webp"></label>`}<button class="plain sw-danger" data-remove="${a.id}" aria-label="移除${a.name}">${ic('trash-2')}移除</button></div>`:`<label class="sw-empty-angle sw-upload">${ic('image-plus')}<b>上传${a.name}</b><small>${a.hint}</small><input type="file" data-angle-upload="${a.id}" accept="image/jpeg,image/png,image/webp"></label>`}</article>`;
  }
  function creatorPhotos(){
    const s=spot();if(!s)return `<div class="sw-empty"><h2>先在地图上添加景点</h2><button class="button primary" data-section="map">去标记景点</button></div>`;
    const count=Object.keys(s.photos).length,pending=Object.values(s.photos).filter(p=>p.kind==='ai-demo'&&!p.accepted).length,confirmed=s.confirmedRevision===s.revision;
    return `<div class="sw-section-head"><div><div class="eyebrow">02 / MULTI-VIEW MATERIALS</div><h1>让风景，多几个视角。</h1><p>按景点整理图片，补足缺失视角，再审核确认。</p></div><label class="sw-spot-selector">当前景点<select id="photo-spot">${state.draft.spots.map(x=>`<option value="${e(x.id)}" ${x.id===selected?'selected':''}>${e(x.name)}</option>`).join('')}</select></label></div><div class="sw-material-summary"><div><span class="sw-number">${count}<small>/ ${ANGLES.length}</small></span><span><b>${e(s.name)}</b><small>${pending?pending+' 张 AI 图片等待审核':confirmed?'已确认，可以进入世界模型步骤':'支持实拍上传与 AI 辅助补全'}</small></span></div><div class="button-row">${imageInput('batch-upload','批量上传视角',true)}<button class="button primary" id="complete-angles" ${!pendingAngles(s).length||!count||!canCompleteDemo(s)?'disabled':''}>${ic('sparkles')}AI 补全缺失视角</button></div></div><div class="sw-demo-note">${ic('sparkles')}<span><b>补全演示</b> · 本版先试点「花港观鱼·御碑亭」。基于它的原始实拍预生成了五个补充视角（两侧、背面、俯视、近景），点击后模拟返回；替换参考图或切换其他景点后，请上传实拍，实时生成 API 待接入。</span></div><div class="sw-angles">${ANGLES.map(a=>photoCard(s,a)).join('')}</div>${busy==='completion'?`<div class="sw-job" role="status"><span class="sw-spinner"></span><div><b>正在准备示例视角…</b><p>载入预生成的补全图片，即将进入人工审核。</p></div></div>`:''}<div class="sw-review-bar"><div>${ic(confirmed?'badge-check':'clipboard-check')}<span><b>${confirmed?'这组素材已确认':'完成审核，再进入下一步'}</b><small>${confirmed?'修改图片会自动撤销确认。':'检查主体、前后关系与细节；不合适的图片可以移除重传。'}</small></span></div><button class="button ${confirmed?'outline':'primary'}" id="confirm-materials" ${confirmProblem(s)?'disabled':''}>${confirmed?'进入世界模型':ic('check')+' 确认素材，进入下一步'} ${ic('arrow-right')}</button></div>${confirmProblem(s)?`<p class="sw-hint">${e(confirmProblem(s))}</p>`:''}`;
  }
  function creatorWorld(){
    const s=spot();if(!s)return `<div class="sw-empty"><h2>先添加一个景点</h2><button class="button primary" data-section="map">返回地图</button></div>`;
    const confirmed=s.confirmedRevision===s.revision;
    if(s.world?.kind==='pilot')return `<div class="sw-section-head"><div><div class="eyebrow">03 / WORLD CREATION</div><h1>一个真实景点，先走通。</h1><p>花港观鱼 · 御碑亭已接入独立的 Marble 三维资产。</p></div></div><div class="sw-world-layout"><section class="sw-world-preview"><img src="/assets/real/huagang.jpg" alt="御碑亭原始实拍"><div class="sw-world-overlay"><span class="sw-tag">已完成 · 真实 API 试点</span><h2>从这张照片，走近御碑亭。</h2></div></section><aside class="sw-world-controls"><h3>本次试点记录</h3><p class="sw-hint">输入为 Siyuwj 拍摄的一张真实照片。三维资产由 Marble 1.1 生成，未见区域由模型推测；AI 补图未送入此次生成。</p><a class="button primary full" href="#pilot">${ic('box')}打开御碑亭三维试点</a><a class="plain" href="/assets/world/huagang-generation.json" target="_blank" rel="noopener">查看生成记录 ${ic('external-link')}</a><div class="sw-demo-note"><span>继续体验多视角工作流时，补全按钮返回预生成图片，新的生成按钮运行模拟任务。修改图片会撤销当前草稿的场景关联。</span></div><button class="button outline full" data-section="photos">准备多视角素材 ${ic('arrow-right')}</button><button class="plain" data-section="publish">前往发布预览 ${ic('arrow-right')}</button></aside></div>`;
    return `<div class="sw-section-head"><div><div class="eyebrow">03 / WORLD CREATION</div><h1>把视角，连接成体验。</h1><p>当前景点：${e(s.name)} · 每个景点单独管理生成结果。</p></div><button class="button outline small" data-section="photos">${ic('arrow-left')}返回素材审核</button></div><div class="sw-world-layout"><section class="sw-world-preview"><img src="${e(cover(s)?.url||'/assets/westlake-concept.png')}" alt="${e(s.name)}参考图"><div class="sw-world-overlay"><span class="sw-tag">流程演示</span><h2>${s.world?'演示任务已完成':'从二维视角，到三维想象。'}</h2><p>${s.world?'此结果用于核验创建流程，未产生新的三维资产。':'准备好素材，便可以开始创建。'}</p></div></section><aside class="sw-world-controls"><h3>创建前检查</h3><div class="sw-check-item">${ic(Object.keys(s.photos).length===ANGLES.length?'circle-check':'circle')}<span>六个视角准备完成<small>当前 ${Object.keys(s.photos).length} / ${ANGLES.length}</small></span></div><div class="sw-check-item">${ic(confirmed?'circle-check':'circle')}<span>素材经过人工确认<small>${confirmed?'审核与当前素材版本一致':'请先返回素材页面完成审核'}</small></span></div><div class="sw-demo-note"><span><b>世界模型 · 模拟任务</b><br>本次不会调用付费接口，也不会生成新资产。真实 API 接入保留在高级工作台。</span></div>${busy==='world'?`<div class="sw-job" role="status"><span class="sw-spinner"></span><div><b>${['整理已确认素材','模拟世界模型处理','准备结果预览'][Math.min(2,Math.floor(progress/34))]}</b><p>模拟进度 ${progress}%</p></div></div><progress value="${progress}" max="100" aria-label="模拟生成进度"></progress>`:`<button class="button primary full" id="generate-demo-world" ${!confirmed||s.world?'disabled':''}>${ic(s.world?'circle-check':'box')}${s.world?'演示任务已完成':'生成世界模型 · 演示'}</button>`}${s.world?`<a class="button outline full" href="#pilot">${ic('external-link')}查看御碑亭三维试点</a><p class="sw-hint">这里打开的是以御碑亭原始实拍生成的独立试点，不是本次模拟任务的结果。模拟任务发布后只提供图片赏景。</p>`:''}<button class="plain" data-section="publish">前往发布预览 ${ic('arrow-right')}</button></aside></div>`;
  }
  function creatorPublish(){
    const p=state.draft;
    return `<div class="sw-section-head"><div><div class="eyebrow">04 / VISITOR PREVIEW</div><h1>让每一处风景，都有入口。</h1><p>先检查游客会看到的内容，再更新游客预览。</p></div><a class="button outline small" href="#map">${ic('external-link')}打开当前游客端</a></div><div class="sw-publish-layout"><section class="sw-publish-summary"><h2>${e(p.title)}</h2><p>${p.spots.length} 个景点 · 地图与图片均使用独立发布快照</p>${p.spots.map(s=>`<div class="sw-publish-row">${cover(s)?`<img loading="lazy" src="${e(cover(s).url)}" alt="">`:ic('image')}<div><b>${e(s.name)}</b><small>${Object.keys(s.photos).length} 张图片 · ${visitorExperience(s)==='world'?'三维漫游':'图片赏景'}${s.world?.kind==='demo'?' · 模拟生成结果不作为三维资产发布':''}</small></div><button class="plain" data-review-spot="${e(s.id)}">检查 ${ic('arrow-right')}</button></div>`).join('')}</section><aside class="sw-publish-panel"><span class="sw-tag">本浏览器体验</span><h3>更新游客预览</h3><p>发布后，当前浏览器的游客地图与景点详情会使用这份内容。继续编辑草稿，不会改变已发布快照。</p><label class="sw-check-label"><input type="checkbox" id="publish-rights">已核对图片使用权、AI 标记和游客介绍。</label><button class="button primary full" id="publish-map">${ic('send')}发布到本机游客预览</button><small>当前 v${state.publishNumber}${state.publishedAt?' · '+new Date(state.publishedAt).toLocaleString('zh-CN',{hour12:false}):' · 内置演示'}</small><div class="sw-local-note">当前版本将上传素材保存在此浏览器。其他人访问网站会看到内置演示，不会收到你的本机草稿；景区多人维护与云端素材发布待接入。</div></aside></div>`;
  }
  function drawCreator(){
    if(!spot())selected=state.draft.spots[0]?.id;
    const sections=[['map','map','景区地图'],['photos','images','多视角素材'],['world','box','世界模型'],['publish','send','发布预览']];
    host.innerHTML=frame(`<div class="sw-workspace"><aside class="sw-sidebar"><div class="eyebrow">CREATOR STUDIO</div><div class="sw-workspace-title">景区维护端<small>${e(state.draft.title)}</small></div><nav aria-label="景区维护导航">${sections.map(([id,icon,name],i)=>`<button data-section="${id}" class="${section===id?'active':''}">${ic(icon)}${name}<small>0${i+1}</small></button>`).join('')}</nav><div class="sw-sidebar-foot"><span>${ic(saveError?'cloud-off':'hard-drive')}${saveError?'本机保存失败':saving?'正在保存':'自动保存到本机'}</span><p>草稿与游客端分开。<br>审核发布后，预览才会更新。</p><button class="plain" id="export-scenic">${ic('download')}导出含图片的备份</button><a class="plain" href="#legacy-studio">讲解与模型 API 接入 ${ic('arrow-up-right')}</a></div></aside><main class="sw-work-main"><div class="sw-work-top"><span>工作空间 <span>/</span> ${sections.find(s=>s[0]===section)[2]}</span><span class="sw-tag">演示项目 · 本机保存</span></div>${saveError?`<p class="sw-save-error" role="alert">${e(saveError)}</p>`:''}<fieldset class="sw-fieldset" ${busy?'disabled':''}>${section==='map'?creatorMap():section==='photos'?creatorPhotos():section==='world'?creatorWorld():creatorPublish()}</fieldset></main></div>`);
    bindCreator();
  }
  function bindMap(edit){
    $$('[data-marker],[data-select]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();selected=b.dataset.marker||b.dataset.select;if(!edit){location.hash=spotLink({id:selected});return;}placement='';draw();});
    if(edit)$('#scenic-map-canvas').onclick=guarded(async ev=>{
      if(!placement)return;const rect=ev.currentTarget.getBoundingClientRect();
      const x=Math.max(.03,Math.min(.97,(ev.clientX-rect.left)/rect.width)),y=Math.max(.05,Math.min(.92,(ev.clientY-rect.top)/rect.height));
      if(placement==='add'){if(state.draft.spots.length>=20)throw Error('演示版最多支持 20 个景点');const s=newSpot(crypto.randomUUID(),x,y);s.name='新景点 '+(state.draft.spots.length+1);state.draft.spots.push(s);selected=s.id;}else if(spot()){spot().x=x;spot().y=y;}
      placement='';await persist('点位已保存到草稿');
    });
  }
  function bindCreator(){
    $$('[data-section]').forEach(b=>b.onclick=()=>{if(!busy){section=b.dataset.section;placement='';draw();}});
    $('#export-scenic').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'jingjian-scenic-backup',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='景见-地图与多视角备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
    if(section==='map'){
      bindMap(true);
      $('#scenic-title').onchange=guarded(async ev=>{const value=ev.target.value.trim();if(!value){ev.target.value=state.draft.title;throw Error('景区名称不能为空');}state.draft.title=value;await persist();});
      $('#map-upload').onchange=guarded(async ev=>{const f=ev.target.files[0];if(!f)return;const image=await imageFile(f);state.draft.map={url:image.url,name:image.name,custom:true};await persist('地图已替换，请核对每个景点的位置');});
      $('#add-point').onclick=()=>{placement=placement==='add'?'':'add';draw();};
      if(!spot())return;
      $('#move-point').onclick=()=>{placement=placement==='move'?'':'move';draw();};
      $('#spot-name').onchange=guarded(async ev=>{const value=ev.target.value.trim();if(!value){ev.target.value=spot().name;throw Error('景点名称不能为空');}spot().name=value;await persist();});
      $('#spot-description').onchange=guarded(async ev=>{spot().description=ev.target.value;await persist();});
      for(const axis of ['x','y'])$('#spot-'+axis).onchange=guarded(async ev=>{if(!ev.target.reportValidity()||ev.target.value===''){ev.target.value=(spot()[axis]*100).toFixed(1);return;}spot()[axis]=Number(ev.target.value)/100;await persist();});
      $('#edit-photos').onclick=()=>{section='photos';draw();};
      $('#delete-spot').onclick=()=>showDelete();
    }
    if(section==='photos'&&spot()){
      $('#photo-spot').onchange=ev=>{selected=ev.target.value;draw();};
      $$('[data-angle-upload]').forEach(input=>input.onchange=guarded(async ev=>{const s=spot(),f=ev.target.files[0];if(!f)return;putPhoto(s,input.dataset.angleUpload,await imageFile(f));await persist('图片已加入草稿，需要重新确认素材');}));
      $('#batch-upload').onchange=guarded(async ev=>{const s=spot(),files=[...ev.target.files],missing=pendingAngles(s);if(!files.length)return;if(!missing.length)throw Error('所有视角已填满，请使用单张替换');if(files.length>missing.length)throw Error('还剩 '+missing.length+' 个空位，请选择不超过这个数量的图片');const photos=await Promise.all(files.map(imageFile));photos.forEach((p,i)=>putPhoto(s,missing[i].id,p));await persist('已按空缺视角顺序导入，请核对图片对应关系');});
      $$('[data-remove]').forEach(b=>b.onclick=guarded(async()=>{removePhoto(spot(),b.dataset.remove);await persist();}));
      $$('[data-inspect]').forEach(b=>b.onclick=()=>showImage(spot(),b.dataset.inspect,true));
      $('#complete-angles').onclick=guarded(()=>runCompletion());
      $('#confirm-materials').onclick=guarded(async()=>{confirmSpot(spot());section='world';await persist('素材已确认');});
    }
    if(section==='world'&&spot())$('#generate-demo-world')?.addEventListener('click',guarded(()=>runWorld()));
    if(section==='publish'){
      $$('[data-review-spot]').forEach(b=>b.onclick=()=>{selected=b.dataset.reviewSpot;section='photos';draw();});
      $('#publish-map').onclick=guarded(async()=>{if(!$('#publish-rights').checked)throw Error('请先确认图片使用权、AI 标记和游客介绍');const next=copy(state);publishScenic(next);await saveScenic(next);state=next;draw();notify('游客预览已更新，草稿继续独立保存');});
    }
  }
  function dialog(html){
    galleryDialog?.remove();galleryDialog=document.createElement('dialog');galleryDialog.className='sw-dialog';galleryDialog.innerHTML=html;document.body.appendChild(galleryDialog);galleryDialog.showModal();hydrate();
    galleryDialog.addEventListener('click',ev=>{if(ev.target===galleryDialog)galleryDialog.close();});
    galleryDialog.addEventListener('close',()=>{galleryDialog?.remove();galleryDialog=null;},{once:true});
    galleryDialog.querySelector('[data-close]')?.addEventListener('click',()=>galleryDialog.close());return galleryDialog;
  }
  function showDelete(){
    const s=spot();const d=dialog(`<div class="sw-dialog-copy"><h2>移除「${e(s.name)}」？</h2><p>此操作会移除草稿中的点位和素材；当前游客预览保持原样，直到下一次发布。</p><div class="button-row"><button class="button outline" data-close>保留景点</button><button class="button primary" id="remove-confirmed">确认移除</button></div></div>`);
    d.querySelector('#remove-confirmed').onclick=async()=>{state.draft.spots=state.draft.spots.filter(x=>x.id!==s.id);selected=state.draft.spots[0]?.id;d.close();await persist('已从草稿移除');};
  }
  function showImage(s,angle,review){
    const p=s.photos[angle],a=ANGLES.find(a=>a.id===angle);if(!p)return;
    const d=dialog(`<div class="sw-dialog-top"><span>${e(s.name)} / ${a.name}</span><button class="plain" data-close aria-label="关闭图片预览">${ic('x')}</button></div><img class="sw-dialog-image" src="${e(p.url)}" alt="${e(p.name)}"><div class="sw-dialog-copy"><span class="sw-tag ${p.kind==='ai-demo'?'ai':''}">${photoLabel(p)}</span><p>${p.kind==='ai-demo'?'这是预生成的御碑亭补全样片。请对照正面实拍检查屋顶、石柱、碑体与环境关系；背面和俯视包含不可见区域的推测，画面合理并不代表真实准确。':p.kind==='upload'?'景区上传素材，请核对位置、视角与使用权。':'演示参考素材，不作为真实景区测绘依据。'}</p>${creditHTML(p)}${review&&p.kind==='ai-demo'?`<div class="button-row"><button class="button outline" id="reject-image">移除此图，重新准备</button><button class="button primary" id="accept-image">${ic('check')}${p.accepted?'保留已接受状态':'接受这张示例补全图'}</button></div>`:''}</div>`);
    if(review&&p.kind==='ai-demo'){
      d.querySelector('#accept-image').onclick=async()=>{p.accepted=true;d.close();await persist('已接受该视角');};
      d.querySelector('#reject-image').onclick=async()=>{removePhoto(s,angle);d.close();await persist('已移除，请上传替代图片或再次补全');};
    }
  }
  async function runCompletion(){
    const s=spot();busy='completion';draw();
    try{await new Promise(resolve=>{jobTimer=setTimeout(resolve,1400);});if(!alive)return;completeDemo(s);await persist('示例补全已准备好，请逐张打开审核',false);}catch(err){notify(err.message);}finally{busy='';if(alive)draw();}
  }
  function runWorld(){
    const s=spot(),revision=s.revision;if(s.confirmedRevision!==revision)throw Error('请先确认素材');busy='world';progress=0;draw();
    jobTimer=setInterval(async()=>{if(!alive){clearInterval(jobTimer);return;}progress=Math.min(100,progress+20);if(progress<100){draw();return;}clearInterval(jobTimer);try{createDemoWorld(s,revision);await persist('模拟生成完成；没有消耗世界模型额度',false);}catch(err){notify(err.message);}finally{busy='';if(alive)draw();}},650);
  }
  function draw(){if(!alive||!state)return;if(isCreator)drawCreator();else drawVisitor();hydrate();}
  host.innerHTML=frame(`<main class="page sw-empty" role="status">正在打开景区…</main>`);
  loadScenic().then(value=>{if(alive){state=value;draw();}}).catch(err=>notify(err.message));
  return ()=>{alive=false;clearTimeout(jobTimer);clearInterval(jobTimer);galleryDialog?.remove();};
}
