const assert = require('node:assert/strict')
const {newRun, act, choose} = require('./rogue.js')
function seeded(seed) {
  return () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296)
}
const g = newRun(seeded(1))
assert.equal(g.stage,1)
assert.equal(g.hand.length,3)
g.hand = ['抄送全员','拍板结案','下班了']
g.deck = Array(7).fill('再改一版')
act(g,'抄送全员')
assert.equal(g.deck.length,7)
assert.equal(g.hand.length,3)
assert.equal(g.charge,1)
act(g,'拍板结案')
assert.equal(g.deck.length,4)
assert.equal(g.energy,12)
assert.equal(g.charge,0)
for (let stage = 1; stage <= 4; stage++) {
  g.hand = ['拍板结案']
  g.deck = ['终审驳回']
  act(g,'拍板结案')
  if(stage < 4) {
    assert.equal(g.result,'loot')
    assert.equal(new Set(g.offers).size,3)
    const prize = g.offers[0]
    const before = g.perks[prize] || 0
    choose(g,prize)
    assert.equal(g.perks[prize],before+1)
    assert.equal(g.stage,stage+1)
  } else assert.equal(g.result,'win')
}
const runs = Array.from({length:30},(_,i)=>newRun(seeded(i+1)))
assert.ok(new Set(runs.map(r=>r.hand.join())).size > 3)
assert.ok(new Set(runs.map(r=>r.deck.join())).size > 3)
const combo = newRun(seeded(7))
combo.deck = Array(8).fill('明早要')
combo.hand = ['拍板结案','下班了','全员静音']
combo.charge = 2
act(combo,'拍板结案')
assert.ok(combo.hand.includes('老板特批'), '单场首次连退三单奖励特批牌')
act(combo,'老板特批')
assert.equal(combo.result,'loot')
assert.ok(!combo.discard.includes('老板特批'))
const perks = newRun(seeded(8))
perks.perks = {'带薪休假':1,'双倍浓缩':1,'自动回复':2}
perks.hand = ['下班了','已读不回','全员静音']
perks.deck = Array(6).fill('推翻重做')
act(perks,'下班了')
assert.equal(perks.energy,18)
assert.equal(perks.deck.length,5)
act(perks,'已读不回')
assert.equal(perks.deck.length,1)
const exhausted = newRun(seeded(9))
exhausted.deck = ['拉个群']
exhausted.energy = 1
act(exhausted,'不出牌')
assert.equal(exhausted.result,'lose')
assert.deepEqual(exhausted.offers,[])
