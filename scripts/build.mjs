import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,format:'esm',splitting:true,outdir:'dist',minify:true,sourcemap:false,target:'es2022',loader:{'.wasm':'file'}});
console.log('Built dist/');
