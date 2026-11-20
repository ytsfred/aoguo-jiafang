let game = start(0)
const el = id => document.getElementById(id)
const icons = {'已读不回':'×','下班了':'+','退群':'↗'}
function render(delta) {
  const g = game
  const challenge = g.level === 3
  el('mode').textContent = challenge ? '回到教学 ↗' : '夜班挑战 ↗'
  el('level').textContent = challenge ? '夜班挑战 · 工单 '+String(g.deal+1).padStart(2,'0') : '教学 '+(g.level+1)+' / 3 · '+(g.level === 0 ? '初次交手' : g.name)
  el('energy').textContent = g.energy
  el('delta').textContent = delta == null ? '' : (delta > 0 ? '+' : '') + delta
  el('helpers').textContent = '在场小弟 × '+g.helpers
  el('turn').textContent = '回合 '+(g.played+(g.result?0:1))
  el('deck').innerHTML = g.deck.map((card,i) => i === 0
    ? '<div class="ticket"><label>本回合生效</label><strong>'+card+'</strong>'+effects[card]+'</div>'
    : '<span class="queued" title="'+effects[card]+'"><i>0'+(i+1)+'</i> '+card+'</span>').join('') || '工单已清空'
  el('log').textContent = g.last || (challenge ? '反击机会：挡下「再改一版」，下一张工单也会被退回。' : '撑过所有甲方牌。精力归零就输。')
  el('log').classList.toggle('counter',g.last.startsWith('反击'))
  el('log').classList.remove('pulse')
  if (g.last) { void el('log').offsetWidth; el('log').classList.add('pulse') }
  el('choices').hidden = !!g.result
  const canCounter = challenge && g.deck[0] === '再改一版' && g.deck.length > 1
  el('hand').innerHTML = g.hand.map(card =>
    '<button class="hand '+(canCounter && card === '已读不回' ? 'armed' : '')+'" data-card="'+card+'"><i aria-hidden="true">'+icons[card]+'</i><b>'+card+'</b><small>'+(canCounter && card === '已读不回' ? '反击 · 连退两单' : effects[card])+'</small></button>').join('') || '手牌已用完'
  el('result').hidden = !g.result
  el('result').textContent = g.result==='lose'?'精力耗尽，本局失败。':'准点打卡 ✓ 甲方被熬垮了！剩余精力 '+g.energy
  el('action').textContent = !g.result?'不出牌':g.result==='lose'?'再试本局':challenge?'再抽一局':g.level===2?'进入夜班挑战':'进入下一关'
}
function takeTurn(card) {
  const before = game.energy
  play(game,card)
  render(game.energy-before)
}
function newGame(level,deal) {
  game = start(level,deal)
  render()
}
el('hand').onclick = event => {
  const button = event.target.closest('[data-card]')
  if (button) takeTurn(button.dataset.card)
}
el('action').onclick = () => {
  if (!game.result) return takeTurn('不出牌')
  if (game.result==='lose') return newGame(game.level,game.deal)
  if (game.level===3) {
    const offset = 1 + Math.floor(Math.random()*(challengeDecks.length-1))
    return newGame(3,(game.deal+offset)%challengeDecks.length)
  }
  newGame(game.level+1)
}
el('mode').onclick = () => newGame(game.level===3 ? 0 : 3)
el('reset').onclick = () => newGame(game.level,game.deal)
render()
