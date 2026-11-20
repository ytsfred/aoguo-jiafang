const assert = require('node:assert/strict')
const {newRun, act, choose, outcome} = require('./rogue.js')
const g = newRun(()=>0.25)
assert.equal(g.hp,24)
g.intent=5
g.hand=['攻击','格挡','回血']
const first=g.enemyHp
assert.equal(outcome(g,'攻击').damage,4)
act(g,'攻击')
assert.equal(g.enemyHp,first-4)
assert.equal(g.hp,19)
g.hand=['格挡'];g.intent=5
act(g,'格挡')
assert.equal(g.hp,19)
assert.equal(g.power,3)
g.hand=['攻击'];g.intent=2
act(g,'攻击')
assert.equal(g.enemyHp,first-11)
assert.equal(g.power,0)
for(let stage=1;stage<=4;stage++){
  g.hand=['攻击'];g.enemyHp=2;g.intent=8
  const hp=g.hp
  act(g,'攻击')
  assert.equal(g.hp,hp)
  if(stage===4){assert.equal(g.result,'win');break}
  assert.equal(g.result,'loot')
  assert.equal(new Set(g.offers).size,3)
  const key=g.offers[0], rank=g.perks[key]||0
  choose(g,key)
  assert.equal(g.perks[key],rank+1)
  assert.equal(g.stage,stage+1)
}
const dying=newRun()
dying.hp=1;dying.intent=4;dying.hand=['攻击']
act(dying,'攻击')
assert.equal(dying.result,'lose')
const heal=newRun()
heal.hp=23;heal.hand=['回血'];heal.intent=2
act(heal,'回血')
assert.equal(heal.hp,22)
const fighter=newRun()
fighter.hand=['格挡反击','吸血攻击']
fighter.intent=8
fighter.perks={'反击':1,'铁壁':1,'强攻':1}
fighter.power=2
const prediction=outcome(fighter,'格挡反击')
act(fighter,'格挡反击')
assert.equal(fighter.hp,21)
assert.equal(fighter.enemyHp,6)
assert.equal(fighter.power,6)
assert.equal(fighter.hp,prediction.hp)
fighter.hand=['吸血攻击']
act(fighter,'吸血攻击')
assert.equal(fighter.result,'loot')
assert.equal(fighter.hp,23)
choose(fighter,fighter.offers[0])
assert.equal(fighter.hp,24)
