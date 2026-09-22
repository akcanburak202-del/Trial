// Distances are AU, masses are solar masses, and time is Julian years.
// In these units a solar-mass central body has G = 4π².
export const G = 4 * Math.PI * Math.PI;
const SOFTENING_SQUARED = 0.0001;

export function acceleration(bodies) {
  return bodies.map((body, i) => {
    let ax = 0, ay = 0;
    for (let j = 0; j < bodies.length; j++) {
      if (i === j || bodies[j].mass === 0) continue;
      const dx = bodies[j].x - body.x;
      const dy = bodies[j].y - body.y;
      const d2 = dx * dx + dy * dy + SOFTENING_SQUARED;
      const factor = G * bodies[j].mass / (d2 * Math.sqrt(d2));
      ax += factor * dx;
      ay += factor * dy;
    }
    return { ax, ay };
  });
}

// Velocity Verlet keeps orbital energy far more stable than an Euler step.
export function step(bodies, dt) {
  const before = acceleration(bodies);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    b.x += b.vx * dt + 0.5 * before[i].ax * dt * dt;
    b.y += b.vy * dt + 0.5 * before[i].ay * dt * dt;
  }
  const after = acceleration(bodies);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].vx += 0.5 * (before[i].ax + after[i].ax) * dt;
    bodies[i].vy += 0.5 * (before[i].ay + after[i].ay) * dt;
  }
}

export function speed(body) { return Math.hypot(body.vx, body.vy); }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function circularSpeed(mass, radius) { return Math.sqrt(G * mass / radius); }

export function createScene(id) {
  if (id === 'binary') {
    const radius = 0.48;
    const v = Math.sqrt(G * 0.54 / (4 * radius));
    return {
      id, name: 'İKİLİ YILDIZ', objective: 'İki yıldızın ortak çekimini keşfet.',
      bodies: [
        { id: 'star-a', x: -radius, y: 0, vx: 0, vy: -v, mass: 0.54, radius: 0.07, color: '#f4c18b', display: 16, name: 'Yıldız A' },
        { id: 'star-b', x: radius, y: 0, vx: 0, vy: v, mass: 0.54, radius: 0.07, color: '#9fc8ea', display: 14, name: 'Yıldız B' }
      ],
      craft: { id: 'craft', x: 0, y: -1.45, vx: 4.2, vy: 0.6, mass: 0, radius: 0.035, color: '#9bf5e0', display: 5, name: 'Araç' }
    };
  }
  if (id === 'flyby') {
    return {
      id, name: 'YAKIN GEÇİŞ', objective: 'Dev gezegenin çekimi rotanı nasıl büküyor?',
      bodies: [
        { id: 'sun', x: 0, y: 0, vx: 0, vy: -0.006, mass: 1, radius: 0.075, color: '#f5c387', display: 19, name: 'Güneş' },
        { id: 'giant', x: 1.1, y: 0, vx: 0, vy: circularSpeed(1, 1.1), mass: 0.012, radius: 0.095, color: '#d5a885', display: 13, name: 'Dev gezegen' }
      ],
      craft: { id: 'craft', x: 0.68, y: -0.57, vx: 2.0, vy: 5.3, mass: 0, radius: 0.035, color: '#9bf5e0', display: 5, name: 'Araç' }
    };
  }
  return {
    id: 'orbit', name: 'YÖRÜNGE KUR', objective: 'Aracı 2 yıl boyunca hedef halkada tut.',
    bodies: [
      { id: 'sun', x: 0, y: 0, vx: 0, vy: -0.000023, mass: 1, radius: 0.075, color: '#f5c387', display: 19, name: 'Güneş' },
      { id: 'earth', x: 1, y: 0, vx: 0, vy: circularSpeed(1, 1), mass: 0.000003, radius: 0.025, color: '#8cbfe3', display: 7, name: 'Dünya' },
      { id: 'mars', x: -1.52, y: 0, vx: 0, vy: -circularSpeed(1, 1.52), mass: 0.00000032, radius: 0.02, color: '#e7a082', display: 6, name: 'Mars' }
    ],
    craft: { id: 'craft', x: 0, y: -1.16, vx: 5.0, vy: 0, mass: 0, radius: 0.035, color: '#9bf5e0', display: 5, name: 'Araç' }
  };
}
