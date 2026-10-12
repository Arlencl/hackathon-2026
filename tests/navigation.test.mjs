import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_CONFIG} from '../src/generated-world.js';
import {navigationStep,navigationDistance} from '../src/navigation.js';
test('roaming continues beyond the former four-metre boundary and remains reversible',()=>{
 const start=[0,1.45,0];let p=start;
 for(let i=0;i<120;i++)p=navigationStep(p,[0,0,-1],'forward',3/60);
 assert.ok(navigationDistance(p,start)>5.9);
 for(let i=0;i<120;i++)p=navigationStep(p,[0,0,-1],'back',3/60);
 assert.ok(navigationDistance(p,start)<1e-9);
});
test('strafing follows camera heading and altitude changes independently',()=>{
 assert.deepEqual(navigationStep([0,2,0],[1,.8,0],'right',3),[0,2,3]);
 assert.deepEqual(navigationStep([0,2,0],[0,-1,-1],'forward',3),[0,2,-3]);
 assert.deepEqual(navigationStep([0,2,0],[0,0,-1],'up',3),[0,5,0]);
 assert.deepEqual(navigationStep([0,2,0],[0,0,-1],'down',1),[0,1,0]);
});
test('curated viewpoints have distinct physical positions, not just camera targets',()=>{
 const positions=Object.values(WORLD_CONFIG.views).map(v=>v.camera);
 assert.equal(positions.length,3);
 for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)assert.ok(navigationDistance(positions[i],positions[j])>5,'Viewpoints must be spatially separated');
});
