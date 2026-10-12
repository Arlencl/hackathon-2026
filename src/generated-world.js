import receipt from '../public/assets/world/generation.json' with {type:'json'};
import {SOURCES} from './data.js';
export const WORLD_RECEIPT=receipt;
const eye=receipt.semantics.ground_plane_offset;
export const WORLD_CONFIG={...receipt.semantics,home:[0,eye,0],target:[0,eye,-4],views:{
  shore:{camera:[0,eye,0],target:[0,eye,-4]},
  pavilion:{camera:[0,eye,-5.5],target:[10,3,-10]},
  lake:{camera:[-4.5,eye,-8.5],target:[6,eye,-17]}
}};
export const GENERATED_WORLD={
  schemaVersion:1,title:'湖畔 · 初见',subtitle:'从一张图，走进一片空间。',description:'Marble 1.1 从概念图生成的三维湖畔体验。',rightsConfirmed:true,
  world:{mode:'splat',url:'/assets/world/lakeside-500k.spz',prompt:''},
  sources:[...SOURCES,{id:'generated',title:'景见 · 湖畔生成与核验记录',url:'',license:'Marble 1.1 API 生成；输入为本项目 AI 概念图；非实景复刻',accessed:'2026-10-10'}],
  points:[
    {id:'shore',name:'湖畔初见',nameEn:'First Look',tag:'整体 / 山水',position:[0,0,0],minutes:3,interest:'relax',reviewed:true,sourceIds:['generated','editorial'],notice:'',noticeEn:'',
      text:'眼前这片湖景，是由一张概念图生成的三维空间。试着轻轻转动视角，再向前或向侧面移动，观察近处石岸与远山的关系。它是一段想象中的湖畔体验，并非西湖某处景点的实地复刻。',
      textEn:'This lakeside scene is a 3D world generated from a single piece of concept art. Look around, then move gently forward or sideways to see how the near shore relates to the distant hills. It is an imagined visitor experience, not a reconstruction of a real West Lake attraction.'},
    {id:'pavilion',name:'临水小亭',nameEn:'Lakeside Pavilion',tag:'建筑 / 文化',position:[0,0,-5.5],minutes:3,interest:'culture',reviewed:true,sourceIds:['generated','unesco','editorial'],notice:'',noticeEn:'',
      text:'小亭为看风景提供了一个停留的地方。西湖文化景观中，亭台与园林是自然和人工景物相互映衬的一部分。这里的小亭是模型根据概念图生成的建筑，不对应真实古迹；靠近时可以看到一些细节变形。',
      textEn:'A pavilion offers a place to pause and frame the landscape. Pavilions and gardens help connect natural and human-made scenery in West Lake’s cultural landscape. This pavilion was generated from concept art and does not represent a real monument. Close details may distort.'},
    {id:'lake',name:'柳岸回望',nameEn:'Willow Shore',tag:'层次 / 观景',position:[-4.5,0,-8.5],minutes:3,interest:'photo',reviewed:true,sourceIds:['generated','unesco','editorial'],notice:'',noticeEn:'',
      text:'把视线从岸边移到湖面，再看向远山，画面就有了近、中、远的层次。西湖文化景观融合了湖水、周围山丘和人文景物；这个生成场景借用这种构图关系，但不能据此判断真实的地理位置、距离或通行条件。',
      textEn:'Let your eye move from the shore across the water to the hills: foreground, middle distance and horizon create depth. West Lake’s cultural landscape brings water, surrounding hills and cultural features together. This generated composition cannot establish real geography, distances or access conditions.'}
  ]
};
