const assert = require('node:assert/strict')
const {start, play} = require('./game.js')
for (const [level, moves, energy, result] of [
  [0,['已读不回','下班了','不出牌'],[5,5,3],'win'],
  [1,['下班了','退群','不出牌','已读不回'],[6,3,1,1],'win'],
  [2,['下班了','已读不回','不出牌'],[4,4,2],'win'],
  [2,['已读不回','下班了','不出牌','不出牌','不出牌'],[4,7,5,2,0],'lose']
]) {
  const game = start(level)
  moves.forEach((card,i) => {
    play(game,card)
    assert.equal(game.energy,energy[i])
  })
  assert.equal(game.result,result)
}

const { challengeDecks } = require('./game.js')
assert.ok(challengeDecks?.length >= 10, '挑战需要多种不同的牌序')
assert.equal(new Set(challengeDecks.map(d => d.join(','))).size, challengeDecks.length)
function canWin(game) {
  if (game.result) return game.result === 'win'
  return [...game.hand, '不出牌'].some(card => {
    const next = structuredClone(game)
    play(next, card)
    return canWin(next)
  })
}
for (let i = 0; i < challengeDecks.length; i++) {
  const game = start(3, i)
  assert.ok(canWin(game), game.deck.join(','))
  while (game.deck[0] !== '再改一版' && !game.result) play(game, '不出牌')
  if (!game.result && game.deck.length > 1) {
    const expected = game.deck.slice(2)
    play(game, '已读不回')
    assert.deepEqual(game.deck, expected)
    assert.match(game.last, /反击/)
  }
}
