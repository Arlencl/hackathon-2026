import {createScenicState,upgradeScenicState,copy} from './scenic-core.js';
let state, dbPromise, writes=Promise.resolve();
function db() {
  return dbPromise ||= new Promise((resolve,reject)=>{
    const req=indexedDB.open('jingjian-scenic-workspace',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('workspace');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
export async function loadScenic() {
  if(state)return state;
  try {
    const d=await db();
    const value=await new Promise((resolve,reject)=>{const req=d.transaction('workspace').objectStore('workspace').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    state=[1,2,3,4,5,6].includes(value?.schema)&&value.draft?.spots&&value.published?.spots?upgradeScenicState(value):createScenicState();
  }catch{state=createScenicState();}
  return state;
}
export function saveScenic(value) {
  const snapshot=copy(value);
  const write=writes.catch(()=>{}).then(async()=>{const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('workspace','readwrite');tx.objectStore('workspace').put(snapshot,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});state=value;});
  writes=write;return write;
}
export async function imageFile(file) {
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片');
  if(file.size>12*1024*1024)throw Error('每张图片请控制在 12 MB 以内');
  const bitmap=await createImageBitmap(file).catch(()=>{throw Error('这张图片无法读取，请重新选择');});
  if(bitmap.width<100||bitmap.height<100){bitmap.close();throw Error('图片太小，请使用至少 100 × 100 像素的图片');}bitmap.close();
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({url:r.result,name:file.name,kind:'upload',accepted:true});r.onerror=()=>reject(Error('图片读取失败'));r.readAsDataURL(file);});
}
