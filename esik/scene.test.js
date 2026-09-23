import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,VIEWS,FOCI} from './world.js';
import {freshState,tick} from './simulation.js';
globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});
const renderer={shadowMap:{},info:{render:{calls:0,triangles:0}},setPixelRatio(){},setSize(){},render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true)},dispose(){}};
test('scene assembles with finite geometry and updates through the complete puzzle route',()=>{const w=createWorld({clientWidth:1280,clientHeight:800},renderer);let meshCount=0,vertices=0;w.scene.traverse(o=>{if(o.isMesh){meshCount++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));vertices+=o.geometry.attributes.position.count;}});assert.ok(meshCount>200&&vertices>50000);const s=freshState();Object.assign(s,{started:true,lens:true,sourceOpen:true,distributor:2});w.setCamera(VIEWS.overview);for(let i=0;i<600;i++){const flow=tick(s,.1);w.update(.1,i*.1,s,flow,true);}assert.ok(s.garden);for(const a of ['aqueduct','garden','organ']){w.focusLens(a);assert.equal(w.coverage(a),1);w.setCamera(VIEWS[a]);const p=w.project(FOCI[a]);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}w.dispose();});
