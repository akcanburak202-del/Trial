import test from 'node:test';
import assert from 'node:assert/strict';
import {World,M} from './physics.js';

test('kum boşlukta aşağı iner ve taş üstünde durur',()=>{
 const w=new World(10,10,()=>.4);w.put(4,8,M.STONE);w.put(4,5,M.SAND);w.step();assert.equal(w.at(4,6),M.SAND);
 w.put(4,7,M.SAND);w.put(3,8,M.STONE);w.put(5,8,M.STONE);w.step();assert.equal(w.at(4,7),M.SAND);
});
test('su zeminde yana akar',()=>{
 const w=new World(8,8,()=>.3);for(let x=0;x<8;x++)w.put(x,6,M.STONE);w.put(4,5,M.WATER);w.step();assert.equal(w.at(3,5),M.WATER);
});
test('su ateşe dokununca buhar üretir',()=>{
 const w=new World(8,8,()=>.1);w.put(4,4,M.FIRE);w.put(4,5,M.WATER);for(const [x,y] of [[3,4],[5,4],[3,5],[5,5],[3,6],[4,6],[5,6]])w.put(x,y,M.STONE);w.step();assert.equal(w.at(4,4),M.STEAM);
});
test('kenarlarda parçacıklar erişilemeyen hücrelere kaçmaz',()=>{
 const w=new World(8,8,()=>.3);
 for(let x=0;x<8;x++)w.put(x,6,M.STONE);
 w.put(1,5,M.WATER);w.put(2,5,M.STONE);w.put(2,6,M.STONE);
 w.put(4,1,M.SMOKE);
 for(let n=0;n<6;n++)w.step();
 assert.equal(w.cells[5*8],M.EMPTY);
 assert.equal(w.cells[0*8+4],M.EMPTY);
});
