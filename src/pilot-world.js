import {escapeHTML as e} from './core.js';
import {PILOT_SOURCE} from './scenic-places.js';
const ic=name=>`<i data-lucide="${name}"></i>`;
export function mountPilotWorld(host,{hydrate}){
 let disposed=false,viewer;
 host.innerHTML=`<header class="header sw-header"><a class="brand" href="#home"><img src="/favicon.svg" alt=""><span>景见<small>JINGJIAN</small></span></a><a class="button outline small" href="#spot?id=huagang">${ic('arrow-left')}返回实景照片</a></header><main class="page sw-pilot"><div class="sw-visitor-heading"><div><div class="eyebrow">ONE PLACE, A LITTLE CLOSER</div><h1>花港观鱼 · 御碑亭</h1><p>从一张真实照片出发，走近亭前的风景。</p></div><span class="sw-tag">实拍驱动 · 三维试点</span></div><section class="sw-pilot-scene" id="pilot-scene"><div class="sw-pilot-top"><span id="pilot-status" role="status">正在载入三维试点…</span><button class="button small" id="pilot-reset">${ic('rotate-ccw')}回到起点</button></div><div class="sw-pilot-bottom"><span>拖动环顾 · WASD 移动 · Q / E 升降</span><span id="pilot-distance">距起点 0.0 m</span></div></section><div class="sw-pilot-controls" role="group" aria-label="漫游移动"><button data-pilot-move="left" aria-label="向左移动">← 左移</button><button data-pilot-move="forward" aria-label="向前移动">↑ 前进</button><button data-pilot-move="back" aria-label="向后移动">↓ 后退</button><button data-pilot-move="right" aria-label="向右移动">→ 右移</button><button data-pilot-move="up" aria-label="升高视点">升高</button><button data-pilot-move="down" aria-label="降低视点">降低</button></div><div class="sw-pilot-notes"><div><h3>先看亭子，再看看周围</h3><p>用按钮或键盘移几步，拖动画面环顾。远离照片原始视点时，细节可能变形或出现空洞，随时可以回到起点。当前漫游没有碰撞限制，不能用于判断实地路线。</p></div><div><h3>关于这次试点</h3><p>Marble 1.1 使用一张御碑亭实拍生成空间，未拍到的周边由模型推测。维护端的 AI 补图用于审核演示，没有送入本次世界模型。<a href="/assets/world/huagang-generation.json" target="_blank" rel="noopener">查看生成记录</a></p><p>原摄影：${e(PILOT_SOURCE.artist)}，2021-01-17；景见 AI 衍生，2026-10-12。<a href="${e(PILOT_SOURCE.source)}" target="_blank" rel="noopener">原图来源</a> · <a href="${e(PILOT_SOURCE.licenseUrl)}" target="_blank" rel="noopener">CC BY-SA 4.0</a></p></div></div></main>`;
 hydrate();
 const status=host.querySelector('#pilot-status'),scene=host.querySelector('#pilot-scene');
 const fail=()=>{if(!disposed){status.textContent='三维资产未能载入，请返回实景照片';scene.classList.add('sw-pilot-failed');scene.style.backgroundImage="linear-gradient(#123b3150,#123b3180),url('/assets/real/huagang.jpg')";}};
 Promise.all([import('./viewer.js'),fetch('/assets/world/huagang-generation.json').then(r=>{if(!r.ok)throw Error('Missing receipt');return r.json();})]).then(([{createViewer},receipt])=>{
  if(disposed)return;
  const eye=receipt.semantics.ground_plane_offset;
  const config={...receipt.semantics,home:receipt.view?.home||[0,eye,0],target:receipt.view?.target||[0,eye,-4]};
  viewer=createViewer(scene,{points:[],splatURL:'/assets/world/huagang-500k.spz',splatConfig:config,onStatus:value=>{if(!disposed){if(value==='error')fail();else status.textContent=value==='splat'?'御碑亭 · 可以开始漫游':'正在载入三维资产…';}},onPosition:({distance})=>{if(!disposed)host.querySelector('#pilot-distance').textContent='距起点 '+distance.toFixed(1)+' m';}});
  host.querySelector('#pilot-reset').onclick=()=>viewer.reset();
  host.querySelectorAll('[data-pilot-move]').forEach(b=>{
   let held=false,started=0;
   b.onpointerdown=ev=>{held=true;started=performance.now();b.setPointerCapture(ev.pointerId);viewer.setMove(b.dataset.pilotMove,true);};
   const release=()=>{held=false;viewer.setMove(b.dataset.pilotMove,false);};
   b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;b.onblur=release;
   b.onclick=ev=>{if(!held&&(ev.detail===0||performance.now()-started<180))viewer.move(b.dataset.pilotMove);};
  });
 }).catch(fail);
 return()=>{disposed=true;viewer?.dispose();};
}
