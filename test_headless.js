'use strict';
// Headless harness for meowdoku (Queens/Star Battle) — stub DOM, run script, drive __meowdoku.
const fs = require('fs');
const html = fs.readFileSync('/Users/kelvinlam/Documents/AI/apps/zoo-queens/index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('NO SCRIPT'); process.exit(1); }
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

function gridFromSolution(n, cells) {
  const g = Array.from({length:n},()=>Array(n).fill(0));
  for (const [r,c] of cells) g[r][c] = 1;
  return g;
}
function validPlacement(n, cells) {
  if (cells.length !== n) return 'count ' + cells.length;
  const occ = new Set(cells.map(x=>x[0]+','+x[1]));
  for (const [r,c] of cells) {
    if (cells.filter(x=>x[0]===r).length !== 1) return 'row dup';
    if (cells.filter(x=>x[1]===c).length !== 1) return 'col dup';
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) if (!dr&&!dc) {} else if (occ.has((r+dr)+','+(c+dc))) return 'adjacent';
  }
  return null;
}

// ── 生成：N=4..12 全部成功 + 解合法 + 唯一 ──
const times = {};
let genOK = true, genErr = '';
for (let n = 4; n <= 12; n++) {
  const t0 = Date.now();
  const g = G.generateLevel(n, 0);
  times[n] = Date.now() - t0;
  if (!g) { genOK = false; genErr = 'N=' + n + ' 生成失敗'; break; }
  const verr = validPlacement(n, g.solution);
  if (verr) { genOK = false; genErr = 'N=' + n + ' 解非法: ' + verr; break; }
  // 解喺每個區域恰好一隻
  const regCnt = Array(n).fill(0);
  for (const [r,c] of g.solution) regCnt[g.regionOf[r][c]]++;
  if (regCnt.some(x=>x!==1)) { genOK = false; genErr = 'N=' + n + ' 解唔係每區一隻'; break; }
  // starters subset of solution
  const solSet = new Set(g.solution.map(x=>x[0]+','+x[1]));
  if (!g.starters.every(x=>solSet.has(x[0]+','+x[1]))) { genOK = false; genErr = 'N=' + n + ' starters 唔喺解入面'; break; }
  // 區域連通 + 全覆蓋
  const seen = new Set();
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) { const v=g.regionOf[r][c]; if (v<0||v>=n){genOK=false;genErr='N='+n+' 區域 id 錯';break;} seen.add(v); }
  if (seen.size !== n) { genOK = false; genErr = 'N=' + n + ' 區域數唔啱'; break; }
}
assert(genOK, '唯一解生成：N=4..12 全部成功 + 解合法 + 每區一隻 + starters 屬於解' + (genErr ? ' ← ' + genErr : ''));
console.log('   生成時間(ms):', JSON.stringify(times));

// 區域大小分佈（確認唔會一個區域食晒成個盤）
const g10 = G.generateLevel(10, 3);
if (g10) {
  const sizes = Array(10).fill(0);
  for (let r=0;r<10;r++) for (let c=0;c<10;c++) sizes[g10.regionOf[r][c]]++;
  console.log('   N=10 區域大小分佈:', sizes.sort((a,b)=>a-b).join(','));
}

// ── 遊戲邏輯 ──
G.loadLevel(1);
assert(G.N() === 4, 'loadLevel(1) → N=4');
const n = G.N();

// 填滿正確解 = 贏
const solGrid = gridFromSolution(n, G.solution());
G.setBoard(solGrid);
assert(G.isWon(), '填滿正確解 = 贏');

// 開局（全部關卡開局無鎖定動物）
G.loadLevel(1);
const starters = G.starters();
assert(starters.length === 0, '開局無鎖定動物');
const bd = G.board();
assert(bd.every(row => row.every(v => v === 0)), '開局 board 全空');

// 合法放置（搵 solution 中任一 cell）
const lockedSet = new Set();
let target = null;
for (const [r,c] of G.solution()) if (!lockedSet.has(r+','+c)) { target=[r,c]; break; }
assert(target, '搵到可放目標');
const h0 = G.hearts();
G.placeCat(target[0], target[1]);
assert(G.board()[target[0]][target[1]] === 1, '合法放置成功');
assert(G.hearts() === h0, '合法放置唔扣心');

// 非法放置（同 row）
const rr = target[0];
let bad = null;
for (let c=0;c<n;c++) if (c!==target[1] && G.board()[rr][c]===0) { bad=[rr,c]; break; }
if (bad) {
  const h2 = G.hearts();
  G.placeCat(bad[0], bad[1]);
  assert(G.board()[bad[0]][bad[1]] === 0, '非法放置被拒絕（同 row）');
  assert(G.hearts() === h2 - 1, '非法放置扣 1 心');
} else console.log('SKIP: 冇同 row 空 cell');

// 復原
const before = G.board().map(r=>r.slice());
G.toggleX(target[0], target[1] === 0 ? 1 : 0); // 喺某空 cell 標 X
G.undo();
assert(JSON.stringify(G.board()) === JSON.stringify(before), 'undo 還原 board');

console.log('\nALL CHECKS DONE', process.exitCode ? '(有 FAIL)' : '(全 PASS)');
