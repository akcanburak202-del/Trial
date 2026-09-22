export const M = Object.freeze({ EMPTY: 0, SAND: 1, WATER: 2, STONE: 3, WOOD: 4, FIRE: 5, SMOKE: 6, STEAM: 7 });

export class World {
  constructor(width = 200, height = 126, random = Math.random) {
    this.width = width; this.height = height; this.random = random;
    this.cells = new Uint8Array(width * height);
    this.life = new Uint8Array(width * height);
    this.moved = new Uint8Array(width * height);
    this.tick = 0;
  }
  at(x, y) { return x < 0 || y < 0 || x >= this.width || y >= this.height ? M.STONE : this.cells[y * this.width + x]; }
  put(x, y, material) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = y * this.width + x;
    this.cells[i] = material;
    this.life[i] = material === M.FIRE ? 24 + (this.random() * 35 | 0) : material === M.SMOKE || material === M.STEAM ? 45 + (this.random() * 45 | 0) : 0;
  }
  swap(x, y, nx, ny) {
    const a = y * this.width + x, b = ny * this.width + nx;
    [this.cells[a], this.cells[b]] = [this.cells[b], this.cells[a]];
    [this.life[a], this.life[b]] = [this.life[b], this.life[a]];
    this.moved[b] = 1;
    this.moved[a] = 1;
  }
  step() {
    const { width:w, height:h, random:r } = this;
    this.moved.fill(0); this.tick++;
    for (let y = h - 2; y >= 1; y--) {
      const reverse = (this.tick + y) % 2 === 0;
      for (let col = 1; col < w - 1; col++) {
        const x = reverse ? w - 1 - col : col, i = y * w + x;
        if (this.moved[i]) continue;
        const kind = this.cells[i];
        if (kind === M.SAND || kind === M.WATER) {
          const below = this.at(x, y + 1);
          if (below === M.EMPTY || (kind === M.SAND && below === M.WATER)) { this.swap(x,y,x,y+1); continue; }
          const dir = r() < .5 ? -1 : 1;
          const diagonal = [dir,-dir];
          let moved = false;
          for (const d of diagonal) {
            const next = this.at(x+d,y+1);
            if (next === M.EMPTY || (kind === M.SAND && next === M.WATER)) { this.swap(x,y,x+d,y+1); moved = true; break; }
          }
          if (moved || kind === M.SAND) continue;
          for (const d of diagonal) {
            if (this.at(x+d,y) === M.EMPTY) { this.swap(x,y,x+d,y); break; }
          }
        } else if (kind === M.FIRE) {
          if (this.life[i] > 0) this.life[i]--;
          for (const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
            const n = this.at(x+dx,y+dy);
            if (n === M.WOOD && r() < .045) this.put(x+dx,y+dy,M.FIRE);
            if (n === M.WATER) { this.put(x,y,M.STEAM); if(r()<.25) this.put(x+dx,y+dy,M.STEAM); break; }
          }
          if (this.cells[i] === M.FIRE && this.at(x,y-1) === M.EMPTY && r()<.17) this.put(x,y-1,M.SMOKE);
          if (this.cells[i] === M.FIRE && this.life[i] === 0) this.put(x,y,r()<.5 ? M.SMOKE : M.EMPTY);
        } else if (kind === M.SMOKE || kind === M.STEAM) {
          if (this.life[i] > 0) this.life[i]--;
          if (!this.life[i]) { this.put(x,y,M.EMPTY); continue; }
          const d = r() < .5 ? -1 : 1;
          if (this.at(x,y-1) === M.EMPTY) this.swap(x,y,x,y-1);
          else if (this.at(x+d,y-1) === M.EMPTY) this.swap(x,y,x+d,y-1);
          else if (this.at(x+d,y) === M.EMPTY && r()<.7) this.swap(x,y,x+d,y);
        }
      }
    }
  }
  brush(cx, cy, radius, kind) {
    for (let dy=-radius;dy<=radius;dy++) for(let dx=-radius;dx<=radius;dx++) {
      if(dx*dx+dy*dy > radius*radius || this.random() < .09 && kind !== M.EMPTY) continue;
      const x=cx+dx,y=cy+dy;
      if (x<1 || x>=this.width-1 || y<1 || y>=this.height-1) continue;
      const current=this.at(x,y);
      if(kind === M.FIRE && current === M.STONE) continue;
      if(kind !== M.EMPTY && current !== M.EMPTY && current !== M.WOOD && kind !== M.FIRE && kind !== M.STONE) continue;
      this.put(x,y,kind);
    }
  }
}
