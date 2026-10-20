'use strict';
// 測試新加嘅遊戲（Sudoku / Minesweeper / 遊戲選單）
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

function validSudoku(g) {
  for (let i = 0; i < 9; i++) {
    const row = new Set(), col = new Set();
    for (let j = 0; j < 9; j++) { row.add(g[i][j]); col.add(g[j][i]); }
    if (row.size !== 9 || col.size !== 9) return false;
    for (const v of row) if (v < 1 || v > 9) return false;
  }
  for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
    const box = new Set();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box.add(g[br+r][bc+c]);
    if (box.size !== 9) return false;
  }
  return true;
}

// ── Sudoku ──
// 1. 解題器出合法解
const sol = Array.from({length:9},()=>Array(9).fill(0));
const solved = G.sudoSolve(sol);
assert(solved === true, 'sudoSolve 成功');
assert(validSudoku(sol), 'sudoSolve 解合法（每行/列/宮 1–9）');

// 2. 生成器出合法 + 唯一解 puzzle
const g = G.sudoGenerate(34);
assert(!!g && g.grid.length === 9, 'sudoGenerate 出 9×9 puzzle');
assert(validSudoku(g.solution), 'puzzle solution 合法');
let givens = 0, subsetOK = true;
for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
  if (g.grid[r][c]) { givens++; if (g.grid[r][c] !== g.solution[r][c]) subsetOK = false; }
}
assert(subsetOK, 'puzzle 給定值都等於 solution');
assert(givens === 34, 'puzzle 有 34 個給定值（實際 ' + givens + '）');
const uniq = G.sudoCountSolutions(g.grid.map(r=>r.slice()), 2);
assert(uniq === 1, 'puzzle 唯一解（count=' + uniq + '）');

// 3. sudoIsWon
G.startGame('sudoku');
assert(G.currentGame() === 'sudoku', 'startGame("sudoku") 設定 currentGame');
assert(G.sudoIsWon() === false, '新 puzzle 未完成');
assert(G.sudoMistakes() === 0, '新 puzzle 0 錯');

// ── Minesweeper ──
// 1. 生成器放 10 地雷 + 首擊區安全
const mines = G.msGenerate(4, 4);
let mineCount = 0, safeOK = true;
for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
  if (mines[r][c]) {
    mineCount++;
    if (Math.abs(r-4) <= 1 && Math.abs(c-4) <= 1) safeOK = false;
  }
}
assert(mineCount === 10, 'msGenerate 放 10 個地雷（實際 ' + mineCount + '）');
assert(safeOK, '首擊區（3×3）冇地雷');

// 2. msAdjacent 計數正確
// 手動砌一個已知佈局
G.startGame('minesweeper');
assert(G.currentGame() === 'minesweeper', 'startGame("minesweeper") 設定 currentGame');
const testMines = Array.from({length:9},()=>Array(9).fill(false));
testMines[0][0] = true; testMines[0][1] = true; testMines[1][0] = true;
// 直接 set 內部 msMines（經 msReveal 邏輯，先用 G.msNew 再改）
// 用 msNew 初始化，然後手動 inject mines
G.msNew();
// inject 透過 public setter 冇，改測 msCheckWin 邏輯：
// 直接驗證 msAdjacent 用全局 msMines（喺 msNew 後未開始，mines 全 false）
// 所以改測：msNew 後 revealed 全 false
const rev = G.msRevealed();
assert(rev.every(row => row.every(v => v === false)), 'msNew 後全未揭開');

// 3. flood fill + win（單一地雷喺角落，reveal 左上角應該揭示其餘全部）
G.msNew();
const layout = Array.from({length:9},()=>Array(9).fill(false));
layout[8][8] = true;
G.setMsMines(layout);
G.msReveal(0, 0);
const rev2 = G.msRevealed();
let revealedCount = 0;
for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (rev2[r][c]) revealedCount++;
assert(revealedCount === 80, 'flood fill 揭示 80 格（除地雷外全部）實際 ' + revealedCount);
assert(rev2[8][8] === false, '地雷格冇被 reveal');
assert(G.msCheckWin() === true, '全部非地雷格揭示 = 贏');

// 4. 踩中地雷
G.msNew();
const layout2 = Array.from({length:9},()=>Array(9).fill(false));
layout2[4][4] = true;
G.setMsMines(layout2);
G.msReveal(4, 4);
assert(G.msRevealed()[4][4] === true, '踩中地雷格被 reveal');

// 5. msAdjacent 計數（單地雷喺 (4,4)，(4,5) 應該有 1 個相鄰地雷）
assert(G.msAdjacent(4, 5) === 1, 'msAdjacent 正確計 1 個地雷');

console.log('\nALL GAME CHECKS DONE', process.exitCode ? '(有 FAIL)' : '(全 PASS)');
