// Balance check: a player who plans each turn vs one who taps at random.
const {newRun, act, endTurn, choose, incoming, canPlay} = require('./rogue.js')
const clone = g => ({...g, deck:[...g.deck], draw:[...g.draw], discard:[...g.discard], hand:[...g.hand], intent:{...g.intent}, offers:[...g.offers]})
const taste = ['熬夜','梭哈','连打','铁壁','甩锅','重击','拍板','快攻','咖啡','加班','硬刚','摸鱼','退群']

function value(g) {
  if (g.result === 'win' || g.result === 'loot') return 10000 + g.hp
  const left = g.hp - incoming(g).lost
  if (left <= 0) return -10000
  return left * 1.6 - (g.enemyHp + g.shield) + g.power * 4 - g.minions * 5
}
// Try every order of plays this turn (bounded) and keep the best line.
function plan(g, budget = {n: 400}) {
  let best = {score: value(g), line: []}
  if (g.result) return best
  const seen = new Set()
  for (let i = 0; i < g.hand.length && budget.n > 0; i++) {
    if (seen.has(g.hand[i]) || !canPlay(g, i)) continue
    seen.add(g.hand[i])
    budget.n--
    const next = clone(g)
    act(next, i)
    const sub = plan(next, budget)
    if (sub.score > best.score) best = {score: sub.score, line: [g.hand[i], ...sub.line]}
  }
  return best
}
function smartTurn(g) {
  const {line} = plan(g)
  if (!line.length) return endTurn(g)
  act(g, g.hand.indexOf(line[0]))
}
function randomTurn(g) {
  const options = g.hand.map((_, i) => i).filter(i => canPlay(g, i))
  if (!options.length || Math.random() < 0.2) return endTurn(g)
  act(g, options[Math.floor(Math.random() * options.length)])
}
function simulate(kind, runs = 1000, report) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const g = newRun()
    for (let step = 0; step < 2000 && g.result !== 'win' && g.result !== 'lose'; step++) {
      if (g.result === 'loot') {
        choose(g, kind === 'smart' ? taste.find(c => g.offers.includes(c)) : g.offers[Math.floor(Math.random() * 3)])
        continue
      }
      ;(kind === 'smart' ? smartTurn : randomTurn)(g)
    }
    if (g.result === 'win') wins++
    report?.(g)
  }
  return wins / runs
}
module.exports = {simulate}
if (require.main === module) {
  const stages = [0, 0, 0, 0, 0], best = []
  const smart = simulate('smart', 1000, g => { stages[g.stage - (g.result === 'win' ? 0 : 1)]++; best.push(g.best) })
  best.sort((a, b) => a - b)
  console.log({smart, random: simulate('random', 1000), 倒在第几战: stages, 最猛一回合中位数: best[500], 最猛一回合最高: best.at(-1)})
}
