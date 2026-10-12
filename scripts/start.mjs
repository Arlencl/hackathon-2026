import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let port=process.env.PORT||'4173';try{const text=await readFile(path.join(root,'.env'),'utf8');port=text.match(/^PORT=(\d+)$/m)?.[1]||port;}catch{}
const url=`http://127.0.0.1:${port}`;
function open(){if(process.platform==='darwin')spawn('open',[url],{stdio:'ignore'});else if(process.platform==='win32')spawn('cmd',['/c','start','',url],{stdio:'ignore'});console.log(`打开 ${url} 。此窗口保持开启即可演示；按 Ctrl+C 停止。`);}
try{const r=await fetch(url+'/api/health',{signal:AbortSignal.timeout(800)});const data=await r.json();if(r.ok&&data.local&&data.worldModel){console.log('景见已经在运行。');open();process.exit(0);}}catch{}
const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,stdio:['inherit','pipe','inherit']});
let opened=false;child.stdout.on('data',data=>{process.stdout.write(data);if(!opened&&data.toString().includes('景见本地服务')){opened=true;open();}});child.on('exit',code=>process.exit(code||0));process.on('SIGINT',()=>child.kill('SIGINT'));
