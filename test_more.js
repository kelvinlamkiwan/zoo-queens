'use strict';
// 測試 Block Blast / Memory / Tic-Tac-Toe
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

// ── Block Blast ──
G.startGame('blockblast');
assert(G.currentGame() === 'blockblast', 'startGame("blockblast") 設定 currentGame');
assert(G.bbBlocks().length === 3 && G.bbBlocks().every(b => b && b.length > 0), 'bbNew 出 3 個方塊');
const bbGrid = G.bbGrid();
assert(bbGrid.length === 8 && bbGrid.every(row => row.every(v => v === 0)), 'bb 8×8 空棋盤');
assert(G.bbCanPlace([[0,0]], 0, 0) === true, 'bbCanPlace 空位放得');
assert(G.bbCanPlace([[0,0]], 8, 0) === false, 'bbCanPlace 越界唔放得');
assert(G.bbCanPlace([[0,0],[0,1]], 0, 7) === false, 'bbCanPlace 超出右邊唔放得');
assert(G.bbIsOver() === false, '空棋盤 bbIsOver = false');

// ── Memory ──
G.startGame('memory');
assert(G.currentGame() === 'memory', 'startGame("memory") 設定 currentGame');
const cards = G.memCards();
assert(cards.length === 16, 'mem 16 張卡');
const counts = {};
for (const c of cards) counts[c] = (counts[c] || 0) + 1;
assert(Object.keys(counts).length === 8 && Object.values(counts).every(v => v === 2), 'mem 8 對配對');

// ── Tic-Tac-Toe ──
G.startGame('tictactoe');
assert(G.currentGame() === 'tictactoe', 'startGame("tictactoe") 設定 currentGame');
assert(G.tttBoard().length === 9 && G.tttBoard().every(v => v === null), 'ttt 9 格空棋盤');
// 勝負判定
assert(JSON.stringify(G.tttWinner(['X','X','X',null,null,null,null,null,null])) === JSON.stringify({w:'X',line:[0,1,2]}), 'tttWinner 橫行 X 贏');
assert(JSON.stringify(G.tttWinner(['O',null,null,'O',null,null,'O',null,null])) === JSON.stringify({w:'O',line:[0,3,6]}), 'tttWinner 直行 O 贏');
assert(JSON.stringify(G.tttWinner(['X',null,null,null,'X',null,null,null,'X'])) === JSON.stringify({w:'X',line:[0,4,8]}), 'tttWinner 斜線 X 贏');
assert(G.tttWinner(['X','O','X','O','X','X','O','X','O']) === null, 'tttWinner 和棋無勝方');
// AI 落子
const ai = G.tttBestMove();
assert(ai >= 0 && ai <= 8, 'tttBestMove 返回合法位置（' + ai + '）');

console.log('\nALL MORE-GAME CHECKS DONE', process.exitCode ? '(有 FAIL)' : '(全 PASS)');
process.exit(process.exitCode ? 1 : 0);
