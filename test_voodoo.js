'use strict';
// 測試 Snake + 2048（Voodoo 風格 game）
const fs = require('fs');
const html = fs.readFileSync('/Users/kelvinlam/Documents/AI/apps/zoo-queens/index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const code = m[1];

function makeEl() {
  const el = { _html:'', _text:'', _children:[], dataset:{}, style:{}, _cls:new Set(),
    classList: { add:(...c)=>c.forEach(x=>el._cls.add(x)), remove:(...c)=>c.forEach(x=>el._cls.delete(x)),
      toggle:(c,f)=>{ if(f===undefined) el._cls.has(c)?el._cls.delete(c):el._cls.add(c); else if(f) el._cls.add(c); else el._cls.delete(c); },
      contains:c=>el._cls.has(c) },
    appendChild(ch){ el._children.push(ch); return ch; }, addEventListener(){}, setAttribute(){}, remove(){} };
  Object.defineProperty(el,'className',{get:()=>[...el._cls].join(' '),set:v=>{el._cls=new Set(String(v).split(/\s+/).filter(Boolean));}});
  Object.defineProperty(el,'innerHTML',{get:()=>el._html,set:v=>{el._html=v;el._children=[];}});
  Object.defineProperty(el,'textContent',{get:()=>el._text,set:v=>{el._text=String(v);}});
  return el;
}
const registry = {};
global.document = { getElementById:id=>(registry[id]||(registry[id]=makeEl())), createElement:()=>makeEl(), querySelectorAll:()=>[], addEventListener(){}, body:{appendChild(){}} };
global.globalThis = global;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

try { new Function(code)(); } catch (e) { console.error('RUNTIME ERROR:', e); process.exit(1); }
const G = global.__zooqueens;
function assert(c,msg){ if(!c){ console.error('FAIL:',msg); process.exitCode=1; } else console.log('PASS:',msg); }

// ── Snake ──
G.startGame('snake');
assert(G.currentGame() === 'snake', 'startGame("snake") 設定 currentGame');
assert(G.snake().length === 1, 'snake 初始長度 1');
const d0 = G.snake()[0];  // head position

// 轉向（唔畀 180° 反轉）
G.snakeSetDir(-1, 0);   // 由 [0,1] 轉上 [−1,0]
G.snakeStep();          // 行一步
const h1 = G.snake()[0];
assert(h1[0] === d0[0] - 1 && h1[1] === d0[1], 'snake 向上行一步（head 由 ' + d0 + ' → ' + h1 + '）');

// ── 2048 ──
// slide 合併
const r1 = G.c2048Slide([2, 2, 0, 0]);
assert(JSON.stringify(r1.row) === '[4,0,0,0]' && r1.scoreGain === 4, 'c2048Slide [2,2,0,0] → [4,0,0,0] +4');
const r2 = G.c2048Slide([2, 2, 2, 2]);
assert(JSON.stringify(r2.row) === '[4,4,0,0]' && r2.scoreGain === 8, 'c2048Slide [2,2,2,2] → [4,4,0,0] +8');
const r3 = G.c2048Slide([4, 4, 8, 0]);
assert(JSON.stringify(r3.row) === '[8,8,0,0]', 'c2048Slide [4,4,8,0] → [8,8,0,0]');

// 新局 + move
G.startGame('c2048');
assert(G.currentGame() === 'c2048', 'startGame("c2048") 設定 currentGame');
const g0 = G.c2048Grid();
let tiles0 = 0;
for (const row of g0) for (const v of row) if (v) tiles0++;
assert(tiles0 === 2, 'c2048 初始 2 個 tile（實際 ' + tiles0 + '）');
G.c2048Move('left');
const g1 = G.c2048Grid();
let tiles1 = 0;
for (const row of g1) for (const v of row) if (v) tiles1++;
assert(tiles1 >= 2 && tiles1 <= 3, 'move 後 tile 數 2–3（實際 ' + tiles1 + '）');

// game over 偵測
const full = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
// inject full grid（冇公開 setter，改用 c2048Move 唔得，直接測 c2048IsOver 邏輯要靠 grid）
// 用 G.c2048Grid 冇 setter，改測：c2048IsOver 喺空 grid = false
assert(G.c2048IsOver() === false, '有空格時 c2048IsOver = false');

console.log('\nALL VOODOO CHECKS DONE', process.exitCode ? '(有 FAIL)' : '(全 PASS)');
process.exit(process.exitCode ? 1 : 0);
