let night = newRun()
let tutorial = start(0)
let game = night
const el = id => document.getElementById(id)
function cardButton(card, effect, extra='', style='') {
  return '<button class="hand '+style+'" data-card="'+card+'"><b>'+card+'</b><small>'+effect+'</small><span>'+extra+'</span></button>'
}
function battleCard(g,card) {
  const t=outcome(g,card)
  const lines=[]
  if(t.damage) lines.push('打 '+t.damage+' 血')
  if(t.block) lines.push('挡 '+t.block+' 伤害')
  if(t.heal) lines.push('回 '+t.heal+' 血')
  if(t.bonus) lines.push('下次攻击 +'+t.bonus)
  const after=!t.enemyHp?'击倒甲方':!t.hp?'你将倒下':'你的血 '+g.hp+' → '+t.hp
  return cardButton(card,lines.join(' · '),after,t.damage?'strike':'defend')
}
function renderBattle(g) {
  el('level').textContent='第 '+g.stage+' / 4 战'
  el('rival').textContent='甲方 · '+rivals[g.stage-1]
  for(const [id,label,hp,max] of [['enemyBar','foehp',g.enemyHp,g.enemyMax],['myBar','myhp',g.hp,g.maxHp]]) {
    el(label).textContent=hp+' / '+max+' 血'
    el(id).max=max
    el(id).value=hp
  }
  el('intent').textContent=g.result ? (g.enemyHp?'你已倒下':'甲方已倒下') : '你出牌后，甲方将打你 '+g.intent+' 血'
  const badges=Object.entries(g.perks).map(([key,n])=>'<span title="'+prizes[key]+'">'+key+' ×'+n+'</span>')
  if(g.power) badges.unshift('<b>下次攻击 +'+g.power+'</b>')
  el('build').innerHTML=badges.join('')
  el('build').hidden=!badges.length
  el('log').textContent=g.last || (g.stage===1?'先试「攻击」：甲方掉 4 血，然后还手。打倒四个甲方就赢。':'先看甲方要打几血，再选一张手牌。')
  el('handhint').textContent='点一张，结算一回合'
  el('hand').innerHTML=g.hand.map(card=>battleCard(g,card)).join('')
  el('result').textContent=g.result==='lose'?'你的血量归零，本趟结束。':g.result==='win'?'四战全胜！打卡下班。':'击倒了'+rivals[g.stage-1]+'！'
  el('rules').textContent='双方各有一条血。每回合你先出一张牌，甲方还活着才会还手，然后重新抽三张牌。格挡只挡本回合，积攒的攻击加成留到下一次攻击。前 3 战获胜可选强化并回 5 血。'
}
function renderPuzzle(g) {
  el('level').textContent='解谜 '+(g.level+1)+' / 3 · '+g.name
  el('energy').textContent=g.energy
  el('helpers').textContent='在场小弟 × '+g.helpers
  el('deck').innerHTML=g.deck.map((card,i)=>i===0?'<div class="ticket"><label>本回合生效</label><strong>'+card+'</strong>'+effects[card]+'</div>':'<span class="queued">'+(i+1)+' '+card+'</span>').join('')||'工单已清空'
  el('log').textContent=g.last||'撑过所有甲方牌。精力归零就输。'
  el('handhint').textContent='点一张出牌'
  el('hand').innerHTML=g.hand.map(c=>cardButton(c,effects[c])).join('')||'手牌已用完'
  el('result').textContent=g.result==='lose'?'精力耗尽，本关失败。':'本关通过！剩余精力 '+g.energy
  el('rules').textContent='每回合可出一张手牌，或留牌跳过。甲方最左边的牌接着生效，最后每个小弟扣 1 精力。撑到工单清空就赢。'
}
function render() {
  const g=game, battle=!!g.rogue, loot=g.result==='loot'
  el('arena').hidden=!battle
  for(const id of ['oldStats','oldDesk','reset']) el(id).hidden=battle
  el('build').hidden=!battle
  el('mode').textContent=battle?'旧版解谜 ↗':'回到对战 ↗'
  el('turn').textContent='回合 '+(g.played+(g.result?0:1))
  if(battle) renderBattle(g)
  else renderPuzzle(g)
  el('log').setAttribute('data-hit',String(battle && g.played>0))
  el('choices').hidden=!!g.result
  el('result').hidden=!g.result
  el('loot').hidden=!loot
  el('offers').innerHTML=loot?g.offers.map(key=>'<button data-prize="'+key+'"><b>'+key+'</b><small>'+prizes[key]+'</small></button>').join(''):''
  el('action').hidden=battle && (!g.result||loot)
  el('action').textContent=battle?'新开一趟':!g.result?'不出牌':g.result==='lose'?'再试本关':g.level===2?'回到对战':'进入下一关'
}
el('hand').onclick = event => {
  const button=event.target.closest('[data-card]')
  if(!button) return
  if(game.rogue) act(game,button.dataset.card)
  else play(game,button.dataset.card)
  render()
}
el('action').onclick = () => {
  if(game.rogue) game=night=newRun()
  else if(!game.result) play(game,'不出牌')
  else if(game.result==='win'&&game.level===2) game=night
  else game=tutorial=start(game.result==='lose'?game.level:game.level+1)
  render()
}
el('mode').onclick=()=>{game=game.rogue?tutorial:night;render()}
el('reset').onclick=()=>{game=tutorial=start(game.level);render()}
el('offers').onclick=event=>{
  const button=event.target.closest('[data-prize]')
  if(button){choose(game,button.dataset.prize);render()}
}
render()
