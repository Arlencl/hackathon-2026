import { build } from 'esbuild';
import { cp, mkdir, rm, readFile } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {relative,resolve} from 'node:path';
const manifest=JSON.parse(await readFile('public/assets/web/manifest.json','utf8'));
for(const entry of manifest.entries){
  for(const [path,expected] of [[entry.source,entry.sourceSha256],[entry.output,entry.outputSha256]]){
    const actual=createHash('sha256').update(await readFile('public'+path)).digest('hex');
    if(actual!==expected)throw Error(`Web image is stale: ${path}; regenerate delivery copies before building`);
  }
}
// Archive unused/full-size source material in Git, not in every website upload.
// Keep the actual world-model input byte-for-byte available for receipt verification.
const sourceOnly=new Set([...manifest.entries.filter(e=>!e.keepOriginalInSite).map(e=>e.source.slice(1)),'assets/world/huagang-pano.png']);
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true,filter:source=>!sourceOnly.has(relative(resolve('public'),resolve(source)))});
await build({entryPoints:['src/app.js'],bundle:true,format:'esm',splitting:true,outdir:'dist',minify:true,sourcemap:false,target:'es2022',loader:{'.wasm':'file'}});
console.log('Built dist/');
