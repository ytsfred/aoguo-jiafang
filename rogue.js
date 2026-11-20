const nights = ['临时改稿','跨部门会签','通宵提案','董事会终审']
const hits = {'再改一版':3,'明早要':2,'推翻重做':5,'终审驳回':7,'拉个群':0}
const prizes = {
  '红头印章':'「拍板结案」多清 1 单',
  '一键群发':'每张「抄送全员」多攒 1 层连击',
  '自动回复':'「已读不回」多退 1 单',
  '带薪休假':'「下班了」结算前先清 1 单',
  '双倍浓缩':'「下班了」额外回复 3 精力',
  '会议纪要':'每场开局自带 2 层连击'
}
const officeCards = ['拍板结案','拍板结案','已读不回','已读不回','抄送全员','抄送全员','下班了','下班了','全员静音']
function shuffled(cards,random) {
  const out = [...cards]
  for(let i=out.length-1;i>0;i--) {
    const j = Math.floor(random()*(i+1))
    ;[out[i],out[j]] = [out[j],out[i]]
  }
  return out
}
function draw(g) {
  if(!g.pile.length) {
    g.pile = shuffled(g.discard,g.random)
    g.discard = []
  }
  if(g.pile.length) g.hand.push(g.pile.pop())
}
function beginNight(g) {
  const pool = ['再改一版','再改一版','明早要','拉个群','明早要']
  for(let i=1;i<g.stage;i++) pool.push('推翻重做','拉个群')
  g.deck = shuffled(pool,g.random)
  if(g.stage===4) g.deck.push('终审驳回','终审驳回')
  g.pile = shuffled(officeCards,g.random)
  g.discard = []
  g.hand = []
  while(g.hand.length<3) draw(g)
  Object.assign(g,{helpers:0,charge:2*(g.perks['会议纪要']||0),played:0,burst:0,bonusUsed:false,result:'',offers:[],last:''})
}
function newRun(random=Math.random) {
  const g = {rogue:true,stage:1,energy:12,perks:{},random}
  beginNight(g)
  return g
}
function strength(g,key) { return g.perks[key] || 0 }
function clears(g,card) {
  if(card==='老板特批') return 4
  if(card==='拍板结案') return 2+g.charge+strength(g,'红头印章')
  if(card==='已读不回') return 1+Number(hits[g.deck[0]]>=3)+strength(g,'自动回复')
  if(card==='下班了') return strength(g,'带薪休假')
  return 0
}
function cardHint(g,card) {
  if(card==='老板特批') return '一次性金卡 · 直接清 4 单'
  if(card==='抄送全员') return '免费抽 1 张 · 连击 +'+(1+strength(g,'一键群发'))
  if(card==='下班了') return '回 '+(3+3*strength(g,'双倍浓缩'))+' 精力'+(clears(g,card)?' · 清 '+clears(g,card)+' 单':'')
  if(card==='全员静音') return '清空小弟 · 挡本单'
  return (card==='拍板结案'?'消耗连击':'挡重击可反制')+' · 清 '+Math.min(g.deck.length,clears(g,card))+' 单'
}
function act(g,card) {
  if(g.result) return
  if(card!=='不出牌') {
    const i=g.hand.indexOf(card)
    if(i<0) return
    g.hand.splice(i,1)
    if(card!=='老板特批') g.discard.push(card)
  }
  g.burst=0
  if(card==='抄送全员') {
    g.charge+=1+strength(g,'一键群发')
    draw(g)
    g.last='免费连打！抽到「'+g.hand.at(-1)+'」，连击 ×'+g.charge+'。甲方还没动。'
    return
  }
  const current=g.deck[0]
  const count=clears(g,card)
  if(card==='拍板结案') g.charge=0
  if(card==='下班了') g.energy+=3+3*strength(g,'双倍浓缩')
  if(card==='全员静音') g.helpers=0
  const removed=g.deck.splice(0,card==='全员静音'?1:count)
  g.burst=removed.length
  if(!removed.length) {
    g.deck.shift()
    if(current==='拉个群') g.helpers++
    g.energy-=hits[current]
  }
  const pressure=g.stage>=3?1:0
  g.energy=Math.max(0,g.energy-g.helpers-pressure)
  g.played++
  g.last=removed.length ? card+'！连退 '+removed.length+' 单 · '+removed.join('、') : card+' · '+current+' 生效'
  if(g.helpers+pressure) g.last+=' · 持续扣 '+(g.helpers+pressure)+' 精力'
  if(!g.energy) g.result='lose'
  else if(!g.deck.length) {
    g.result=g.stage===4?'win':'loot'
    if(g.result==='loot') g.offers=shuffled(Object.keys(prizes),g.random).slice(0,3)
  } else if (g.burst>=3 && !g.bonusUsed) {
    g.bonusUsed=true
    g.hand.push('老板特批')
    g.last+=' · 爆出金卡「老板特批」！'
  } else {
    const oldSize=g.hand.length
    while(g.hand.length<3) draw(g)
    if(g.hand.length>oldSize) g.last+=' · 抽到「'+g.hand.at(-1)+'」'
  }
}
function choose(g,key) {
  if(g.result!=='loot'||!g.offers.includes(key)) return
  g.perks[key]=strength(g,key)+1
  g.stage++
  beginNight(g)
}
if(typeof module!=='undefined') module.exports={newRun,act,choose}
