const assert = require('node:assert/strict')
const {newRun, act, endTurn, choose, incoming, cards, starter} = require('./rogue.js')
const seeded = (seed = 7) => () => (seed = (seed * 16807) % 2147483647) / 2147483647
// Put a known hand on the table so each check reads like a turn of play.
function table(hand, extra = {}) {
  const g = newRun(seeded())
  Object.assign(g, {hand: [...hand], draw: ['攻击','攻击','攻击','攻击','攻击'], discard: [], energy: 3, block: 0}, extra)
  return g
}

// 开局：10 张起手牌堆，抽 5 张，3 点精力，甲方明牌出招
{
  const g = newRun(seeded())
  assert.equal(g.hp, 40)
  assert.equal(starter.length, 10)
  assert.equal(g.hand.length, 5)
  assert.equal(g.draw.length, 5)
  assert.equal(g.energy, 3)
  assert.ok(g.intent.key)
}

// 一回合能连出多张，精力不够就出不了
{
  const g = table(['攻击','攻击','重击','格挡'])
  const hp = g.enemyHp
  act(g, 0)
  assert.equal(g.enemyHp, hp - 6)
  assert.equal(g.energy, 2)
  assert.deepEqual(g.discard, ['攻击'])
  act(g, 1) // 重击 2 费
  assert.equal(g.enemyHp, hp - 18)
  assert.equal(g.energy, 0)
  act(g, 0) // 没精力了
  assert.equal(g.enemyHp, hp - 18)
  assert.deepEqual(g.hand, ['攻击','格挡'])
  assert.equal(g.turnDamage, 18)
}

// 格挡先抵甲方伤害，结束回合后手牌弃掉、重抽 5 张、精力回满、格挡清零
{
  const g = table(['格挡','格挡','攻击'], {intent: {key: '明早要', hit: 9}})
  act(g, 0)
  act(g, 0)
  assert.deepEqual(incoming(g), {hit: 9, lost: 0})
  endTurn(g)
  assert.equal(g.hp, 40)
  assert.equal(g.hand.length, 5)
  assert.equal(g.energy, 3)
  assert.equal(g.block, 0)
  assert.ok(g.discard.includes('攻击'))
}

// 牌堆抽空时把弃牌洗回来
{
  const g = table([], {draw: ['格挡'], discard: ['攻击','攻击','攻击','攻击'], intent: {key: '明早要', hit: 1}})
  endTurn(g)
  assert.equal(g.hand.length, 5)
  assert.equal(g.draw.length + g.discard.length, 0)
}

// 当场打倒甲方：不挨打，直接三选一拿新牌
{
  const g = table(['重击'], {enemyHp: 5, intent: {key: '明早要', hit: 30}})
  act(g, 0)
  assert.equal(g.result, 'loot')
  assert.equal(g.hp, 40)
  assert.equal(new Set(g.offers).size, 3)
  for (const card of g.offers) assert.ok(!['攻击','格挡','返工'].includes(card))
  const size = g.deck.length, pick = g.offers[0]
  choose(g, pick)
  assert.equal(g.deck.length, size + 1)
  assert.equal(g.deck.filter(c => c === pick).length, starter.filter(c => c === pick).length + 1)
  assert.equal(g.stage, 2)
  assert.equal(g.enemyHp, g.enemyMax)
  assert.equal(g.hand.length, 5)
}

// 第 4 战打倒就通关；血量归零就输
{
  const g = table(['攻击'], {stage: 4, enemyHp: 2})
  act(g, 0)
  assert.equal(g.result, 'win')
  const d = table([], {hp: 3, intent: {key: '明早要', hit: 9}})
  endTurn(d)
  assert.equal(d.result, 'lose')
  assert.equal(d.hp, 0)
  assert.match(d.last, /掉 3 血/)
}

// 再改一版：往你弃牌堆塞 2 张「返工」，返工花 1 精力扔掉
{
  const g = table([], {intent: {key: '再改一版', hit: 4, junk: 2}})
  endTurn(g)
  assert.equal(g.hp, 36)
  assert.equal([...g.draw, ...g.discard, ...g.hand].filter(c => c === '返工').length, 2)
  const r = table(['返工'])
  act(r, 0)
  assert.equal(r.energy, 2)
  assert.ok(!r.discard.includes('返工'))
}

// 拉个群：小弟每回合各打你 2，退群清掉
{
  const g = table([], {intent: {key: '拉个群', hit: 3, minion: 1}})
  endTurn(g)
  assert.equal(g.minions, 1)
  assert.equal(g.hp, 37)
  g.intent = {key: '明早要', hit: 5}
  assert.equal(incoming(g).hit, 7)
  g.hand = ['退群']
  act(g, 0)
  assert.equal(g.minions, 0)
}

// 开个会：这回合不打你，下回合必出「终版要」重击
{
  const g = table([], {intent: {key: '开个会', hit: 0}})
  endTurn(g)
  assert.equal(g.hp, 40)
  assert.equal(g.intent.key, '终版要')
  assert.ok(g.intent.hit >= 15)
}

// 追加需求：甲方加护盾，伤害先打护盾；拍板先打碎护盾
{
  const g = table([], {intent: {key: '追加需求', hit: 0, shield: 10}})
  endTurn(g)
  assert.equal(g.shield, 10)
  const hp = g.enemyHp
  g.hand = ['攻击', '拍板']
  act(g, 0)
  assert.equal(g.shield, 4)
  assert.equal(g.enemyHp, hp)
  act(g, 0)
  assert.equal(g.shield, 0)
  assert.equal(g.enemyHp, hp - 9)
}

// 梭哈：用光剩余精力，每点打 7
{
  const g = table(['攻击', '梭哈'])
  const hp = g.enemyHp
  act(g, 0)
  act(g, 0)
  assert.equal(g.energy, 0)
  assert.equal(g.enemyHp, hp - 6 - 14)
}

// 连打：本回合之前每出过一张牌，多打 3
{
  const g = table(['快攻', '快攻', '连打'])
  const hp = g.enemyHp
  act(g, 0); act(g, 0); act(g, 0)
  assert.equal(g.enemyHp, hp - 3 - 3 - 9)
}

// 熬夜：本场之后每张攻击多打 3，本场只能用一次；下一战牌还在
{
  const g = table(['熬夜', '攻击'], {deck: [...starter, '熬夜']})
  const hp = g.enemyHp
  act(g, 0)
  act(g, 0)
  assert.equal(g.enemyHp, hp - 9)
  assert.ok(!g.discard.includes('熬夜'))
  g.enemyHp = 1; g.hand = ['攻击']; g.energy = 1
  act(g, 0)
  choose(g, g.offers[0])
  assert.equal(g.power, 0)
  assert.ok([...g.draw, ...g.hand].includes('熬夜'))
}

// 加班：抽 2 张，掉 2 血；硬刚：打出你当前格挡值
{
  const g = table(['加班', '格挡', '硬刚'])
  act(g, 0)
  assert.equal(g.hand.length, 4)
  assert.equal(g.hp, 38)
  const hp = g.enemyHp
  act(g, 0); act(g, 0)
  assert.equal(g.enemyHp, hp - 5)
}

// 每张奖励牌都能出，且牌面说明不留空
for (const [name, card] of Object.entries(cards)) assert.ok(card.text, name)

// 手感：会算的人大多能过，乱点基本过不了
const {simulate} = require('./sim.cjs')
const smart = simulate('smart', 400), random = simulate('random', 400)
assert.ok(smart > 0.45 && smart < 0.92, '会算的通关率 ' + smart)
assert.ok(random < 0.12, '乱点的通关率 ' + random)
console.log('rogue ok · 会算', smart, '· 乱点', random)
