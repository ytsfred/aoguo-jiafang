const levels = [
  ['教学',5,['再改一版','再改一版','明早要'],['已读不回','下班了']],
  ['学会留牌',4,['拉个群','再改一版','明早要','再改一版'],['退群','已读不回','下班了']],
  ['识破陷阱',4,['再改一版','追加需求','明早要'],['已读不回','下班了']]
]
const effects = {
  再改一版:'精力 −3', 明早要:'精力 −2', 拉个群:'增加 1 个小弟', 追加需求:'牌尾加两张「再改一版」',
  已读不回:'作废本回合甲方牌', 下班了:'回复 3 点精力', 退群:'清掉场上小弟'
}
// Place the group and both heavy hits in distinct slots. The remaining slots are deadlines.
const challengeDecks = []
for (let group = 0; group < 5; group++) {
  for (let first = 0; first < 5; first++) {
    for (let second = first + 1; second < 5; second++) {
      if (group === first || group === second) continue
      const deck = Array(5).fill('明早要')
      deck[group] = '拉个群'
      deck[first] = deck[second] = '再改一版'
      challengeDecks.push(deck)
    }
  }
}
function start(level, deal) {
  if (level === 3) {
    deal ??= Math.floor(Math.random() * challengeDecks.length)
    return {level, deal, name:'夜班挑战', energy:5, deck:[...challengeDecks[deal]],
      hand:['退群','已读不回','下班了'], helpers:0, played:0, result:'', last:''}
  }
  const [name,energy,deck,hand] = levels[level]
  return {level,name,energy,deck:[...deck],hand:[...hand],helpers:0,played:0,result:'',last:''}
}
function play(g,card) {
  if (g.result || (card !== '不出牌' && !g.hand.includes(card))) return
  if (card !== '不出牌') g.hand.splice(g.hand.indexOf(card),1)
  if (card === '下班了') g.energy += 3
  if (card === '退群') g.helpers = 0
  const opponent = g.deck.shift()
  if (card !== '已读不回') {
    if (opponent === '再改一版') g.energy -= 3
    if (opponent === '明早要') g.energy -= 2
    if (opponent === '拉个群') g.helpers++
    if (opponent === '追加需求') g.deck.push('再改一版','再改一版')
  }
  g.energy = Math.max(0,g.energy-g.helpers)
  g.played++
  g.last = '第 '+g.played+' 回合 · '+card+' → '+opponent+'（'+(card==='已读不回'?'已作废':effects[opponent])+'）'+(g.helpers?' · 小弟扣 '+g.helpers+' 精力':'')
  if (g.level === 3 && card === '已读不回' && opponent === '再改一版' && g.deck.length) {
    g.last = '反击成功！挡下「再改一版」，连带退回「'+g.deck.shift()+'」。'
    if (g.helpers) g.last += '小弟扣 '+g.helpers+' 精力。'
  }
  g.result = !g.energy ? 'lose' : !g.deck.length ? 'win' : ''
}
if (typeof module !== 'undefined') module.exports = {start,play,challengeDecks}
