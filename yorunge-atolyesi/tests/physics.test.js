import test from 'node:test';
import assert from 'node:assert/strict';
import { circularSpeed, createScene, distance, G, step } from '../physics.js';

test('a circular test-particle orbit stays bounded over five revolutions', () => {
  const sun = { x: 0, y: 0, vx: 0, vy: 0, mass: 1 };
  const probe = { x: 1, y: 0, vx: 0, vy: circularSpeed(1, 1), mass: 0 };
  const bodies = [sun, probe];
  for (let i = 0; i < 5000; i++) step(bodies, .001);
  assert.ok(Math.abs(distance(sun, probe) - 1) < .001);
  assert.ok(Math.abs(probe.x - 1) < .03);
});

test('massless craft does not alter the motion of massive bodies', () => {
  const a = createScene('orbit').bodies;
  const b = createScene('orbit').bodies;
  b.push({ x: .8, y: -.3, vx: 0, vy: 2, mass: 0 });
  for (let i = 0; i < 1000; i++) { step(a, .001); step(b, .001); }
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i].x - b[i].x) < 1e-12);
    assert.ok(Math.abs(a[i].y - b[i].y) < 1e-12);
  }
});

test('binary stars orbit their common center', () => {
  const pair = createScene('binary').bodies;
  const initialDistance = distance(pair[0], pair[1]);
  for (let i = 0; i < 2500; i++) step(pair, .001);
  assert.ok(Math.abs(distance(pair[0], pair[1]) - initialDistance) < .002);
  assert.ok(Math.abs(pair[0].x + pair[1].x) < 1e-9);
  assert.ok(Math.abs(pair[0].y + pair[1].y) < 1e-9);
  assert.ok(G > 39 && G < 40);
});
