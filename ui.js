let night = newRun()
let tutorial = start(0)
let game = night
const el = id => document.getElementById(id)
function cardButton(card, effect, extra='', style='') {
  return '<button class="hand '+style+'" data-card="'+card+'"><b>'+card+'</b><small>'+effect+'</small><span>'+extra+'</span></button>'
}
function kind(c) {
  return c.junk ? 'junk' : (c.hit || c.allIn || c.hitBlock) ? 'strike' : c.block ? 'defend' : 'skill'
}
function deckCard(g, name, i) {
  const c = cards[name], ok = canPlay(g, i), hit = strike(g, name)
  const cost = c.cost === 'all' ? '全' : c.cost
  const now = hit && hit !== c.hit && !g.result ? '现在打 ' + hit : ''
  return '<button class="card '+kind(c)+'" data-i="'+i+'"'+(ok?'':' aria-disabled="true"')+'><i>'+cost+'</i><b>'+name+'</b><small>'+c.text+'</small><span>'+now+'</span></button>'
}
function intentHtml(g) {
  if (g.result) return ''
  const m = g.intent, {hit, lost} = incoming(g)
  const extra = g.minions ? '（含小弟 ×'+g.minions+' 各打 2）' : ''
  let note = m.text === '打你' || m.text === '重击' ? '' : m.text
  let guard = !hit ? '这回合不打你，放手进攻' : !g.block ? '' : lost ? '你挡 '+g.block+'，还会掉 '+lost+' 血' : '你挡 '+g.block+'，全挡住了'
  return '<small>甲方下一招</small><strong>'+m.key+'</strong>'+(hit?'<em>打你 '+hit+'</em>':'')+
    '<p>'+[note, extra, guard].filter(Boolean).join(' · ')+'</p>'
}
function renderBattle(g) {
  el('level').textContent = '第 '+g.stage+' / 4 战'
  el('turn').textContent = '回合 '+g.turn
  el('rival').textContent = '甲方 · '+rivals[g.stage-1].name
  el('foehp').innerHTML = g.enemyHp+' / '+g.enemyMax+' 血'+(g.shield?' <u>护盾 '+g.shield+'</u>':'')
  el('myhp').innerHTML = g.hp+' / '+g.maxHp+' 血'+(g.block?' <u>格挡 '+g.block+'</u>':'')
  for (const [id, hp, max] of [['enemyBar',g.enemyHp,g.enemyMax],['myBar',g.hp,g.maxHp]]) { el(id).max = max; el(id).value = hp }
  el('intent').innerHTML = intentHtml(g)
  el('intent').dataset.big = String(incoming(g).hit >= 15)
  el('pips').innerHTML = '精力 '+'<b>●</b>'.repeat(g.energy)+'<i>○</i>'.repeat(Math.max(0,3-g.energy))
  el('piles').textContent = '牌堆 '+g.draw.length+' · 弃牌 '+g.discard.length
  const added = g.deck.slice(starter.length)
  const badges = added.map(name => '<span>+ '+name+'</span>')
  if (g.power) badges.unshift('<b>熬夜中：攻击 +'+g.power+'</b>')
  el('build').innerHTML = badges.join('')
  el('build').hidden = !badges.length
  el('log').textContent = g.last || (g.stage===1 && g.turn===1 ? '每回合 3 点精力，牌左上角是费用。出完点「结束回合」，甲方按预告出招。' : '看甲方下一招，决定这回合是打还是挡。')
  el('handhint').textContent = '可连出，费用够就能点'
  el('hand').innerHTML = g.hand.map((name,i) => deckCard(g,name,i)).join('')
  el('result').innerHTML = g.result==='lose' ? '你的血量归零，本趟结束。<br><small>本趟最猛一回合：打出 '+g.best+'</small>' :
    g.result==='win' ? '四战全胜！打卡下班。<br><small>本趟最猛一回合：打出 '+g.best+'</small>' : '击倒了'+rivals[g.stage-1].name+'！'
  el('rules').textContent = '每回合 3 点精力、5 张手牌。牌左上角是费用，精力够就能连着出。点「结束回合」后，甲方按血条下的预告出招，你的格挡只管这一回合。甲方的招：明早要（打你）、再改一版（往你牌堆塞没用的返工）、拉个群（小弟每回合多打你 2）、追加需求（加护盾）、开个会（下回合重击）。打倒甲方后三选一，把一张新牌加进牌堆，回 8 血。连赢 4 战下班。'
}
function renderPuzzle(g) {
  el('level').textContent='解谜 '+(g.level+1)+' / 3 · '+g.name
  el('turn').textContent='回合 '+(g.played+(g.result?0:1))
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
  if(battle) renderBattle(g)
  else renderPuzzle(g)
  el('choices').hidden=!!g.result
  el('result').hidden=!g.result
  el('loot').hidden=!loot
  el('offers').innerHTML=loot?g.offers.map(key=>'<button data-prize="'+key+'"><i>'+(cards[key].cost==='all'?'全':cards[key].cost)+'</i><b>'+key+'</b><small>'+cards[key].text+'</small></button>').join(''):''
  el('action').hidden=battle && loot
  el('action').className=battle && !g.result?'primary':''
  el('action').textContent=battle?(g.result?'新开一趟':'结束回合'):!g.result?'不出牌':g.result==='lose'?'再试本关':g.level===2?'回到对战':'进入下一关'
}
// Floating numbers and a short flash; the CSS turns them off under reduced motion.
function pop(id, panel, text, big) {
  const p=el(id)
  p.textContent=text
  p.className='pop'+(big?' big':'')+(text[0]==='+'?' heal':'')
  el(panel).classList.remove('hurt')
  void p.offsetWidth
  p.classList.add('go')
  el(panel).classList.add('hurt')
}
function withFeedback(action) {
  const g=game, foe=g.enemyHp+g.shield, me=g.hp, stage=g.stage
  action()
  if (g.stage!==stage) return render()
  render()
  const dealt=foe-g.enemyHp-g.shield, lost=me-g.hp
  if (dealt>0) pop('foePop','foe','−'+dealt,dealt>=15)
  if (lost>0) pop('myPop','me','−'+lost,lost>=15)
  else if (lost<0) pop('myPop','me','+'+(-lost))
}
el('hand').onclick = event => {
  const button=event.target.closest('[data-i],[data-card]')
  if(!button) return
  if(game.rogue) withFeedback(()=>act(game,Number(button.dataset.i)))
  else { play(game,button.dataset.card); render() }
}
el('action').onclick = () => {
  if(game.rogue && !game.result) return withFeedback(()=>endTurn(game))
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
