const rivals = ['项目对接人','项目经理','部门总监','终审甲方']
const prizes = {
  '强攻':'每张攻击牌多打 2 血',
  '铁壁':'每张格挡牌多挡 2 点伤害',
  '反击':'格挡后，下次攻击额外再加 3',
  '急救':'回血牌多回 3 血',
  '先手':'每场第一张攻击牌多打 5 血'
}
const pick = (items,random) => items[Math.floor(random()*items.length)]
function deal(g) {
  g.intent = pick([1,2,5],g.random)+g.stage
  g.hand = ['攻击',pick(['格挡','格挡','回血'],g.random),pick(['重击','吸血攻击','格挡反击'],g.random)]
}
function beginFight(g) {
  g.enemyMax=12+6*(g.stage-1)
  g.enemyHp=g.enemyMax
  g.power=5*(g.perks['先手']||0)
  Object.assign(g,{played:0,result:'',offers:[],last:''})
  deal(g)
}
function newRun(random=Math.random) {
  const g={rogue:true,stage:1,hp:24,maxHp:24,perks:{},random}
  beginFight(g)
  return g
}
// The preview and the actual turn share the same calculation.
function outcome(g,card) {
  const strike = {'攻击':4,'重击':7,'吸血攻击':3,'格挡反击':2}[card]||0
  const guard = card==='格挡'||card==='格挡反击'
  const damage = strike ? strike+2*(g.perks['强攻']||0)+g.power : 0
  const block = guard ? (card==='格挡'?6:3)+2*(g.perks['铁壁']||0) : 0
  const heal = card==='回血'?6+3*(g.perks['急救']||0):card==='吸血攻击'?2:0
  const enemyHp=Math.max(0,g.enemyHp-damage)
  const incoming=enemyHp ? Math.max(0,g.intent-block) : 0
  const hp=Math.max(0,Math.min(g.maxHp,g.hp+heal)-incoming)
  const bonus=guard?3+3*(g.perks['反击']||0):0
  return {damage,block,heal,enemyHp,incoming,hp,bonus,power:(strike?0:g.power)+bonus}
}
function act(g,card) {
  if(g.result || !g.hand.includes(card)) return
  const turn=outcome(g,card)
  const actualDamage=g.enemyHp-turn.enemyHp
  const restored=Math.min(turn.heal,g.maxHp-g.hp)
  Object.assign(g,{hp:turn.hp,enemyHp:turn.enemyHp,power:turn.power})
  g.played++
  const report=[card]
  if(actualDamage) report.push('甲方掉 '+actualDamage+' 血')
  if(turn.heal) report.push(restored?'你回 '+restored+' 血':'你的血量已满')
  if(!g.enemyHp) report.push('击倒！甲方没能还手')
  else report.push(turn.incoming?'你掉 '+turn.incoming+' 血':'你挡住了全部伤害')
  g.last=report.join(' · ')
  if(!g.enemyHp) {
    g.result=g.stage===4?'win':'loot'
    const pool=Object.keys(prizes)
    while(g.result==='loot' && g.offers.length<3) {
      g.offers.push(pool.splice(Math.floor(g.random()*pool.length),1)[0])
    }
  } else if(!g.hp) g.result='lose'
  else deal(g)
}
function choose(g,key) {
  if(g.result!=='loot'||!g.offers.includes(key)) return
  g.perks[key]=(g.perks[key]||0)+1
  g.stage++
  g.hp=Math.min(g.maxHp,g.hp+5)
  beginFight(g)
}
if(typeof module!=='undefined') module.exports={newRun,act,choose,outcome}
