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
