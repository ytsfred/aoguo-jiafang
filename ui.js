let game = start(0)
const el = id => document.getElementById(id)
function render() {
  const g = game
  el('energy').textContent = g.energy
  el('helpers').textContent = '场上小弟　'+g.helpers
  el('level').textContent = '第 '+(g.level+1)+' / 3 关 · '+g.name
  el('turn').textContent = '回合 '+(g.played+(g.result?0:1))
  el('deck').innerHTML = g.deck.map((card,i) =>
    '<div class="card '+(i?'':'next')+'"><span class="tag">'+(i?String(i+1).padStart(2,'0'):'即将生效')+'</span><b>'+card+'</b><small>'+effects[card]+'</small></div>').join('') || '甲方牌已出完'
  el('log').textContent = g.last || '撑过所有甲方牌。精力归零就输。'
  el('choices').hidden = !!g.result
  el('hand').innerHTML = g.hand.map(card =>
    '<button class="card hand" data-card="'+card+'"><b>'+card+'</b><small>'+effects[card]+'</small></button>').join('') || '手牌已用完'
  el('result').hidden = !g.result
  el('result').textContent = g.result==='lose'?'精力耗尽，本关失败。':g.level===2?'三关全过，甲方被熬垮了！':'甲方被熬垮了，本关通过！'
  el('action').textContent = !g.result?'不出牌':g.result==='lose'?'再试本关':g.level===2?'从头再玩':'进入下一关'
}
el('hand').onclick = event => {
  const button = event.target.closest('[data-card]')
  if (button) { play(game,button.dataset.card); render() }
}
el('action').onclick = () => {
  if (!game.result) play(game,'不出牌')
  else game = start(game.result==='lose'?game.level:(game.level+1)%levels.length)
  render()
}
el('reset').onclick = () => { game = start(game.level); render() }
render()
