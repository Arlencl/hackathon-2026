import sources from '../public/assets/real/sources.json' with {type:'json'};
export const PILOT_ID='huagang';
export const PILOT_SOURCE=sources.huagang;
export const realPhoto=(id,name)=>({url:sources[id].path,name,kind:'real',accepted:true,credit:sources[id]});
export const PLACES=[
 {id:'huagang',name:'花港观鱼 · 御碑亭',x:.795,y:.44,description:'到花港观鱼，在御碑亭前停一停。石柱、灰瓦与临水园径，把西湖十景中的一处风景收进眼前。这次先从亭前的一张实拍，试着走进它的空间。',photoName:'花港观鱼御碑亭 · 正面实拍',factSource:'https://wbdl.hzwbzx.cn/house?id=121'},
 {id:'duanqiao',name:'断桥',x:.565,y:.20,description:'桥上是行人的脚步，桥下是铺开的湖光。先看看雨中的断桥，再把这处熟悉的西湖风景放进你的游览清单。',photoName:'雨中的断桥 · 2025 年实拍'},
 {id:'pinghu',name:'平湖秋月',x:.25,y:.29,description:'借一张园林实拍，看看平湖秋月一带的水岸、石桥与树影。不同季节，自有不同的停留理由。',photoName:'平湖秋月园景 · 2010 年实拍'},
 {id:'quyuan',name:'曲院风荷',x:.275,y:.67,description:'从水面延伸到岸边的绿意，是曲院风荷的另一种看法。照片从高处望向园区与玉带桥，夏日荷景则留待下次亲自相遇。',photoName:'曲院风荷一带与玉带桥 · 实拍'},
 {id:'santan',name:'三潭印月',x:.465,y:.81,description:'湖面上的石塔、远处的山和来往的小船，共同组成三潭印月的经典风景。先从湖上的视角，与这处风景相遇。',photoName:'三潭印月石塔与湖面 · 实拍'},
 {id:'leifeng',name:'雷峰塔',x:.672,y:.09,description:'隔着湖面望向雷峰塔，塔影从树梢上显露出来。把视线从近处的水面慢慢移向山丘，感受西湖风景的层次。',photoName:'湖对岸的雷峰塔 · 2025 年实拍'},
];
export function completionPhoto(id,label){return {url:'/assets/completion/huagang-'+({left:'left',rear:'rear',back:'back',top:'top',inside:'detail'}[id])+'.png',name:'御碑亭 · '+label,kind:'ai-demo',accepted:false,credit:{...PILOT_SOURCE,artist:'景见 · imagegen 衍生制作；原摄影 Siyuwj',date:'2026-10-12',changes:'以实拍为参考，AI 推测补充视角；环境、文字与细节发生变化，非真实补拍。',license:'CC BY-SA 4.0'}};}
