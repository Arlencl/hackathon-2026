import test from 'node:test';
import assert from 'node:assert/strict';
import {createScenicState,completeDemo,confirmSpot,createDemoWorld,publishScenic,putPhoto,removePhoto,visitorExperience,newSpot,upgradeScenicState} from '../src/scenic-core.js';
const reviewed=()=>{const state=createScenicState(),s=state.draft.spots[0];completeDemo(s);Object.values(s.photos).forEach(p=>p.accepted=true);confirmSpot(s);return {state,s};};
test('creator edits never leak into the visitor map before publication or after a later draft edit',()=>{
 const state=createScenicState();state.draft.spots[0].name='草稿新名字';state.draft.spots[0].x=.1;
 assert.equal(state.published.spots[0].name,'花港观鱼 · 御碑亭');assert.equal(state.published.spots[0].x,.795);
 publishScenic(state);assert.equal(state.published.spots[0].name,'草稿新名字');state.draft.spots[0].name='第二稿';
 assert.equal(state.published.spots[0].name,'草稿新名字');assert.equal(state.publishNumber,2);
});
test('demo completion fills only missing angles and preserves supplied image provenance',()=>{
 const s=createScenicState().draft.spots[0],front=structuredClone(s.photos.front);
 putPhoto(s,'left',{url:'data:image/png;base64,abc',kind:'upload',name:'侧面实拍',accepted:true});completeDemo(s);
 assert.deepEqual(s.photos.front,front);assert.equal(s.photos.left.kind,'upload');assert.equal(s.photos.rear.kind,'ai-demo');
 assert.equal(s.photos.rear.accepted,false);assert.equal(Object.keys(s.photos).length,6);
 assert.throws(()=>completeDemo(newSpot('empty')),/先上传/);
});
test('unreviewed AI results cannot be confirmed, generated or published',()=>{
 const state=createScenicState(),s=state.draft.spots[0];completeDemo(s);
 assert.throws(()=>confirmSpot(s),/逐张/);assert.throws(()=>createDemoWorld(s,s.revision),/重新审核/);
 assert.throws(()=>publishScenic(state),/未审核/);
});
test('changing any image invalidates confirmation and the previous world result',()=>{
 const {s}=reviewed();const revision=s.revision;createDemoWorld(s,revision);assert.equal(s.world.kind,'demo');
 putPhoto(s,'rear',{url:'/different.png',name:'replacement',kind:'upload',accepted:true});
 assert.equal(s.confirmedRevision,null);assert.equal(s.world,null);assert.throws(()=>createDemoWorld(s,revision),/变化/);
});
test('removing an accepted angle blocks confirmation until that angle is replaced',()=>{
 const {s}=reviewed();removePhoto(s,'inside');assert.throws(()=>confirmSpot(s),/补齐/);
 completeDemo(s);assert.equal(s.photos.inside.accepted,false);assert.throws(()=>confirmSpot(s),/逐张/);
});
test('each spot owns its assets; a simulated world never redirects visitors into the unrelated sample',()=>{
 const {state,s}=reviewed();const other=structuredClone(state.draft.spots[1]);
 createDemoWorld(s,s.revision);publishScenic(state);
 assert.deepEqual(state.draft.spots[1],other);assert.equal(visitorExperience(state.published.spots[0]),'gallery');
 assert.equal(visitorExperience(createScenicState().published.spots[0]),'world');
});
test('empty maps and points without usable metadata cannot publish',()=>{
 const state=createScenicState();state.draft.spots.push(newSpot('new'));assert.throws(()=>publishScenic(state),/至少/);
 state.draft.spots=[];assert.throws(()=>publishScenic(state),/至少一个/);
});

test('sample completion is limited to the exact pilot reference and cannot mislabel another attraction',()=>{
 const state=createScenicState();assert.throws(()=>completeDemo(state.draft.spots[1]),/仅提供/);
 const s=state.draft.spots[0];putPhoto(s,'front',{url:'data:image/jpeg;base64,custom',kind:'upload',accepted:true});
 assert.throws(()=>completeDemo(s),/仅提供/);
});
test('migrating an old custom project preserves uploads and user pins',()=>{
 const state=createScenicState();state.schema=2;state.draft.map.custom=true;
 state.draft.spots.push({...newSpot('user-place'),name:'我的景点',photos:{front:{url:'data:image/png;base64,uploaded',kind:'upload'}}});
 const before=structuredClone(state.draft);const next=upgradeScenicState(state);
 assert.equal(next.schema,5);assert.deepEqual(next.draft,before);
});
test('only a matching, current pilot world can be offered to visitors',()=>{
 const state=createScenicState(),s=state.draft.spots[0];s.world={kind:'pilot',revision:s.revision};
 assert.equal(visitorExperience(s),'world');s.world.revision++;assert.equal(visitorExperience(s),'gallery');
 const other=state.draft.spots[1];other.world={kind:'pilot',revision:other.revision};assert.equal(visitorExperience(other),'gallery');
});

test('back and top are separate review requirements and older confirmation is invalidated',()=>{
 const {state,s}=reviewed();assert.ok(s.photos.back);assert.ok(s.photos.top);
 state.schema=4;delete s.photos.back;delete s.photos.top;s.world={kind:'demo',revision:s.revision};
 const published=structuredClone(state.published);state.publishedAt='2026-10-12T00:00:00Z';
 const migrated=upgradeScenicState(state);assert.equal(s.confirmedRevision,null);assert.equal(s.world,null);
 assert.deepEqual(migrated.published,published);assert.throws(()=>confirmSpot(s),/背面/);
 completeDemo(s);assert.equal(s.photos.back.accepted,false);assert.equal(s.photos.top.accepted,false);
});
