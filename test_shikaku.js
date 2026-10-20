'use strict';
// 測試 Shikaku 四角（矩形分割）
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

// 生成器有效性：多個 seed 都驗證
let genOK = true, genErr = '';
for (let t = 0; t < 20; t++) {
  const { grid, solution } = G.shikakuGenerate(6);
  const cover = Array.from({ length: 6 }, () => Array(6).fill(0));
  let areaOK = true;
  for (const [r1, c1, r2, c2] of solution) {
    const area = (r2 - r1 + 1) * (c2 - c1 + 1);
    if (grid[r1][c1] !== area) { areaOK = false; genErr = '面積唔啱：grid[' + r1 + '][' + c1 + ']=' + grid[r1][c1] + ' vs 矩形面積 ' + area; break; }
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) cover[r][c]++;
  }
  // 全覆蓋 + 每格啱一次
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (cover[r][c] !== 1) { genErr = '覆蓋唔啱：[' + r + '][' + c + ']=' + cover[r][c]; areaOK = false; }
  if (!areaOK) { genOK = false; break; }
}
assert(genOK, 'Shikaku 生成器：矩形面積=數字 + 全覆蓋每格一次' + (genErr ? ' ← ' + genErr : ''));

// 遊戲初始化
G.startGame('shikaku');
assert(G.currentGame() === 'shikaku', 'startGame("shikaku") 設定 currentGame');
const g = G.shGrid();
assert(g.length === 6 && g[0][0] > 0, 'shGrid 6×6，左上角有數字');
const placed = G.shPlaced();
assert(placed.every(row => row.every(v => v === -1)), '開局全部未放');

// 數字數量合理（至少有幾個數字）
let numCount = 0;
for (const row of g) for (const v of row) if (v > 0) numCount++;
assert(numCount >= 4 && numCount <= 20, '數字數量合理（' + numCount + '）');

console.log('\nALL SHIKAKU CHECKS DONE', process.exitCode ? '(有 FAIL)' : '(全 PASS)');
process.exit(process.exitCode ? 1 : 0);
