let night = newRun()
let tutorial = start(0)
let game = night
const el = id => document.getElementById(id)
const icons = {'已读不回':'×','下班了':'+','退群':'↗','抄送全员':'»','拍板结案':'印','全员静音':'⊘','老板特批':'★'}
function render(delta) {
  const g = game
  const rogue = !!g.rogue
  const loot = g.result === 'loot'
  el('mode').textContent = rogue ? '三关教学 ↗' : '夜班肉鸽 ↗'
  el('level').textContent = rogue ? '夜班 '+g.stage+' / 4 · '+nights[g.stage-1] : '教学 '+(g.level+1)+' / 3 · '+(g.level === 0 ? '初次交手' : g.name)
  el('build').hidden = !rogue
  if (rogue) {
    const badges = Object.entries(g.perks).map(([key,n]) => '<span title="'+prizes[key]+'">'+key+' ×'+n+'</span>')
    el('build').innerHTML = '<b>连击 ×'+g.charge+'</b>'+badges.join('')+(g.stage>=3?'<span>疲劳 −1 / 回合</span>':'')
  }
  el('loot').hidden = !loot
  el('offers').innerHTML = loot ? g.offers.map(key => '<button data-prize="'+key+'"><b>'+key+'</b><small>'+prizes[key]+'</small></button>').join('') : ''
  el('handhint').textContent = rogue ? '出牌后随机补至 3 张' : '点一张出牌'
  el('reset').hidden = rogue
  el('action').hidden = loot
  el('energy').textContent = g.energy
  el('delta').textContent = delta == null ? '' : (delta > 0 ? '+' : '') + delta
  el('helpers').textContent = '在场小弟 × '+g.helpers
  el('turn').textContent = '回合 '+(g.played+(g.result?0:1))
  function threat(card) {
    if (!rogue) return effects[card]
    return card==='拉个群' ? '增加 1 个持续扣血的小弟' : '精力 −'+hits[card]
  }
  el('deck').innerHTML = g.deck.map((card,i) => i === 0
    ? '<div class="ticket"><label>本回合生效</label><strong>'+card+'</strong>'+threat(card)+'</div>'
    : '<span class="queued" title="'+threat(card)+'"><i>'+String(i+1).padStart(2,'0')+'</i> '+card+'</span>').join('') || '工单已清空'
  el('log').textContent = g.last || (rogue ? '清空四场工单就能下班。抄送攒连击，拍板一次清多单。' : '撑过所有甲方牌。精力归零就输。')
  el('log').classList.toggle('counter',rogue && (g.burst>=2 || g.last.startsWith('免费')))
  el('log').classList.remove('pulse')
  if (g.last) { void el('log').offsetWidth; el('log').classList.add('pulse') }
  el('burst').hidden = !(rogue && g.burst>=2)
  if(!el('burst').hidden) {
    el('burst').innerHTML = '<strong>×'+g.burst+'</strong> 连单退回'
    el('burst').classList.remove('slam')
    void el('burst').offsetWidth
    el('burst').classList.add('slam')
  }
  el('choices').hidden = !!g.result
  el('hand').innerHTML = g.hand.map(card => {
    const armed = rogue && (clears(g,card)>=2 || card==='抄送全员')
    return '<button class="hand '+(card==='老板特批'?'gold':armed?'armed':'')+'" data-card="'+card+'"><i aria-hidden="true">'+icons[card]+'</i><b>'+card+'</b><small>'+(rogue?cardHint(g,card):effects[card])+'</small></button>'
  }).join('') || '手牌已用完'
  el('result').hidden = !g.result
  el('result').textContent = g.result==='lose'?'精力耗尽，本局失败。':loot?'本场清空 ✓ 带着 '+g.energy+' 精力进入下一场':rogue?'终审清空！四场全胜，打卡下班。':'甲方被熬垮了！剩余精力 '+g.energy
  el('action').textContent = !g.result?'不出牌':rogue?'新开一趟夜班':g.result==='lose'?'再试本关':g.level===2?'进入夜班肉鸽':'进入下一关'

}
function takeTurn(card) {
  const before = game.energy
  if(game.rogue) act(game,card)
  else play(game,card)
  render(game.energy-before)
}
function newGame(level) {
  tutorial = start(level)
  game = tutorial
  render()
}
el('hand').onclick = event => {
  const button = event.target.closest('[data-card]')
  if (button) takeTurn(button.dataset.card)
}
el('action').onclick = () => {
  if (!game.result) return takeTurn('不出牌')
  if (game.rogue) {
    night = newRun()
    game = night
    return render()
  }
  if (game.result==='lose') return newGame(game.level)
  if (game.level===2) { game=night; return render() }
  newGame(game.level+1)
}
el('mode').onclick = () => { game = game.rogue ? tutorial : night; render() }
el('reset').onclick = () => newGame(game.level)
el('offers').onclick = event => {
  const button = event.target.closest('[data-prize]')
  if (button) { choose(game,button.dataset.prize); render() }
}
render()
