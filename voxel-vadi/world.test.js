import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWorld,heightAt} from './world.js';
import {perspective,lookAt,multiply,project} from './math.js';

test('orman evi düz bir yükseltiye oturur; kıyı su seviyesinin üstünde kalır',()=>{
 for(let z=-10;z<=0;z++)for(let x=-13;x<=-5;x++)if(Math.hypot(x+9,z+5)<7.5)assert.equal(heightAt(x,z),12);
 assert.ok(heightAt(39,39)<3);assert.ok(heightAt(22,8)>3);
});
test('3B sahne deterministik ve tüm geometri sonlu',()=>{
 const a=buildWorld(),b=buildWorld();assert.equal(a.instanceCount,b.instanceCount);assert.ok(a.instanceCount>1000);
 assert.deepEqual(a.instances,b.instances);assert.ok(a.terrain.positions.length>20000);
 for(const value of a.instances)assert.ok(Number.isFinite(value));
 for(const value of a.terrain.positions)assert.ok(Number.isFinite(value));
 for(const i of a.terrain.indices)assert.ok(i<a.terrain.positions.length/3);
});
test('kamera hedefi ekrana yansır',()=>{
 const target=[-9,12,-5],view=lookAt([30,35,50],target),m=multiply(perspective(Math.PI/3,1.6,.1,520),view),p=project(target,m,960,600);
 assert.ok(p.visible);assert.ok(Math.abs(p.x-480)<.001);assert.ok(Math.abs(p.y-300)<.001);
});
