const cards = {
  攻击:{cost:1,hit:6,text:'打 6'},
  格挡:{cost:1,block:5,text:'挡 5'},
  重击:{cost:2,hit:12,text:'打 12'},
  快攻:{cost:0,hit:3,text:'打 3'},
  连打:{cost:1,hit:3,combo:3,text:'打 3，本回合每出过 1 张牌多打 3'},
  加班:{cost:0,draw:2,hurt:2,text:'抽 2 张，你掉 2 血'},
  咖啡:{cost:0,energy:2,once:true,text:'精力 +2，本场只能用一次'},
  铁壁:{cost:2,block:12,text:'挡 12'},
  甩锅:{cost:1,block:5,draw:1,text:'挡 5，抽 1 张'},
  硬刚:{cost:1,hitBlock:true,text:'打出你现在的格挡值'},
  熬夜:{cost:1,power:3,once:true,text:'本场之后每张攻击多打 3，只能用一次'},
  摸鱼:{cost:1,heal:6,text:'回 6 血'},
  退群:{cost:0,clear:true,draw:1,text:'赶走甲方所有小弟，抽 1 张'},
  拍板:{cost:2,hit:9,breakShield:true,text:'先打碎甲方护盾，再打 9'},
  梭哈:{cost:'all',allIn:7,text:'用光剩下的精力，每点打 7'},
  返工:{cost:1,once:true,junk:true,text:'没用。花 1 精力扔掉'}
}
const starter = ['攻击','攻击','攻击','攻击','攻击','格挡','格挡','格挡','格挡','重击']
const rewards = Object.keys(cards).filter(c => !['攻击','格挡','返工'].includes(c))
const rivals = [
  {name:'项目对接人',hp:34,moves:['明早要','明早要','再改一版','开个会']},
  {name:'项目经理',hp:46,moves:['明早要','再改一版','拉个群','开个会']},
  {name:'部门总监',hp:58,moves:['明早要','再改一版','追加需求','拉个群','开个会']},
  {name:'终审甲方',hp:66,moves:['明早要','再改一版','追加需求','拉个群','开个会']}
]
// Enemy moves come from the original handbook cards; numbers grow each fight.
const moves = {
  明早要:s=>({hit:6+2*s,text:'打你'}),
  再改一版:s=>({hit:3+s,junk:2,text:'塞 2 张「返工」进你牌堆'}),
  拉个群:s=>({hit:2+s,minion:1,text:'叫来 1 个小弟，以后每回合多打你 2'}),
  追加需求:s=>({hit:0,shield:8+3*s,text:'甲方加护盾'}),
  开个会:()=>({hit:0,text:'不打你，下回合出「终版要」'}),
  终版要:s=>({hit:12+4*s,text:'重击'})
}
const isAttack = c => !!(c.hit || c.allIn || c.hitBlock)

function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
function draw(g, n) {
  for (let i = 0; i < n && g.hand.length < 10; i++) {
    if (!g.draw.length) g.draw = shuffle(g.discard.splice(0), g.random)
    if (!g.draw.length) return
    g.hand.push(g.draw.pop())
  }
}
function nextIntent(g) {
  const pool = rivals[g.stage - 1].moves.filter(m => m !== g.intent?.key)
  const key = g.intent?.key === '开个会' ? '终版要' : pool[Math.floor(g.random() * pool.length)]
  g.intent = {key, ...moves[key](g.stage)}
}
function startTurn(g) {
  Object.assign(g, {energy:3, block:0, playedThisTurn:0, turnDamage:0})
  g.turn++
  draw(g, 5)
}
function beginFight(g) {
  const rival = rivals[g.stage - 1]
  Object.assign(g, {enemyMax:rival.hp, enemyHp:rival.hp, shield:0, minions:0, power:0, turn:0,
    draw:shuffle([...g.deck], g.random), discard:[], hand:[], intent:null, result:'', offers:[], last:''})
  nextIntent(g)
  startTurn(g)
}
function newRun(random = Math.random) {
  const g = {rogue:true, stage:1, hp:40, maxHp:40, deck:[...starter], best:0, random}
  beginFight(g)
  return g
}
function incoming(g) {
  const hit = g.intent.hit + 2 * g.minions
  return {hit, lost: Math.max(0, hit - g.block)}
}
// What a card would do right now; the hand shows this before you tap.
function strike(g, name) {
  const c = cards[name]
  if (!isAttack(c)) return 0
  const base = c.allIn ? c.allIn * g.energy : c.hitBlock ? g.block : c.hit + (c.combo || 0) * g.playedThisTurn
  return base + g.power
}
const costOf = (g, name) => cards[name].cost === 'all' ? g.energy : cards[name].cost
function canPlay(g, i) {
  const name = g.hand[i]
  if (g.result || !name) return false
  return cards[name].cost === 'all' ? g.energy > 0 : g.energy >= cards[name].cost
}
function hurtEnemy(g, n) {
  const soaked = Math.min(g.shield, n)
  g.shield -= soaked
  g.enemyHp = Math.max(0, g.enemyHp - (n - soaked))
}
function act(g, i) {
  if (!canPlay(g, i)) return
  const name = g.hand[i], c = cards[name]
  const damage = strike(g, name)
  g.energy -= costOf(g, name)
  g.hand.splice(i, 1)
  if (!c.once) g.discard.push(name)
  if (c.breakShield) g.shield = 0
  const before = g.enemyHp + g.shield
  if (damage) hurtEnemy(g, damage)
  const dealt = before - g.enemyHp - g.shield
  g.turnDamage += dealt
  g.best = Math.max(g.best, g.turnDamage)
  g.block += c.block || 0
  g.energy += c.energy || 0
  g.power += c.power || 0
  if (c.heal) g.hp = Math.min(g.maxHp, g.hp + c.heal)
  if (c.hurt) g.hp = Math.max(1, g.hp - c.hurt)
  if (c.clear) g.minions = 0
  if (c.draw) draw(g, c.draw)
  g.playedThisTurn++
  g.last = name + (dealt ? ' · 甲方掉 ' + dealt + ' 血' : c.block ? ' · 你挡 ' + g.block : '')
  if (!g.enemyHp) win(g)
}
function win(g) {
  g.last = g.turnDamage >= 15 ? '一回合打出 ' + g.turnDamage + '，直接打穿！' : '补刀成功，甲方倒下！'
  if (g.stage === 4) { g.result = 'win'; return }
  g.result = 'loot'
  const pool = [...rewards]
  while (g.offers.length < 3) g.offers.push(pool.splice(Math.floor(g.random() * pool.length), 1)[0])
}
function endTurn(g) {
  if (g.result) return
  g.discard.push(...g.hand.splice(0))
  const {hit} = incoming(g), move = g.intent, lost = Math.min(g.hp, incoming(g).lost)
  g.hp -= lost
  if (move.junk) g.discard.push(...Array(move.junk).fill('返工'))
  g.minions += move.minion || 0
  g.shield += move.shield || 0
  const blocked = Math.min(hit, g.block)
  g.last = '甲方「' + move.key + '」' + (hit ? (lost ? '，你掉 ' + lost + ' 血' : '，全被你挡下') : '') +
    (blocked && lost ? '（挡下 ' + blocked + '）' : '') + (move.junk ? '，塞来 2 张返工' : '') +
    (move.minion ? '，多了 1 个小弟' : '') + (move.shield ? '，护盾 +' + move.shield : '')
  if (!g.hp) { g.result = 'lose'; return }
  nextIntent(g)
  startTurn(g)
}
function choose(g, name) {
  if (g.result !== 'loot' || !g.offers.includes(name)) return
  g.deck.push(name)
  g.stage++
  g.hp = Math.min(g.maxHp, g.hp + 8)
  beginFight(g)
}
if (typeof module !== 'undefined') module.exports = {newRun, act, endTurn, choose, incoming, strike, canPlay, costOf, cards, starter, rivals, moves}
