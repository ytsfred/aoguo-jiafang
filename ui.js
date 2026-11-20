let night = newRun()
let tutorial = start(0)
let game = night
const el = id => document.getElementById(id)
function cardButton(card, effect, extra='', style='') {
  return '<button class="hand '+style+'" data-card="'+card+'"><b>'+card+'</b><small>'+effect+'</small><span>'+extra+'</span></button>'
}
// Each card reads as icon + number. Attack numbers are recalculated live.
const faces = {
  攻击:[['⚔️',6]], 重击:[['⚔️',12]], 快攻:[['⚔️',3]], 连打:[['⚔️','3+']], 拍板:[['💥',''],['⚔️',9]],
  梭哈:[['⚔️','7×⚡']], 硬刚:[['⚔️','=🛡️']], 格挡:[['🛡️',5]], 铁壁:[['🛡️',12]], 甩锅:[['🛡️',5],['🃏',1]],
  加班:[['🃏',2],['❤️','−2']], 咖啡:[['⚡','+2']], 熬夜:[['⚔️','+3']], 摸鱼:[['❤️','+6']], 退群:[['👥','✕'],['🃏',1]], 返工:[['🗑️','']]
}
const rivalFaces = ['🙋‍♂️','🧑‍💼','😤','🤴']
const isStrike = c => !!(c.hit || c.allIn || c.hitBlock)
function kind(c) { return c.junk ? 'junk' : isStrike(c) ? 'strike' : c.block ? 'defend' : 'skill' }
function cardHtml(name, attrs, g) {
  const c = cards[name], fx = faces[name].map(x => [...x])
  if (g && isStrike(c)) fx.find(x => x[0] === '⚔️')[1] = strike(g, name)
  const cost = c.cost === 'all' ? '⚡' : c.cost
  return '<button class="card '+kind(c)+'" '+attrs+' title="'+c.text+'" aria-label="'+name+'：'+c.text+'"><i>'+cost+'</i><span class="fx">'+
    fx.map(([icon, n]) => '<span>'+icon+'<b>'+n+'</b></span>').join('')+'</span><em>'+name+'</em></button>'
}
function intentHtml(g) {
  const m = g.intent, {hit} = incoming(g), fx = []
  if (hit) fx.push(['⚔️', hit])
  if (m.junk) fx.push(['🗑️', '×'+m.junk])
  if (m.minion) fx.push(['👥', '+1'])
  if (m.shield) fx.push(['🛡️', '+'+m.shield])
  if (m.key === '开个会') fx.push(['⏳', '→ ⚔️'+(moves['终版要'](g.stage).hit + 2*g.minions)])
  return '<div class="bubble'+(hit >= 15 ? ' danger' : '')+'"><q>'+m.key+'！</q>'+fx.map(([icon, n]) => '<span>'+icon+'<b>'+n+'</b></span>').join('')+'</div>'
}
const tag = (icon, n, cls='') => '<span class="'+cls+'">'+icon+'<b>'+n+'</b></span>'
function bar(id, hp, max, loss=0) {
  el(id).querySelector('i').style.width = 100*(hp-loss)/max+'%'
  const s = el(id).querySelector('s')
  if (s) s.style.width = 100*loss/max+'%'
}
function renderBattle(g) {
  el('ladder').innerHTML = rivalFaces.map((f,i) => '<span class="'+(i+1<g.stage||g.result==='win'?'done':i+1===g.stage?'now':'')+'">'+f+'</span>').join('<i></i>')
  el('foeFace').textContent = rivalFaces[g.stage-1]
  el('rival').textContent = rivals[g.stage-1].name
  el('foehp').textContent = g.enemyHp+'/'+g.enemyMax
  el('myhp').textContent = g.hp+'/'+g.maxHp
  const loss = g.result ? 0 : Math.min(g.hp, incoming(g).lost)
  bar('enemyBar', g.enemyHp, g.enemyMax)
  bar('myBar', g.hp, g.maxHp, loss)
  el('foeTags').innerHTML = (g.shield ? tag('🛡️', g.shield) : '') + (g.minions ? tag('👥', '×'+g.minions) : '')
  el('myTags').innerHTML = (g.block ? tag('🛡️', g.block, loss ? '' : 'safe') : '') + (g.power ? tag('⚔️', '+'+g.power) : '')
  el('intent').innerHTML = g.result ? '' : intentHtml(g)
  el('pips').innerHTML = '<b>⚡</b>'.repeat(g.energy)+'<i>⚡</i>'.repeat(Math.max(0,3-g.energy))
  el('pips').setAttribute('aria-label', '精力 '+g.energy)
  const playable = g.hand.map((_,i) => canPlay(g,i))
  const first = g.stage===1 && g.turn===1 && !g.playedThisTurn ? playable.indexOf(true) : -1
  el('hand').innerHTML = g.hand.map((name,i) => cardHtml(name, 'data-i="'+i+'"'+(playable[i]?'':' aria-disabled="true"')+(i===first?' data-hint':''), g)).join('')
  el('action').toggleAttribute('data-nudge', !g.result && !playable.includes(true))
  el('log').textContent = g.last
  const best = '<small>最猛一回合 ⚔️ '+g.best+'</small>'
  el('result').innerHTML = g.result==='lose' ? '<big>😵</big>被甲方熬垮了'+best : g.result==='win' ? '<big>🎉</big>下班！'+best : '<big class="down">'+rivalFaces[g.stage-1]+'</big>倒下了！'
  el('rules').textContent = '⚔️ 打甲方 · 🛡️ 挡这回合的伤害 · ⚡ 精力（每回合 3 点，牌左上角是费用）· 🃏 抽牌 · ❤️ 血 · 🗑️ 返工（废牌）· 👥 小弟（每回合多打你 2）· ⏳ 甲方憋大招。出完牌点「结束回合」，甲方按气泡出招。打倒 4 个甲方下班。'
}
function renderPuzzle(g) {
  el('level').textContent='解谜 '+(g.level+1)+' / 3 · '+g.name
  el('turn').textContent='回合 '+(g.played+(g.result?0:1))
  el('energy').textContent=g.energy
  el('helpers').textContent='在场小弟 × '+g.helpers
  el('deck').innerHTML=g.deck.map((card,i)=>i===0?'<div class="ticket"><label>本回合生效</label><strong>'+card+'</strong>'+effects[card]+'</div>':'<span class="queued">'+(i+1)+' '+card+'</span>').join('')||'工单已清空'
  el('log').textContent=g.last||'撑过所有甲方牌。精力归零就输。'
  el('hand').innerHTML=g.hand.map(c=>cardButton(c,effects[c])).join('')||'手牌已用完'
  el('result').textContent=g.result==='lose'?'精力耗尽，本关失败。':'本关通过！剩余精力 '+g.energy
  el('rules').textContent='每回合可出一张手牌，或留牌跳过。甲方最左边的牌接着生效，最后每个小弟扣 1 精力。撑到工单清空就赢。'
}
function render() {
  const g=game, battle=!!g.rogue, loot=g.result==='loot'
  document.body.classList.toggle('battle', battle)
  el('arena').hidden=!battle
  for(const id of ['oldStats','oldDesk','reset','subtitle','handTitle','handhint']) el(id).hidden=battle
  el('pips').hidden=!battle
  el('mode').textContent=battle?'旧版解谜 ↗':'回到对战 ↗'
  if(battle) renderBattle(g)
  else renderPuzzle(g)
  el('choices').hidden=!!g.result
  el('result').hidden=!g.result
  el('loot').hidden=!loot
  el('offers').innerHTML=loot?g.offers.map(key=>cardHtml(key,'data-prize="'+key+'"')).join(''):''
  el('action').hidden=battle && loot
  el('action').className=battle && !g.result?'primary':''
  el('action').textContent=battle?(g.result?'再来一趟':'结束回合'):!g.result?'不出牌':g.result==='lose'?'再试本关':g.level===2?'回到对战':'进入下一关'
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
