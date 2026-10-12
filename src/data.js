export const SOURCES = [
  {id:'unesco',title:'UNESCO · 西湖文化景观',url:'https://whc.unesco.org/en/list/1334/',license:'CC BY-SA IGO 3.0（说明文字）',accessed:'2026-10-10'},
  {id:'editorial',title:'景见 · 演示策展说明',url:'',license:'本项目原创；体验时间与空间位置为演示设计',accessed:'2026-10-10'},
  {id:'photo',title:'Bjoertvedt · West Lake IMG 8773 panorama',url:'https://commons.wikimedia.org/wiki/File:West_Lake_IMG_8773_panorama.jpg',license:'CC BY-SA 4.0；2017 年拍摄',accessed:'2026-10-10'}
];
export const SEED = {
  schemaVersion:1,title:'西湖 · 一湖诗意',subtitle:'在抵达之前，与山水先相遇。',description:'从柳岸到湖心，走进一段关于山水、诗意与人的故事。',
  world:{mode:'procedural',url:'',prompt:'A quiet lakeside Chinese garden inspired by Hangzhou West Lake. Willow trees, a small traditional pavilion, a stone causeway, distant misty hills, still jade water. Realistic daylight. No people, no text. A conceptual visitor preview, not a measured reconstruction.'},
  sources:SOURCES,rightsConfirmed:true,
  points:[
    {id:'willow',name:'柳岸听风',nameEn:'Willow Shore',tag:'湖畔 / 山水',position:[-15,0,14],minutes:4,interest:'relax',reviewed:true,
      text:'先停下来，听一听湖边的风。西湖的文化景观把湖水、山丘与亭台、堤岸融为一体。眼前的柳岸是我们的概念游览起点，你可以转动视角，看看自然与人工景物如何相互映衬。',
      textEn:'Begin by the water. West Lake brings hills and water together with pavilions and causeways. This conceptual willow shore is our starting point: look around and notice how nature and architecture frame each other.',sourceIds:['unesco','editorial'],notice:'',noticeEn:''},
    {id:'pavilion',name:'临水小亭',nameEn:'Lakeside Pavilion',tag:'建筑 / 文化',position:[-8,0,2],minutes:5,interest:'culture',reviewed:true,
      text:'一座小亭，让看风景有了停留的理由。西湖景观包含亭台与园林。这里的亭子是概念设计，并非某座真实建筑的复刻。试着把柱子当作画框，观察湖面在不同角度下的变化。',
      textEn:'A pavilion offers a place to pause and frame a view. Pavilions and gardens are part of West Lake’s landscape. This pavilion is a conceptual design, not a replica of a specific historic building. Try viewing the lake between its columns.',sourceIds:['unesco','editorial'],notice:'',noticeEn:''},
    {id:'causeway',name:'长堤漫步',nameEn:'Along the Causeway',tag:'漫步 / 人文',position:[3,0,-2],minutes:6,interest:'relax',reviewed:true,
      text:'堤岸把一片水面变成可以慢慢阅读的风景。西湖的堤与岛是文化景观的重要组成部分。我们的演示路线借用这一意象，把观景点串联起来；这里的距离和步行时间不代表实地测量。',
      textEn:'A causeway turns a stretch of water into a sequence of views. Causeways and islands are important elements of West Lake’s cultural landscape. Our preview connects viewpoints through this idea; distances and times here are not real-world measurements.',sourceIds:['unesco','editorial'],notice:'',noticeEn:''},
    {id:'island',name:'湖心望远',nameEn:'Island View',tag:'观景 / 摄影',position:[13,0,-6],minutes:4,interest:'photo',reviewed:true,
      text:'从湖心回望，山水的层次变得清晰。2011 年，杭州西湖文化景观被列入世界遗产名录。先用眼睛寻找近景、中景与远山，再选择你喜欢的构图。此处是概念观景点，不代表真实登岛路线。',
      textEn:'From the island, notice the layers of water and hills. The West Lake Cultural Landscape of Hangzhou was inscribed on the World Heritage List in 2011. Find a foreground, middle distance and horizon for your composition. This is a conceptual viewpoint, not an actual island access route.',sourceIds:['unesco','editorial'],notice:'',noticeEn:''},
    {id:'pagoda',name:'远山塔影',nameEn:'Pagoda in the Hills',tag:'建筑 / 远眺',position:[22,0,-18],minutes:5,interest:'culture',reviewed:true,
      text:'远处的塔，让山的轮廓有了一个可以记住的坐标。西湖文化景观包含寺庙与塔。演示中的塔影用于表达这种景观关系，不对应具体建筑的比例和位置。这里没有实时开放或登塔信息。',
      textEn:'A pagoda gives the distant hills a memorable landmark. Temples and pagodas form part of West Lake’s cultural landscape. Our model illustrates that relationship without reproducing a specific building’s scale or position. Live opening and access information is not available here.',sourceIds:['unesco','editorial'],notice:'',noticeEn:''}
  ]
};
export const INTERESTS={relax:{zh:'慢慢逛',en:'Slow travel'},culture:{zh:'听故事',en:'Culture'},photo:{zh:'找风景',en:'Photography'}};
