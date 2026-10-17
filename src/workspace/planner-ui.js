/**
 * Extension page · Raise weight: which listing to buy for my holdings, taking pieces to 400% (each one's own cheapest
 * plan, and one combined plan for the pieces ticked), owning a whole trait (a monopoly: the listings to buy, and the
 * numbers only a private deal brings) and simulating a listing, sale or reclaim. Numbers added beside my holdings (a
 * teammate's or any) are planned like holdings here only. DOM over NakaPlanner (pure, exact); nothing leaves the device.
 * Controls are built once and relabelled on each render, so typing survives a new block; only result areas are rebuilt.
 * Heavy results are cached per block and inputs, and a listing that starts closing between blocks recomputes only the
 * results it can change; a result on screen stays there until its replacement is ready. Every buy link opens the
 * collection page at that card (NakaExploreUI.marketFind), where a piece someone just bought shows as sold.
 */
(function(root){
 'use strict';
 const copy={
  zh:{
   title:'增加权重',tab:'增加权重',basis:'按顶部区块的挂单计算 · 不含手续费',sep:'、',
   tabs:{buy:'买哪单划算',plan:'冲 400%',lock:'垄断特征',sim:'模拟'},
   goal:{buy:'针对我的持仓，我想花最少的钱，让每周 SHNAKAS 增加最多',plan:'针对我的持仓，在当前区块把它们冲到 400%',lock:'我想垄断一个特征：带它的 Naka 全在我们手里',sim:'我想知道挂单、成交或撤单会对我和全网有什么影响'},
   how:{buy:'按每 0.001 BTC 换来的每周增量排序。买到的这一枚下周起有奖励；现有持仓的变化从成交那一块起生效。正在成交确认的挂单买不到，不列出。',
    plan:'每行是这一枚单独冲到 400% 最省钱的做法，按每 0.001 BTC 换来的每周增量排序，点一行看步骤。勾选两枚以上，合起来算一份方案：共用的挂单只买一次。',
    lock:'垄断后，没人能再挂低价单拉低它的加成。点一行看做法：在售的买下；没挂单的私下收购，复制求购信息发到 Naka Telegram 群。持仓和队友的编号加得越全，越能找到最接近垄断的特征：每多一枚，就少找一枚。',
    sim:'在持仓旁输入挂价，或点“地板 / 1.5× / 2× / 3×”快捷挂价，结果马上算出；点 × 清空。也可以输入任意编号，假设它挂单、成交或撤单。'},
   needHoldings:'先在上面的“我的持仓”添加你的 Naka。',
   sort:{rate:'每 0.001 BTC 最划算',gain:'每周增加最多',ask:'挂价最低'},
   buyCount:(n,m,k)=>`能让你每周增加的 ${n} 单 / 在售 ${m} 单${k?` · 另有 ${k} 单正在成交确认，买不到`:''}`,
   buyGain:v=>`下周起每周 +${v}`,buySplit:(a,b)=>`成交后现有持仓 ${a}（立即）· 买到的这一枚 +${b}（下周起）`,buyRate:v=>`每 0.001 BTC：每周 +${v}`,
   buyNoWeek:'这是最后一个奖励周：买到的这一枚已经没有能拿奖励的完整周，只有现有持仓的变化',buyNone:'当前没有能让你每周增加的挂单。',buyLink:'去购买 ↗',showAll:n=>`显示全部 ${n} 单`,showLess:'收起',ended:'奖励期已结束，没有还能拿奖励的周。',
   extraLabel:'增加任意（队友）编号',extraPlaceholder:'如 379, 1025',extraAdd:'添加',extraHint:'独立保存，不影响我的持仓',
   extraTag:'队友',extraRemove:n=>`移除 #${n}`,extraHeld:n=>`#${n} 已在我的持仓`,extraDup:n=>`#${n} 已添加`,extraEmpty:'先输入编号，如 379',extraAdded:n=>`已添加 ${n} 枚`,skipped:list=>`没有添加：${list}`,
   extraClear:'全部移除',extraCleared:n=>`已移除 ${n} 枚`,extraUndo:'撤销',
   scope:(mine,extra)=>`按${[mine?`我的持仓 ${mine} 枚`:'',extra?`添加的编号 ${extra} 枚`:''].filter(Boolean).join(' + ')}计算`,
   planPick:n=>n===0?'勾选两枚以上，合起来算一份方案':n===1?'已选 1 枚，再选一枚就合并计算':`已选 ${n} 枚`,selectAll:'全选',selectNone:'全不选',
   planNone:'没有未满 400% 的持仓：可以在上面增加任意（队友）编号。',running:'计算中…',
   planCols:{piece:'编号',weight:'权重',cost:'花费',week:'这一枚每周',total:'我们每周合计',value:'每 0.001 BTC'},
   planTo:(a,b)=>`${a}% → ${b}%`,planMax:(a,b)=>`${a}% → 最高 ${b}%`,planStuck:a=>`${a}% · 抬不高`,planFree:'免费',planAuto:'无需操作',planAutoNote:'挂单关闭后自动达到',planBuys:(b,k)=>[b?`买 ${b} 单`:'',k?`撤 ${k} 单`:''].filter(Boolean).join(' · '),
   pickLabel:n=>`#${n} 加入合并方案`,expand:n=>`展开 #${n} 的步骤`,collapse:n=>`收起 #${n} 的步骤`,
   planLegend:'我们每周合计 = 持仓（含添加的编号）每周的变化 + 买到的几枚下周起的收益。全网共享一个奖池，所以合计小于权重的增量。',
   stepsTitle:'步骤（按顺序）',stepLifts:list=>`提升 ${list}`,serveTitle:(n,list)=>`提升 #${n} 的 ${list}`,
   stepSale:(n,p)=>`买 #${n} · ${p} BTC`,stepCancel:n=>`撤掉自己的挂单 #${n}（免费）`,stepMate:n=>`请队友撤单 #${n}（免费）`,stepClosing:n=>`#${n} 正在成交确认，不用买`,stepClosingCancel:n=>`#${n} 卖家正在撤单，不用买`,stepOwnClosing:(n,mate,sale)=>`#${n} ${mate?'队友':'你'}的挂单正在${sale?'成交':'撤回'}，不用操作`,restSteps:n=>`其余 ${n} 步`,fewerSteps:'收起',
   jointTitle:n=>`合并方案 · 选中的 ${n} 枚`,jointSum:(r,t)=>`${r} / ${t} 枚可到 400%`,jointCost:(c,b,k,f)=>[b?`花 ${c} BTC · 买 ${b} 单`:'不用花钱',k?`撤单 ${k} 单（免费）`:'',f?`${f} 单已在成交或撤单中（不用买）`:''].filter(Boolean).join(' · '),
   jointPer:v=>`每 0.001 BTC 换来每周 +${v}`,jointSeparate:v=>`单独方案相加 ${v} BTC`,
   jointMine:d=>`我的持仓每周 ${d}`,jointExtra:d=>`添加的编号每周 ${d}`,oursWeek:d=>`持仓和添加的编号每周 ${d}`,bought:(n,v)=>`买到的 ${n} 枚下周起每周 +${v}`,boughtNoWeek:n=>`这是最后一个奖励周：买到的 ${n} 枚已经没有能拿奖励的完整周`,jointUnavailable:'这组目标买下后市场上没有挂单，算不出权重。',
   conflict:n=>`#${n}：单独可以冲到 400%，但和其它几枚一起买时集合地板上升会把它拉下来，这份合并方案先不冲它。`,capped:(n,b)=>`#${n}：够不到 400%，最高 ${b}%`,
   whyCeiling:(t,num,c)=>`只有 ${t} 个特征${num?`，编号 +${num}%`:''}：理论上限 ${c}%`,whyRare:(name,top,s)=>`${name}：仅 ${s} 件，清空挂单后按最近 3 笔成交（含买入价）计，最多 +${top}%`,whyTrait:(name,top)=>`${name}：现有挂单撑不到 +100%，最多 +${top}%`,
   kLine:(a,b,p)=>`全网权重单位 K ${a} → ${b}（${p}）：共享这些特征的 Naka 也会变强，每个人的份额同比摊薄，所以每周增量小于权重增量。之后有人挂出更低价的同特征挂单，会再降档。`,
   monoCan:'买下挂单就能垄断',monoHave:'已经垄断',monoFar:'需要私下收购才能垄断',traitCount:n=>`${n} 个特征`,monoNoneCan:'现在没有只靠买挂单就能垄断的特征：每个特征都还有几枚在别人手里、没挂单，市场上买不到。',monoNoneFar:'没有需要私下收购的特征。',
   lockCols:{trait:'特征',ours:'我们 / 共',listed:'在售',missing:'还差',bonus:'加成 现在 → 垄断后',cost:'花费',week:'我们每周'},lockExpand:t=>`展开 ${t} 的做法`,lockCollapse:t=>`收起 ${t} 的做法`,
   bonusStable:'稳定',bonusMoves:'随集合地板变',bonusNoFloor:'算不出',buyFirst:n=>`先买 ${n} 单`,keepLine:n=>`按线挂 #${n}`,
   lockBuy:'买下挂单',lockBuyFirst:'先买下挂单',monoReclaim:'撤掉自己的挂单（免费）',
   monoSplit:(a,n,b)=>`持仓 ${a} · 买到的 ${n} 枚下周起 +${b}`,monoReclaiming:'已在撤单（不用操作）',
   monoStable:'20 件以上且没人挂单：始终 +100%，集合地板怎么变都不影响',monoHolds:(p,a,b)=>`少于 20 件，按最近 3 笔成交与集合地板之比计：集合地板在 ${a}–${b} BTC 之间时保持 ${p}（高于 ${b} 降档，低于 ${a} 升档）`,monoHoldsTop:(p,b)=>`少于 20 件，按最近 3 笔成交与集合地板之比计：集合地板不高于 ${b} BTC 时保持 ${p}，高于就降档`,monoHoldsLow:(p,a)=>`少于 20 件，按最近 3 笔成交与集合地板之比计：现在 ${p}，集合地板跌到 ${a} BTC 以下才会升档`,monoHoldsAll:p=>`少于 20 件、没有成交记录：始终 ${p}`,monoHoldsUnknown:p=>`少于 20 件，按最近 3 笔成交计（现在 ${p}）；这几笔成交给不出精确区间，集合地板一变，加成可能跟着变`,
   keepNew:(n,price,floor,x)=>`建议：让 #${n} 以 ≥ ${price} BTC 挂出（集合地板 ${floor} BTC 的 ${x} 倍；地板涨，这条线也涨）`,keepAsk:(n,ask,price)=>`建议：保留 #${n} 现有挂单（${ask} BTC，不低于线 ${price} BTC）`,keepRaise:(n,ask,price)=>`建议：把 #${n} 改价到 ${price} BTC（现在 ${ask} BTC，低于线）`,
   keepWhy:(n,a,b)=>`这样其余几枚保持 +100%；#${n} 挂着没有奖励，任何人都能买走它，一旦成交，垄断就结束。我们每周 ${a}（不挂：${b}）`,monoNoFloor:'买下后市场上没有挂单，算不出权重',
   closingOwnSale:'我方·成交中',farWanted:n=>`需私下收购 ${n} 枚`,farUnminted:(n,list)=>`未铸造 ${n} 枚：${list}（铸造后才能收购）`,closingSale:'成交中',closingCancel:'撤单中',
   showNumbers:n=>`显示全部 ${n} 个`,hideNumbers:'收起',lockShowAll:n=>`显示全部 ${n} 个特征`,lockShowLess:'收起',
   simAny:'任意编号',simAnyPlaceholder:'如 1500',simPrice:'挂价 BTC',simPricePlaceholder:'如 0.0035',simSale:'假设成交',simCancel:'假设撤单',simListedAt:p=>`挂单中 · ${p} BTC`,simMine:'我的持仓',simBad:'挂价要是 BTC 数字，例如 0.0035',
   clear:'清空',clearAll:'全部清空',
   quick:{floor:'地板',x15:'1.5×',x2:'2×',x3:'3×'},quickHint:(label,v)=>`按 ${label} 挂：${v} BTC`,
   simHead:{list:(n,p)=>`假设 #${n} 以 ${p} BTC 挂出`,sale:n=>`假设 #${n} 成交`,cancel:n=>`假设 #${n} 撤单`},
   safeRuns:list=>`安全挂价：${list} 时不影响任何其它 Naka`,safeRun:(a,b)=>b===null?`≥ ${a} BTC`:`${a}–${b} BTC（不含 ${b}）`,safeNone:'没有安全挂价：这一枚的几个特征要求的价位互相冲突，挂在哪个价都会让别人升档或降档',safeRange:'这一枚有特征是区间值，给不出确定的安全挂价',
   simSelf:(n,a,v)=>`#${n} 挂出后：每周 ${a} → 0（挂单期间没有奖励）${v?`；本周已累计的 ${v} SHNAKAS 也拿不到了`:''}`,
   simK:(a,b,down,up)=>`全网：权重单位 K ${a} → ${b} · ${down} 枚降 · ${up} 枚升`,simWeek:(a,b,d)=>`我的持仓每周：${a} → ${b}（${d}）`,
   simRow:(n,a,b,wa,wb,d)=>`#${n} ${a} → ${b} · 每周 ${wa} → ${wb}（${d}）`,simGone:n=>`#${n} 成交后离开你的持仓`,simSame:'我的其它持仓权重不变',
   simOtc:'想卖给队友？私下转账不产生公开挂单，地板不变；但转出那一周这一枚双方都没有奖励，接收方下周起有奖励。',simListedSelf:'挂单中',
  },
  en:{
   title:'Raise weight',tab:'Raise weight',basis:'From the listings at the block shown above · fees excluded',sep:', ',
   tabs:{buy:'Best buy',plan:'Reach 400%',lock:'Own a trait',sim:'Simulate'},
   goal:{buy:'For my holdings: the most weekly SHNAKAS for the least BTC',plan:'For my holdings: take them to 400% at this block',lock:'I want to own a trait: every Naka with it in our hands',sim:'I want to see what a listing, sale or reclaim does to me and everyone'},
   how:{buy:'Sorted by weekly gain per 0.001 BTC. The piece you buy counts from next week; your other holdings change from the block of the sale. Listings already being bought cannot be bought and are left out.',
    plan:'Each row is that piece’s own cheapest way to 400%, sorted by weekly gain per 0.001 BTC; select a row for its steps. Tick two or more for one combined plan: a listing they share is bought once.',
    lock:'Once it is all ours, nobody can list one cheaply to pull its bonus down. Select a row for the way there: buy what is listed; for the rest, copy a wanted post into the Naka Telegram group. Add all your holdings and teammates’ numbers to find the traits you are closest to owning: each piece added is one fewer to find.',
    sim:'Type an ask next to a holding, or pick Floor / 1.5× / 2× / 3×, and the result appears at once; × clears it. Or enter any number and assume it lists, sells or is reclaimed.'},
   needHoldings:'Add your Nakas under My holdings above first.',
   sort:{rate:'Best per 0.001 BTC',gain:'Largest gain',ask:'Lowest ask'},
   buyCount:(n,m,k)=>`${n} of ${m} listings ${n===1?'raises':'raise'} your weekly SHNAKAS${k?` · ${k} more ${k===1?'is':'are'} being bought and cannot be`:''}`,
   buyGain:v=>`+${v} / week from next week`,buySplit:(a,b)=>`Your holdings ${a} (from the sale) · the piece bought +${b} (from next week)`,buyRate:v=>`Per 0.001 BTC: +${v} / week`,
   buyNoWeek:'This is the last reward week: the piece bought has no full week left; only your other holdings change',buyNone:'No listing raises your weekly SHNAKAS right now.',buyLink:'Buy ↗',showAll:n=>`Show all ${n}`,showLess:'Show fewer',ended:'The reward period is over; no week is left to earn.',
   extraLabel:'Add any number (a teammate’s)',extraPlaceholder:'e.g. 379, 1025',extraAdd:'Add',extraHint:'Saved separately; My holdings are unchanged',
   extraTag:'Mate',extraRemove:n=>`Remove #${n}`,extraHeld:n=>`#${n} is in My holdings`,extraDup:n=>`#${n} is already added`,extraEmpty:'Type a number first, e.g. 379',extraAdded:n=>`${n} added`,skipped:list=>`Not added: ${list}`,
   extraClear:'Remove all',extraCleared:n=>`${n} removed`,extraUndo:'Undo',
   scope:(mine,extra)=>`Counting ${[mine?`my ${mine} holding${mine===1?'':'s'}`:'',extra?`${extra} added number${extra===1?'':'s'}`:''].filter(Boolean).join(' + ')}`,
   planPick:n=>n===0?'Tick two or more for one combined plan':n===1?'1 ticked: tick one more to combine':`${n} ticked`,selectAll:'All',selectNone:'None',
   planNone:'No holding below 400%: add any number (a teammate’s) above.',running:'Computing…',
   planCols:{piece:'Naka',weight:'Weight',cost:'Cost',week:'This piece / week',total:'Ours / week',value:'Per 0.001 BTC'},
   planTo:(a,b)=>`${a}% → ${b}%`,planMax:(a,b)=>`${a}% → ${b}% at most`,planStuck:a=>`${a}% · cannot rise`,planFree:'Free',planAuto:'Nothing to do',planAutoNote:'reached once listings close',planBuys:(b,k)=>[b?`buy ${b}`:'',k?`reclaim ${k}`:''].filter(Boolean).join(' · '),
   pickLabel:n=>`Add #${n} to the combined plan`,expand:n=>`Show the steps for #${n}`,collapse:n=>`Hide the steps for #${n}`,
   planLegend:'Ours / week = the weekly change of our pieces (holdings and numbers added) + what the pieces bought earn from next week. Everyone shares one pool, so it is smaller than the weight gain.',
   stepsTitle:'Steps, in order',stepLifts:list=>`lifts ${list}`,serveTitle:(n,list)=>`Lifts ${list} of #${n}`,
   stepSale:(n,p)=>`Buy #${n} · ${p} BTC`,stepCancel:n=>`Reclaim your listing #${n} (free)`,stepMate:n=>`Ask a teammate to reclaim #${n} (free)`,stepClosing:n=>`#${n} is already being bought; no need to buy`,stepClosingCancel:n=>`#${n} is being reclaimed by its seller; no need to buy`,stepOwnClosing:(n,mate,sale)=>`#${n}: ${mate?'a teammate’s':'your'} listing is already being ${sale?'bought':'reclaimed'}; nothing to do`,restSteps:n=>`${n} more step${n===1?'':'s'}`,fewerSteps:'Show fewer',
   jointTitle:n=>`Combined plan · the ${n} ticked`,jointSum:(r,t)=>`${r} of ${t} reach 400%`,jointCost:(c,b,k,f)=>[b?`${c} BTC · buy ${b}`:'No cost',k?`reclaim ${k} (free)`:'',f?`${f} already being bought or reclaimed (no need to buy)`:''].filter(Boolean).join(' · '),
   jointPer:v=>`+${v} / week per 0.001 BTC`,jointSeparate:v=>`Plans one by one add up to ${v} BTC`,
   jointMine:d=>`My holdings ${d} / week`,jointExtra:d=>`Added numbers ${d} / week`,oursWeek:d=>`Holdings and numbers added ${d} / week`,bought:(n,v)=>`The ${n} bought: +${v} / week from next week`,boughtNoWeek:n=>`This is the last reward week: the ${n} bought ${n===1?'has':'have'} no full week left`,jointUnavailable:'Buying for these targets leaves no listing on the market, so no weight can be scored.',
   conflict:n=>`#${n}: reaches 400% alone, but bought together with the others the collection floor rises and pulls it down, so this combined plan leaves it out.`,capped:(n,b)=>`#${n}: cannot reach 400% (at most ${b}%)`,
   whyCeiling:(t,num,c)=>`Only ${t} trait${t===1?'':'s'}${num?`, number +${num}%`:''}: ${c}% at most`,whyRare:(name,top,s)=>`${name}: only ${s} piece${s===1?'':'s'}; once cleared it uses its last 3 sales (purchases included): +${top}% at most`,whyTrait:(name,top)=>`${name}: current listings cannot hold +100%; +${top}% at most`,
   kLine:(a,b,p)=>`Programme units K ${a} → ${b} (${p}): every Naka sharing these traits rises too, diluting each share alike, so weekly gains are smaller than weight gains. A later cheaper listing of the same trait drops it a tier again.`,
   monoCan:'Ours once the listings are bought',monoHave:'Already ours',monoFar:'Needs private deals to own',traitCount:n=>`${n} trait${n===1?'':'s'}`,monoNoneCan:'No trait can be owned by buying listings alone: each still has pieces held by others and not listed, so they cannot be bought on the market.',monoNoneFar:'No trait needs private deals.',
   lockCols:{trait:'Trait',ours:'Ours / all',listed:'Listed',missing:'Missing',bonus:'Bonus now → once ours',cost:'Cost',week:'Ours / week'},lockExpand:t=>`Show the way to own ${t}`,lockCollapse:t=>`Hide the way to own ${t}`,
   bonusStable:'stable',bonusMoves:'moves with the collection floor',bonusNoFloor:'cannot be scored',buyFirst:n=>`buy ${n} first`,keepLine:n=>`list #${n} at the line`,
   lockBuy:'Buy listed',lockBuyFirst:'Buy listed first',monoReclaim:'Reclaim yours (free)',
   monoSplit:(a,n,b)=>`holdings ${a} · the ${n} bought +${b} from next week`,monoReclaiming:'Already being reclaimed (nothing to do)',
   monoStable:'20+ pieces and none listed: +100% whatever the floors do',monoHolds:(p,a,b)=>`Under 20 pieces, scored on its last 3 sales against the collection floor: holds ${p} while the floor is between ${a} and ${b} BTC (above ${b} it drops a tier, below ${a} it rises)`,monoHoldsTop:(p,b)=>`Under 20 pieces, scored on its last 3 sales against the collection floor: holds ${p} while the floor is at most ${b} BTC; above that it drops`,monoHoldsLow:(p,a)=>`Under 20 pieces, scored on its last 3 sales against the collection floor: ${p} now; it rises only if the floor falls below ${a} BTC`,monoHoldsAll:p=>`Under 20 pieces and no sale on record: ${p} at any floor`,monoHoldsUnknown:p=>`Under 20 pieces, scored on its last 3 sales (${p} now); they give no exact range, so a move of the collection floor may change it`,
   keepNew:(n,price,floor,x)=>`Advice: list #${n} at ≥ ${price} BTC (${x}× the collection floor of ${floor} BTC; if the floor rises, so does this line)`,keepAsk:(n,ask,price)=>`Advice: keep your listing #${n} (${ask} BTC, not under the line of ${price} BTC)`,keepRaise:(n,ask,price)=>`Advice: reprice #${n} to ${price} BTC (now ${ask} BTC, under the line)`,
   keepWhy:(n,a,b)=>`The others then hold +100%; #${n} earns nothing while listed and anyone can buy it, which ends the monopoly. Ours ${a} / week (not listed: ${b})`,monoNoFloor:'Buying them leaves no listing on the market, so no weight can be scored',
   closingOwnSale:'Ours · selling',farWanted:n=>`${n} by private deal`,farUnminted:(n,list)=>`${n} unminted: ${list} (only after minting)`,closingSale:'Selling',closingCancel:'Reclaiming',
   showNumbers:n=>`Show all ${n}`,hideNumbers:'Show fewer',lockShowAll:n=>`Show all ${n} traits`,lockShowLess:'Show fewer',
   simAny:'Any number',simAnyPlaceholder:'e.g. 1500',simPrice:'Ask BTC',simPricePlaceholder:'e.g. 0.0035',simSale:'Assume sold',simCancel:'Assume reclaimed',simListedAt:p=>`Listed · ${p} BTC`,simMine:'My holdings',simBad:'The ask must be a BTC number, e.g. 0.0035',
   clear:'Clear',clearAll:'Clear all',
   quick:{floor:'Floor',x15:'1.5×',x2:'2×',x3:'3×'},quickHint:(label,v)=>`List at ${label}: ${v} BTC`,
   simHead:{list:(n,p)=>`Assume #${n} is listed at ${p} BTC`,sale:n=>`Assume #${n} sells`,cancel:n=>`Assume #${n} is reclaimed`},
   safeRuns:list=>`Safe ask: ${list} changes no other Naka`,safeRun:(a,b)=>b===null?`≥ ${a} BTC`:`${a}–${b} BTC (${b} excluded)`,safeNone:'No safe ask: this piece’s traits ask for conflicting price levels, so any ask moves someone up or down',safeRange:'A trait of this piece has a range value; no exact safe ask',
   simSelf:(n,a,v)=>`#${n} once listed: ${a} → 0 / week (nothing while listed)${v?`; ${v} SHNAKAS accrued this week is lost`:''}`,
   simK:(a,b,down,up)=>`Everyone: programme units K ${a} → ${b} · ${down} down · ${up} up`,simWeek:(a,b,d)=>`My holdings per week: ${a} → ${b} (${d})`,
   simRow:(n,a,b,wa,wb,d)=>`#${n} ${a} → ${b} · ${wa} → ${wb} / week (${d})`,simGone:n=>`#${n} leaves your holdings when it sells`,simSame:'My other holdings keep their weight',
   simOtc:'Selling to a teammate? A private transfer makes no public listing, so no floor moves; but neither side earns that week for the piece, and the receiver starts next week.',simListedSelf:'Listed',
  },
 };
 function mount(api){
  const {n,PL,R,U,I,H}=api,section=api.section,KEYS=['buy','plan','lock','sim'],STEPS_SHOWN=12,FAR_SHOWN=12,WANTED_SHOWN=24,BUY_SHOWN=6,COPIED_MS=6000;
  // Own a trait: lockOpen holds the unfolded traits (null until a row is toggled: the nearest needing a private deal is
  // unfolded meanwhile), lockNums / lockBuys the traits showing all their numbers / listings, copied the last wanted post copied.
  const state={tab:'buy',sort:'rate',buyAll:false,picked:new Set(),open:new Set(),scrollTo:null,stepsAll:false,lockAll:false,lockOpen:null,lockNums:new Set(),lockBuys:new Set(),copied:null,simPrice:new Map(),simAction:new Map(),anyAction:null,focus:null,extras:null,extraMsg:'',cleared:null};
  const C=()=>copy[api.lang()==='zh'?'zh':'en'],snap=()=>api.snap(),btc=v=>I.btc(v),delta=d=>U.shn(d,true),week=r=>U.shn(r);
  const typeName=type=>type==='Hair And Headwear'?I.pick(api.lang()).headwear:type;
  const traitName=(s,idx)=>`${typeName(s.traits[idx][0])} · ${s.traits[idx][1]}`;
  const numberOf=(s,id)=>s.items[id][0];
  // Results depend on the block and, for plans and owning a trait, on the listings already closing (they change between
  // blocks). Those can only remove listings that carry a trait of one of our pieces (planner.js): a listing elsewhere that
  // starts closing changes none of these results, so it is left out of their keys.
  const blockKey=s=>`${s.snapshot.height}|${s.snapshot.generatedAt}`;
  const closingKey=(s,ids)=>{const traits=new Set(ids.flatMap(id=>s.items[id].slice(1)));return JSON.stringify((s.closing??[]).filter(([id])=>s.items[id].slice(1).some(idx=>traits.has(idx))));};
  /** A result computed once the page has painted, cached by key. The last one stays on screen, marked busy, until the next
   * is ready, so a refresh never blanks it; "Computing…" shows only while none exists yet. */
  const slot=()=>({key:'',done:'',value:null});
  function compute(cache,key,tab,fn){
   if(cache.key===key)return;cache.key=key;if(cache.done===key)return;
   setTimeout(()=>{if(cache.key!==key)return;cache.value=fn();cache.done=key;if(state.tab===tab)render();},30);
  }
  const link=(s,id,text)=>{const a=n('a','',text);a.href=U.marketFind(s,id);a.target='_blank';a.rel='noopener noreferrer';return a;};
  const trend=d=>d.lo>0?'up':d.hi<0?'down':d.lo===0&&d.hi===0?'same':'unknown',ARROW={up:'▲',down:'▼',same:'–',unknown:'↕'};
  /** A change with its direction: arrow and colour from the bounds (both above zero: up, both below: down). */
  const moving=(text,d)=>{const t=trend(d),span=n('span',`ws-pmove ws-pmove--${t}`);span.append(n('b','ws-parrow',ARROW[t]),n('span','',text));return span;};
  const pct=b=>b.lo===b.hi?`+${b.lo}%`:`+${b.lo}–${b.hi}%`;
  const byNumber=s=>{const m=new Map(Object.entries(s.items).map(([id,r])=>[r[0],id]));return x=>m.get(x);};
  const mine=()=>api.holdings().filter(id=>Object.hasOwn(snap().items,id));
  /** Numbers added beside my holdings, as IDs of this snapshot (none until the saved list is read); a number that is also
   * my holding counts as mine. */
  const extraIds=()=>{if(state.extras===null)return [];const s=snap(),find=byNumber(s),own=new Set(mine());return [...new Set(state.extras.map(find).filter(id=>id!==undefined&&!own.has(id)))];};
  /** The saved list, read before any write so a write never drops numbers saved from another tab or session. */
  const savedExtras=async()=>{if(state.extras===null)state.extras=(await api.team.get()).mates;return state.extras;};
  const saveExtras=async numbers=>{state.extras=(await api.team.set({mates:numbers})).mates;};
  const ours=()=>[...new Set([...mine(),...extraIds()])];
  const closingSet=s=>new Set((s.closing??[]).map(r=>r[0]));
  const quickPrices=s=>{const F=s.snapshot.collectionFloor,T=[...R.RULES.traitTiers].reverse();return [['floor',F],['x15',PL.threshold(T[1],F)],['x2',PL.threshold(T[2],F)],['x3',PL.threshold(T[3],F)]];};
  /** Whether a piece bought now still has a reward week to earn: a note made in the next block starts at startWeek(h + 1). */
  const laterWeeks=s=>R.startWeek(s.snapshot.height+1)<R.RULES.weeks;
  /** Weekly SHNAKAS of pieces bought, once they count, with programme units K after the plan. */
  const boughtWeekly=(list,K)=>R.weeklyAllocation(list.reduce((u,b)=>{const v=R.units(b.result);return {lo:u.lo+v.lo,hi:u.hi+v.hi};},{lo:0,hi:0}),K);
  const kText=(s,after)=>{const before=R.programmeUnits(s).lo,p=(after.lo/before-1)*100;return C().kLine(I.int(before),I.int(after.lo),`${p>=0?'+':''}${p.toFixed(1)}%`);};
  /** An input with a × that empties it in one press; the × shows only while there is something to clear. */
  function field(input,onClear){
   const box=n('span','ws-pfield'),x=n('button','ws-pclear','×');x.type='button';x.tabIndex=-1;
   const sync=()=>{x.hidden=input.value==='';};input.addEventListener('input',sync);
   x.addEventListener('click',()=>{input.value='';sync();onClear();input.focus();});box.append(input,x);return {box,sync,x};
  }

  // ---------------------------------------------------------------- Skeleton (built once).
  const head=n('div','ws-section-head'),title=n('h2','');title.id='plannerTitle';const basis=n('span','ws-pbasis'),tabs=n('div','ws-ptabs');tabs.setAttribute('role','tablist');
  const tabButtons=new Map(KEYS.map(k=>{const b=n('button','');b.type='button';b.dataset.tab=k;b.setAttribute('role','tab');b.addEventListener('click',()=>{state.tab=k;render();});tabs.append(b);return [k,b];}));
  head.append(title,basis,tabs);
  const goal=n('div','ws-pgoal'),goalText=n('strong',''),howText=n('p','');goal.append(goalText,howText);
  const panels=new Map(KEYS.map(k=>{const p=n('div','ws-ppanel');p.dataset.tab=k;return [k,p];}));
  section.append(head,goal,...panels.values());
  // Best buy.
  const sortBox=n('div','ws-sort'),buyCount=n('p','ws-pnote ws-pcount'),buyOut=n('div','ws-pout ws-pbuys'),buyMore=n('button','ws-text-btn ws-pshow');buyMore.type='button';
  for(const k of ['rate','gain','ask']){const b=n('button','');b.type='button';b.dataset.sort=k;b.addEventListener('click',()=>{state.sort=k;render();});sortBox.append(b);}
  buyMore.addEventListener('click',()=>{state.buyAll=!state.buyAll;render();});panels.get('buy').append(sortBox,buyCount,buyOut,buyMore);
  // Numbers added beside my holdings: one bar in Reach 400% and one in Own a trait, over one saved list. The numbers sit
  // under the field as chips, and each result names what it counts (scope line), so numbers saved on an earlier visit are
  // never counted unnoticed.
  function extrasBox(){
   const box=n('div','ws-pextras'),label=n('label','ws-pextras-label'),input=n('input'),add=n('button','ws-padd');
   input.autocomplete='off';U.listField(input);add.type='button';const f=field(input,()=>{});label.append(n('span',''),f.box);
   const hint=n('small','ws-phint'),list=n('div','ws-pextras-list'),msg=n('p','ws-pmsg'),clear=n('button','ws-pselect-btn'),undo=n('button','ws-pselect-btn');clear.type='button';undo.type='button';clear.dataset.focus='clear';undo.dataset.focus='undo';box.append(label,add,hint,list,msg);
   const submit=async()=>{
    const s=snap(),c=C(),find=byNumber(s),held=new Set(mine()),r=U.resolveNumbers(s,input.value,ours(),U.pick(api.lang()),x=>held.has(find(x))?c.extraHeld(x):c.extraDup(x));
    if(r.empty){state.extraMsg=c.extraEmpty;render();return;}
    if(r.ids.length){await saveExtras([...await savedExtras(),...r.ids.map(id=>numberOf(s,id))]);input.value='';f.sync();state.cleared=null;}
    state.extraMsg=[r.ids.length?c.extraAdded(r.ids.length):'',r.skipped.length?c.skipped(r.skipped.join(c.sep)):''].filter(Boolean).join(' · ');render();};
   add.addEventListener('click',submit);input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();submit();}});
   // Remove all keeps what it removed until the list changes again, so Undo can put it back.
   clear.addEventListener('click',async()=>{const gone=await savedExtras();await saveExtras([]);state.cleared=gone;state.extraMsg=C().extraCleared(gone.length);render();});
   undo.addEventListener('click',async()=>{const back=state.cleared;state.cleared=null;state.extraMsg='';await saveExtras([...await savedExtras(),...back]);render();});
   return {box,label,input,add,hint,list,msg,clear,undo,f};
  }
  function paintExtras(c,s,x){
   x.label.firstChild.textContent=c.extraLabel;x.input.placeholder=c.extraPlaceholder;x.add.textContent=c.extraAdd;x.add.disabled=state.extras===null;x.hint.textContent=c.extraHint;x.f.sync();
   x.clear.textContent=c.extraClear;x.undo.textContent=c.extraUndo;const ids=extraIds();
   x.list.replaceChildren(...ids.map(id=>{const num=numberOf(s,id),tag=n('span','ws-pextra'),rm=n('button','ws-pextra-x','×');rm.type='button';rm.dataset.focus=`rm:${num}`;rm.title=c.extraRemove(num);rm.setAttribute('aria-label',c.extraRemove(num));
    rm.addEventListener('click',async()=>{await saveExtras((await savedExtras()).filter(v=>v!==num));state.extraMsg='';state.cleared=null;render();});
    tag.append(n('span','',`#${num} ${R.formatWeight(R.evaluateSnapshot(s,id))}`),rm);return tag;}),...(ids.length>1?[x.clear]:[]));
   x.msg.replaceChildren(...(state.extraMsg?[n('span','',state.extraMsg)]:[]),...(state.cleared?[x.undo]:[]));
  }
  // Reach 400%: the added numbers, what the rows count, the ticking bar, the combined plan (two or more ticked), then one
  // row per target.
  const planExtras=extrasBox(),planScope=n('p','ws-pscope'),planBar=n('div','ws-pselect'),planPickText=n('span','ws-plabel-text'),allBtn=n('button','ws-pselect-btn'),noneBtn=n('button','ws-pselect-btn');
  allBtn.type='button';noneBtn.type='button';planBar.append(planPickText,allBtn,noneBtn);
  const jointOut=n('div','ws-pjoint-box'),planOut=n('div','ws-pout');panels.get('plan').append(planExtras.box,planScope,planBar,jointOut,planOut);
  allBtn.addEventListener('click',()=>{const v=rowsCache.value;if(v===null)return;for(const r of v.rows)if(r.state==='reachable')state.picked.add(r.id);render();});
  noneBtn.addEventListener('click',()=>{state.picked.clear();render();});
  // Own a trait.
  const lockExtras=extrasBox(),lockOut=n('div','ws-pout');panels.get('lock').append(lockExtras.box,lockOut);
  // Simulate: any number, then my holdings, each with its own ask field and quick asks.
  const anyRow=n('div','ws-psim-any'),anyLabel=n('label','ws-plabel'),anyInput=n('input');anyInput.autocomplete='off';anyInput.maxLength=24;
  const anyField=field(anyInput,()=>{state.anyAction=null;anyPrice.value='';anyPriceField.sync();render();});anyLabel.append(n('span',''),anyField.box);
  const anyPriceLabel=n('label','ws-plabel'),anyPrice=n('input');anyPrice.inputMode='decimal';anyPrice.autocomplete='off';anyPrice.maxLength=16;
  const anyPriceField=field(anyPrice,()=>render());anyPriceLabel.append(n('span',''),anyPriceField.box);
  const anyQuick=n('div','ws-pquick'),anySale=n('button','ws-text-btn ws-ptoggle'),anyCancel=n('button','ws-text-btn ws-ptoggle');anySale.type='button';anyCancel.type='button';const anyInfo=n('span','ws-psim-info');
  anyRow.append(anyLabel,anyInfo,anyPriceLabel,anyQuick,anySale,anyCancel);const anyOut=n('div','ws-psim-out');
  const simHead=n('div','ws-psim-head'),simTitle=n('h3',''),simClearAll=n('button','ws-pselect-btn');simClearAll.type='button';simHead.append(simTitle,simClearAll);const simList=n('div','ws-psim-list');
  panels.get('sim').append(anyRow,anyOut,simHead,simList);let anyTimer=0;
  for(const el of [anyInput,anyPrice])el.addEventListener('input',()=>{if(el===anyInput)state.anyAction=null;clearTimeout(anyTimer);anyTimer=setTimeout(render,300);});
  anySale.addEventListener('click',()=>{state.anyAction='sale';render();});anyCancel.addEventListener('click',()=>{state.anyAction='cancel';render();});
  simClearAll.addEventListener('click',()=>{state.simPrice.clear();state.simAction.clear();state.focus=null;for(const r of simRows.values()){r.input.value='';r.f.sync();}render();});
  /** Quick asks: the collection floor and the +50 / +75 / +100 lines (exact sats), written into `input`. */
  function paintQuick(box,input,s,onPick){
   const c=C();box.replaceChildren(...quickPrices(s).map(([k,p])=>{const b=n('button','ws-pquick-btn',c.quick[k]);b.type='button';b.title=c.quickHint(c.quick[k],btc(p));b.setAttribute('aria-pressed',String(input.value.trim()===btc(p)));b.addEventListener('click',()=>{input.value=btc(p);onPick();});return b;}));
  }
  const simRows=new Map();let simKey='';
  api.team.get().then(t=>{state.extras=t.mates;render();});

  // ---------------------------------------------------------------- Best buy.
  let rankCache={key:'',rows:null};
  function buyPanel(c,s){
   for(const b of sortBox.children){b.textContent=c.sort[b.dataset.sort];b.setAttribute('aria-pressed',String(b.dataset.sort===state.sort));}
   const held=mine();buyMore.hidden=true;buyCount.textContent='';
   if(!held.length){buyOut.replaceChildren(n('p','ws-muted',c.needHoldings));return;}
   if(['ended','closed'].includes(R.rewardPhase(s.snapshot).state)){buyOut.replaceChildren(n('p','ws-muted',c.ended));return;}
   // The ranking never reads the closing listings (NakaPortfolio.rank): it is kept for the block, and the listings that
   // started closing since are only filtered out here.
   const key=`${blockKey(s)}|${held.join()}`,closing=closingSet(s);
   if(rankCache.key!==key)rankCache={key,rows:H.rank(s,held).filter(x=>x.impact.allocation.delta.lo>0)};
   const value=x=>x.impact.allocation.delta.lo/x.price;
   const rows=rankCache.rows.filter(x=>!closing.has(x.id)).sort(state.sort==='ask'?(a,b)=>a.price-b.price:state.sort==='gain'?(a,b)=>b.impact.allocation.delta.lo-a.impact.allocation.delta.lo:(a,b)=>value(b)-value(a));
   buyCount.textContent=c.buyCount(rows.length,s.offers.length,s.offers.filter(([id])=>closing.has(id)).length);
   if(!rows.length){buyOut.replaceChildren(n('p','ws-muted',c.buyNone));return;}
   const SHOW=15,shown=state.buyAll?rows:rows.slice(0,SHOW);
   buyOut.replaceChildren(...shown.map(x=>{const a=x.impact.allocation,card=n('article','ws-pbuy'),text=n('div',''),per=value(x)*100000;
    text.append(n('strong','',`#${numberOf(s,x.id)} · ${btc(x.price)} BTC`),n('span','ws-pgain',c.buyGain(U.shn(a.delta))),n('small','',a.pieceCounts?c.buySplit(delta(a.others.delta),U.shn(a.piece)):c.buyNoWeek),n('small','',c.buyRate(U.shn({lo:per,hi:per}))));
    const go=link(s,x.id,c.buyLink);go.className='ws-buy';go.dataset.focus=`buy:${x.id}`;card.append(api.image(x.id,'buy'),text,go);return card;}));
   buyMore.hidden=rows.length<=SHOW;buyMore.textContent=state.buyAll?c.showLess:c.showAll(rows.length);
  }

  // ---------------------------------------------------------------- Reach 400%: each target alone, and the ones ticked together.
  const rowsCache=slot(),jointCache=slot();
  function planPanel(c,s){
   paintExtras(c,s,planExtras);allBtn.textContent=c.selectAll;noneBtn.textContent=c.selectNone;
   const held=mine(),extra=extraIds();planScope.hidden=!held.length&&!extra.length;planScope.textContent=c.scope(held.length,extra.length);
   if(!held.length&&!extra.length){planBar.hidden=true;jointOut.replaceChildren();planOut.setAttribute('aria-busy','false');planOut.replaceChildren(n('p','ws-muted',c.needHoldings));return;}
   // Every target's own plan takes a moment with many pieces: the page answers first, the table follows. The rows keep the
   // inputs they were computed from, so rows still on screen while newer ones compute stay consistent; only those (not
   // "Computing…") are marked busy.
   compute(rowsCache,`${blockKey(s)}|${held.join()}|${extra.join()}|${closingKey(s,[...held,...extra])}`,'plan',()=>({rows:PL.targetPlans(s,{mine:held,mates:extra}),s,held,extra}));
   const v=rowsCache.value,busy=rowsCache.done!==rowsCache.key;planOut.setAttribute('aria-busy',String(busy&&v!==null));
   if(v===null){planBar.hidden=true;jointOut.replaceChildren();planOut.replaceChildren(n('p','ws-muted',c.running));return;}
   const rows=v.rows,reachable=rows.filter(r=>r.state==='reachable');
   // Ticks and unfolded rows follow the rows once they are current: a piece just added keeps its unfolded row meanwhile.
   if(!busy){for(const id of [...state.picked])if(!reachable.some(r=>r.id===id))state.picked.delete(id);for(const id of [...state.open])if(!rows.some(r=>r.id===id))state.open.delete(id);}
   planPickText.textContent=c.planPick(state.picked.size);planBar.hidden=reachable.length<2;
   allBtn.disabled=reachable.every(r=>state.picked.has(r.id));noneBtn.disabled=!state.picked.size;
   if(!rows.length){jointOut.replaceChildren();planOut.replaceChildren(n('p','ws-muted',c.planNone));if(!busy)state.scrollTo=null;return;}
   jointPanel(c,v,rowsCache.done);
   planOut.replaceChildren(planTable(c,v,reachable.length>=2),n('p','ws-pnote',c.planLegend));
   // A link to one piece's plan (#plan-N) unfolds its row; once the table is current, bring that row into view.
   if(state.scrollTo!==null&&!busy){const row=planOut.querySelector(`tr[data-id="${state.scrollTo}"]`);state.scrollTo=null;if(row)row.scrollIntoView({block:'center',behavior:'smooth'});}
  }
  /** One row per target: weight, cost, this piece's weekly SHNAKAS, ours in all, the value per 0.001 BTC; a row unfolds its steps. */
  function planTable(c,v,canPick){
   const rows=v.rows;
   const wrap=n('div','ws-ptable-wrap'),table=n('table','ws-ptable ws-pplan'),thead=n('thead',''),hr=n('tr','');
   const COLS=['pick','piece','weight','cost','week','total','value','more'],NUM=new Set(['cost','week','total','value']);
   for(const k of COLS){const th=n('th',NUM.has(k)?'ws-pnum':'',['pick','more'].includes(k)?'':c.planCols[k]);th.scope='col';hr.append(th);}
   thead.append(hr);table.append(thead);const body=n('tbody','');
   const toggle=id=>{if(state.open.has(id))state.open.delete(id);else state.open.add(id);render();};
   for(const r of rows){
    const tr=n('tr','ws-prow'),open=state.open.has(r.id),x=r.plan;tr.dataset.id=r.id;tr.dataset.state=r.state;
    const pick=n('td','ws-ppick');
    if(canPick&&r.state==='reachable'){const box=n('input');box.type='checkbox';box.dataset.focus=`pick:${r.id}`;box.checked=state.picked.has(r.id);box.setAttribute('aria-label',c.pickLabel(r.number));
     box.addEventListener('change',()=>{if(box.checked)state.picked.add(r.id);else state.picked.delete(r.id);render();});pick.append(box);}
    const who=n('td',''),line=n('span','ws-pwho');line.append(api.image(r.id,'plan'),n('strong','',`#${r.number}`));if(r.side==='mates')line.append(n('span','ws-pchip-tag',c.extraTag));who.append(line);
    const weight=n('td','ws-pweight',r.state==='reachable'?c.planTo(r.before.lo.weight,R.RULES.capPct):x?c.planMax(r.before.lo.weight,r.best):c.planStuck(r.before.lo.weight));
    const cost=n('td','ws-pnum');
    // A plan made only of listings already closing asks nothing of us: the piece gets there at the next block anyway.
    if(x&&r.auto)cost.append(n('span','',c.planAuto),n('small','',c.planAutoNote));
    else if(x){cost.append(n('span','',x.cost?`${btc(x.cost)} BTC`:c.planFree));const how=c.planBuys(x.buys,x.cancels);if(how)cost.append(n('small','',how));}else cost.textContent='—';
    const piece=n('td','ws-pnum',r.piece?`${week(r.piece.before)} → ${week(r.piece.after)}`:'—');
    const total=n('td','ws-pnum');if(r.total)total.append(moving(delta(r.total),r.total));else total.textContent='—';
    const value=n('td','ws-pnum ws-pvalue',x&&!r.auto?r.value===null?c.planFree:U.shn({lo:r.value,hi:r.value},true):'—');
    const more=n('td','ws-pmore');
    if(x||r.why.length){const b=n('button','ws-pexpand',open?'▾':'▸');b.type='button';b.dataset.focus=`more:${r.id}`;b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?c.collapse(r.number):c.expand(r.number));
     b.addEventListener('click',()=>toggle(r.id));more.append(b);tr.classList.add('is-expandable');
     // The whole row unfolds, except its own controls (tick, artwork, the arrow itself).
     tr.addEventListener('click',ev=>{if(ev.target.closest('input,button,a'))return;toggle(r.id);});}
    if(open)tr.classList.add('is-open');
    tr.append(pick,who,weight,cost,piece,total,value,more);body.append(tr);
    if(open){const d=n('tr','ws-pdetail'),td=n('td','');td.colSpan=COLS.length;td.append(planDetail(c,v,r));d.append(td);body.append(d);}
   }
   table.append(body);wrap.append(table);return wrap;
  }
  /** What a step is: a purchase or a reclaim (a link to that card on the market), or a listing already closing (free). */
  /** owner: 'me' or 'mates' when the listing is ours (a reclaim, or one of ours already closing), null for anyone else's. */
  function stepAction(c,s,st,owner){
   if(st.closing)return n('span','ws-pmuted',owner!==null?c.stepOwnClosing(st.number,owner==='mates',st.action==='sale'):st.action==='sale'?c.stepClosing(st.number):c.stepClosingCancel(st.number));
   return link(s,st.id,st.action==='sale'?c.stepSale(st.number,btc(st.price)):owner==='me'?c.stepCancel(st.number):c.stepMate(st.number));
  }
  /** One target's own plan, unfolded: its steps and the traits each lifts, what the plan changes for us, and for a piece
   * out of reach why it stops short. */
  function planDetail(c,{s,held,extra},r){
   const box=n('div','ws-pdetail-in'),x=r.plan;
   if(r.state!=='reachable'){const why=n('ul','ws-pleft'),li=n('li','',c.capped(r.number,r.best));for(const w of r.why)li.append(n('small','',whyText(c,w)));why.append(li);box.append(why);}
   if(x){
    const ol=n('ol','ws-psteps');
    for(const st of x.steps){const li=n('li','');li.dataset.action=st.closing?'closing':st.action;li.append(stepAction(c,s,st,st.owned?(held.includes(st.id)?'me':'mates'):null));
     if(st.traits.length)li.append(n('small','',c.stepLifts(st.traits.map(idx=>traitName(s,idx)).join(c.sep))));ol.append(li);}
    const gains=n('div','ws-pjoint-gains');gains.append(moving(extra.length?c.oursWeek(delta(r.change)):c.jointMine(delta(r.change)),r.change));
    if(x.bought.length)gains.append(laterWeeks(s)?moving(c.bought(x.bought.length,week(r.bought)),r.bought):n('span','ws-pmuted',c.boughtNoWeek(x.bought.length)));
    box.append(n('p','ws-psteps-title',c.stepsTitle),ol,gains,n('p','ws-pnote',kText(s,x.K)));
   }
   return box;
  }
  const whyText=(c,w)=>w.kind==='ceiling'?c.whyCeiling(w.traits,w.number,w.ceiling):w.rare?c.whyRare(`${typeName(w.type)} · ${w.value}`,w.top,w.supply):c.whyTrait(`${typeName(w.type)} · ${w.value}`,w.top);
  /** Two or more ticked: one plan for all of them (a listing they share is bought once), as numbered steps, each with the
   * pieces it lifts. */
  function jointPanel(c,v,rowsKey){
   const picked=v.rows.filter(r=>state.picked.has(r.id)).map(r=>r.id),pick=picked.join();
   if(picked.length<2){jointOut.replaceChildren();return;}
   // A new selection starts with its first steps; the same selection at a new block keeps them as they were unfolded.
   compute(jointCache,`${rowsKey}|${pick}`,'plan',()=>{if(jointCache.value?.pick!==pick)state.stepsAll=false;return {t:PL.jointPlan(v.s,{mine:v.held,mates:v.extra,targets:picked}),v,pick};});
   const j=jointCache.value,box=n('section','ws-pjoint'),top=n('div','ws-pjoint-head');box.append(top);jointOut.setAttribute('aria-busy',String(jointCache.done!==jointCache.key&&j!==null));
   if(j===null){top.append(n('h3','',c.jointTitle(picked.length)));box.append(n('p','ws-muted',c.running));jointOut.replaceChildren(box);return;}
   // The plan on screen with the rows it was computed from (a newer one may be computing).
   const {t,v:{s,rows,held,extra}}=j;top.append(n('h3','',c.jointTitle(t.targets.length)));
   if(!['ready','none'].includes(t.state)){box.append(n('p','ws-pmsg',c.jointUnavailable));jointOut.replaceChildren(box);return;}
   const reached=t.targets.filter(x=>x.state==='reached'),byId=new Map(rows.map(r=>[r.id,r]));
   if(reached.length&&t.steps.length){
    // Listings already closing are someone else's purchase or reclaim: free for us, and neither ours to buy nor to reclaim.
    const buys=t.steps.filter(st=>st.action==='sale'&&!st.closing).length,cancels=t.steps.filter(st=>st.action==='cancel'&&!st.closing).length,closing=t.steps.filter(st=>st.closing).length;
    const later=laterWeeks(s),boughtAdd=later&&t.bought.length?boughtWeekly(t.bought,t.K.after):{lo:0,hi:0};
    const total={lo:t.change.me.delta.lo+t.change.mates.delta.lo+boughtAdd.lo,hi:t.change.me.delta.hi+t.change.mates.delta.hi+boughtAdd.hi},per=t.cost>0?total.lo/t.cost*100000:null;
    // Each piece reached also has its own plan (a row above): their costs added up, for comparison.
    const separate=reached.reduce((a,x)=>a+byId.get(x.id).plan.cost,0);
    const sum=n('div','ws-pjoint-sum');sum.append(n('strong','',c.jointSum(reached.length,t.targets.length)),n('span','',c.jointCost(btc(t.cost),buys,cancels,closing)+(per!==null&&total.lo>0?` · ${c.jointPer(U.shn({lo:per,hi:per}))}`:'')));
    if(reached.length>1)sum.append(n('small','ws-pmuted',c.jointSeparate(btc(separate))));
    const gains=n('div','ws-pjoint-gains');
    if(held.length)gains.append(moving(c.jointMine(delta(t.change.me.delta)),t.change.me.delta));
    if(extra.length)gains.append(moving(c.jointExtra(delta(t.change.mates.delta)),t.change.mates.delta));
    if(t.bought.length)gains.append(later?moving(c.bought(t.bought.length,week(boughtAdd)),boughtAdd):n('span','ws-pmuted',c.boughtNoWeek(t.bought.length)));
    box.append(sum,gains,jointSteps(c,s,t),n('p','ws-pnote',kText(s,t.K.after)));
   }
   const left=t.targets.filter(x=>x.state!=='reached');
   if(left.length){const ul=n('ul','ws-pleft');for(const x of left){const li=n('li','',x.state==='conflict'?c.conflict(x.number):c.capped(x.number,x.best??x.before.lo.weight));
     if(x.state==='capped')for(const w of x.why)li.append(n('small','',whyText(c,w)));ul.append(li);}box.append(ul);}
   jointOut.replaceChildren(box);
  }
  function jointSteps(c,s,t){
   const wrap=n('div',''),ol=n('ol','ws-psteps ws-psteps--joint'),shown=state.stepsAll?t.steps:t.steps.slice(0,STEPS_SHOWN);
   for(const st of shown){const li=n('li','');li.dataset.action=st.closing?'closing':st.action;li.append(stepAction(c,s,st,st.owner));
    const chips=n('span','ws-pserves');for(const v of st.serves){const chip=n('span','ws-pserve',`#${v.number}`);chip.title=c.serveTitle(v.number,v.traits.map(([type,value])=>`${typeName(type)} · ${value}`).join(c.sep));chips.append(chip);}
    li.append(chips);ol.append(li);}
   wrap.append(ol);
   if(t.steps.length>STEPS_SHOWN){const more=n('button','ws-text-btn ws-pshow',state.stepsAll?c.fewerSteps:c.restSteps(t.steps.length-STEPS_SHOWN));more.type='button';more.dataset.focus='steps';more.addEventListener('click',()=>{state.stepsAll=!state.stepsAll;render();});wrap.append(more);}
   return wrap;
  }

  // ---------------------------------------------------------------- Own a trait: a monopoly.
  let lockCache={key:'',groups:null,s:null};
  function lockPanel(c,s){
   paintExtras(c,s,lockExtras);
   const held=mine(),extra=extraIds(),list=[...held,...extra];if(!list.length){lockOut.replaceChildren(n('p','ws-muted',c.needHoldings));return;}
   const key=`${blockKey(s)}|${list.join()}|${closingKey(s,list)}`;if(lockCache.key!==key)lockCache={key,groups:PL.lockGroups(PL.lockTraits(s,list)),s};
   // Shown with the snapshot they were computed on: a listing closing elsewhere since leaves them as they are.
   const g=lockCache.groups,out=[n('p','ws-pscope',c.scope(held.length,extra.length)),lockTable(c,lockCache.s,g)];
   if(g.far.length>FAR_SHOWN){const more=n('button','ws-pselect-btn ws-pshow',state.lockAll?c.lockShowLess:c.lockShowAll(g.far.length));more.type='button';more.dataset.focus='traits';more.addEventListener('click',()=>{state.lockAll=!state.lockAll;render();});out.push(more);}
   lockOut.replaceChildren(...out);
  }
  /** One table as in Reach 400%: a group row per kind of trait (an empty group says so), then a row per trait that unfolds
   * the way to own it. Only the first FAR_SHOWN traits needing a private deal show until asked. */
  function lockTable(c,s,{can,have,far,missing}){
   const wrap=n('div','ws-ptable-wrap'),table=n('table','ws-ptable ws-plock'),thead=n('thead',''),hr=n('tr',''),closing=new Map(s.closing??[]);
   const COLS=[['trait',''],['ours','ws-pnum'],['listed','ws-pnum'],['missing','ws-pnum'],['bonus','ws-pbonus'],['cost','ws-pnum'],['week','ws-pnum'],['more','']];
   for(const [k,cls] of COLS){const th=n('th',cls,k==='more'?'':c.lockCols[k]);th.scope='col';hr.append(th);}
   thead.append(hr);table.append(thead);
   // Until a row is toggled, the trait needing a private deal with the fewest pieces missing is unfolded, so its wanted post
   // and the group to post it in are in view at once; the first toggle starts from what is shown.
   const open=state.lockOpen??new Set(far.slice(0,1).map(t=>t.idx));
   const toggle=idx=>{const next=new Set(open);if(!next.delete(idx))next.add(idx);state.lockOpen=next;render();};
   // Already ours is a status, shown only when some trait is; the other two groups say why they are empty.
   const groups=[['can',c.monoCan,can,c.monoNoneCan],...(have.length?[['have',c.monoHave,have,null]]:[]),['far',c.monoFar,far,c.monoNoneFar]];
   for(const [kind,title,rows,none] of groups){
    const body=n('tbody',''),head=n('tr','ws-pgroup'),th=n('th','',title);th.colSpan=COLS.length;th.scope='rowgroup';th.append(n('span','',c.traitCount(rows.length)));head.append(th);body.append(head);
    if(!rows.length){const tr=n('tr','ws-pnone'),td=n('td','',none);td.colSpan=COLS.length;tr.append(td);body.append(tr);}
    for(const t of kind==='far'&&!state.lockAll?rows.slice(0,FAR_SHOWN):rows){
     const tr=lockRow(c,t,kind,missing),unfolded=open.has(t.idx),name=`${typeName(t.type)} · ${t.value}`,more=n('td','ws-pmore'),b=n('button','ws-pexpand',unfolded?'▾':'▸');
     b.type='button';b.dataset.focus=`lock:${t.idx}`;b.setAttribute('aria-expanded',String(unfolded));b.setAttribute('aria-label',unfolded?c.lockCollapse(name):c.lockExpand(name));b.addEventListener('click',()=>toggle(t.idx));more.append(b);tr.append(more);
     // The whole row unfolds, except the arrow itself.
     tr.addEventListener('click',ev=>{if(ev.target.closest('button'))return;toggle(t.idx);});body.append(tr);
     if(unfolded){tr.classList.add('is-open');const d=n('tr','ws-pdetail'),td=n('td','');td.colSpan=COLS.length;td.append(kind==='far'?farDetail(c,s,t,closing):monoDetail(c,s,t));d.append(td);body.append(d);}
    }
    table.append(body);
   }
   wrap.append(table);return wrap;
  }
  /** A trait's row: its value (type under it), ours / all its pieces, the others' open listings, the pieces missing (where a
   * private deal is needed), the bonus now → once ours and whether it holds, the cost with what it buys, and our weekly
   * change. A trait buying makes ours shows its way: the listings bought and ours reclaimed or, with neither, one of ours
   * listed at the line (keepListed: what puts it in that group). One needing a private deal shows the listings to buy
   * first; one already ours has neither cost nor change. */
  function lockRow(c,t,kind,missing){
   const tr=n('tr','ws-prow is-expandable'),o=t.owned,m=t.monopoly,trait=n('td',''),bonus=n('td','ws-pbonus'),dash=()=>n('td','ws-pnum ws-pmuted','—');
   trait.append(n('span','',t.value),n('small','',typeName(t.type)));
   // A listing kept at the line holds the others only while it stays at or above the line, which follows the collection floor.
   const keep=kind==='can'&&!m.buy.length&&!m.reclaim.length?m.keepListed:null,after=keep?{p:keep.after,stable:false}:o.state==='ready'?{p:o.after,stable:o.stable}:null;
   if(after===null)bonus.append(n('span','',`${pct(t.bonus)} → —`),n('small','',c.bonusNoFloor));
   else bonus.append(n('span',`ws-pmove--${trend({lo:after.p.lo-t.bonus.hi,hi:after.p.hi-t.bonus.lo})}`,`${pct(t.bonus)} → ${pct(after.p)}`),n('small','',after.stable?c.bonusStable:c.bonusMoves));
   const cost=kind==='can'?costCell(m.buy.length?`${btc(m.cost)} BTC`:c.planFree,keep?c.keepLine(keep.number):c.planBuys(m.buy.length,m.reclaim.length)):kind==='far'&&t.buyable.length?costCell(`${btc(t.buyable.reduce((a,x)=>a+x.price,0))} BTC`,c.buyFirst(t.buyable.length)):dash();
   const gain=kind==='can'?gainCell(keep?keep.total:m.total):dash();
   tr.append(trait,n('td','ws-pnum',`${t.held} / ${t.supply}`),n('td','ws-pnum',String(t.buyable.length)),kind==='far'?n('td','ws-pnum ws-pmiss',String(missing(t))):dash(),bonus,cost,gain);
   return tr;
  }
  const costCell=(text,how)=>{const td=n('td','ws-pnum');td.append(n('span','ws-pcost',text));if(how)td.append(n('small','',how));return td;};
  const gainCell=d=>{const td=n('td','ws-pnum');td.append(moving(delta(d),d));return td;};
  /** One line of an unfolded trait: a label, then its content. */
  const lockLine=(box,label,cls,items)=>{const cell=n('div',cls);cell.append(...items);box.append(n('span','ws-plock-label',label),cell);};
  /** Show all / fewer of one trait's listings or numbers: `set` holds the traits showing all. */
  const moreToggle=(text,focus,set,idx)=>{const b=n('button','ws-pselect-btn',text);b.type='button';b.dataset.focus=focus;b.addEventListener('click',()=>{if(!set.delete(idx))set.add(idx);render();});return b;};
  /** A trait buying makes ours, or one already ours, unfolded: the listings to buy, ours to reclaim and ours already being
   * reclaimed, how our weekly change splits, how long the bonus lasts and the keep-listed advice. */
  function monoDetail(c,s,t){
   const m=t.monopoly,box=n('div','ws-pdetail-in ws-plock-in');
   if(m.buy.length)lockLine(box,c.lockBuy,'ws-plock-cell',m.buy.map(x=>link(s,x.id,`#${x.number} · ${btc(x.price)} BTC`)));
   if(m.reclaim.length)lockLine(box,c.monoReclaim,'ws-plock-cell',m.reclaim.map(x=>link(s,x.id,`#${x.number}`)));
   if(m.reclaiming.length)lockLine(box,c.monoReclaiming,'ws-plock-cell',m.reclaiming.map(x=>n('span','',`#${x.number}`)));
   // The row's weekly total split: our pieces' change, and what the pieces bought earn from next week.
   if(m.total&&m.buy.length)lockLine(box,c.lockCols.week,'ws-plock-cell',[n('span','',laterWeeks(s)?c.monoSplit(delta(m.change.delta),m.buy.length,week(m.bought)):c.boughtNoWeek(m.buy.length))]);
   box.append(n('p','ws-plock-note',lasting(c,t)));
   if(m.keepListed){const k=m.keepListed,line=btc(k.price),advice=k.listed===null?c.keepNew(k.number,line,btc(k.floor),k.multiple.num/k.multiple.den):k.listed>=k.price?c.keepAsk(k.number,btc(k.listed),line):c.keepRaise(k.number,btc(k.listed),line);
    // Compared with owning it without that listing: the plain total, or, with no listing to remove, our figures unchanged.
    box.append(n('p','ws-plock-note ws-plock-advice',advice),n('p','ws-plock-note',c.keepWhy(k.number,delta(k.total),delta(m.total?m.total:{lo:0,hi:0}))));}
   return box;
  }
  /** How long the bonus once owned lasts: 20+ pieces with no listing hold +100% whatever the floors do; a smaller trait,
   * scored on its last three sales, keeps it while the collection floor stays within `owned.holds` (no range when its
   * sales give none). */
  function lasting(c,t){
   const o=t.owned,p=pct(o.after);if(o.stable)return c.monoStable;if(o.holds===null)return c.monoHoldsUnknown(p);
   const {min,max}=o.holds;if(min===null&&max===null)return c.monoHoldsAll(p);
   // A lower floor never drops a tier (no lower end at +100%), a higher one never lifts one (no upper end at +0%).
   return min===null?c.monoHoldsTop(p,btc(max)):max===null?c.monoHoldsLow(p,btc(min)):c.monoHolds(p,btc(min),btc(max));
  }
  /** A trait needing a private deal, unfolded: the listings to buy first (the first BUY_SHOWN until asked), the numbers only
   * a private deal brings with the way to ask for them, the unminted ones and how long the bonus lasts once ours. */
  function farDetail(c,s,t,closing){
   const o=t.owned,box=n('div','ws-pdetail-in ws-plock-in');
   if(o.state==='no-floor')box.append(n('p','ws-plock-note',c.monoNoFloor));
   if(t.buyable.length){const all=state.lockBuys.has(t.idx),links=(all?t.buyable:t.buyable.slice(0,BUY_SHOWN)).map(x=>link(s,x.id,`#${x.number} · ${btc(x.price)} BTC`));
    if(t.buyable.length>BUY_SHOWN)links.push(moreToggle(all?c.showLess:c.showAll(t.buyable.length),`buys:${t.idx}`,state.lockBuys,t.idx));lockLine(box,c.lockBuyFirst,'ws-plock-cell',links);}
   if(t.wanted.length)lockLine(box,c.farWanted(t.wanted.length),'ws-pwanted',wantedList(c,t,closing));
   if(t.unminted.length)box.append(n('p','ws-plock-note',c.farUnminted(t.unminted.length,t.unminted.map(x=>`#${x}`).join(c.sep))));
   if(o.state==='ready')box.append(n('p','ws-plock-note',lasting(c,t)));
   return box;
  }
  /** The numbers only a private deal brings, as quiet chips (the first WANTED_SHOWN until asked; a listing closing marked),
   * then one line: copy them all as a wanted post (U.wantText: the lead-in, then the numbers ascending; pasted into Add,
   * they import) and, beside it, the Naka Telegram group to post it in. Once copied, the answer follows on that line and
   * the group link becomes the action for a while (copy → join → paste); kept in state, so a render meanwhile still shows it. */
  function wantedList(c,t,closing){
   const u=U.pick(api.lang()),all=state.lockNums.has(t.idx),chips=n('div','ws-pchips'),act=n('div','ws-pact');
   chips.append(...(all?t.wanted:t.wanted.slice(0,WANTED_SHOWN)).map(x=>{const chip=n('span','ws-pwant',`#${x.number}`);if(x.closing){chip.classList.add('is-closing');chip.append(n('small','',x.own?c.closingOwnSale:closing.get(x.id)==='sale'?c.closingSale:c.closingCancel));}return chip;}));
   if(t.wanted.length>WANTED_SHOWN)chips.append(moreToggle(all?c.hideNumbers:c.showNumbers(t.wanted.length),`nums:${t.idx}`,state.lockNums,t.idx));
   const said=state.copied?.idx===t.idx&&Date.now()<state.copied.until?state.copied:null,copyBtn=n('button','ws-pcopy',u.wantCopy),tg=n('a','ws-ptg',u.tgWanted);
   copyBtn.type='button';copyBtn.title=u.wantHint;copyBtn.dataset.focus=`copy:${t.idx}`;
   copyBtn.addEventListener('click',async()=>{const numbers=t.wanted.map(x=>x.number);let ok=true;try{await navigator.clipboard.writeText(U.wantText(u,numbers));}catch{ok=false;}state.copied={idx:t.idx,ok,count:numbers.length,until:Date.now()+COPIED_MS};render();setTimeout(render,COPIED_MS);});
   tg.href=U.TELEGRAM;tg.target='_blank';tg.rel='noopener noreferrer';tg.dataset.focus=`tg:${t.idx}`;if(said?.ok)tg.classList.add('is-next');
   act.append(copyBtn,tg);if(said)act.append(n('span',said.ok?'ws-pdone':'ws-pdown',said.ok?u.wantCopied(said.count):u.copyAllFailed));
   return [chips,act];
  }

  // ---------------------------------------------------------------- Simulate.
  const sats=text=>/^\d+(\.\d{1,8})?$/.test(text)?Math.round(Number(text)*1e8):null;
  function simResult(c,s,x,listedId){
   const box=n('div','ws-psim-res');if(x.state!=='ready'){box.append(n('p','ws-pmuted','—'));return box;}
   const ch=x.change,num=numberOf(s,ch.id);box.append(n('p','ws-psim-title',ch.kind==='list'?c.simHead.list(num,btc(ch.price)):c.simHead[ch.kind](num)));
   if(ch.kind==='list'){const safe=x.safe;box.append(n('p','ws-pkey',safe.state==='range'?c.safeRange:safe.state==='none'?c.safeNone:c.safeRuns(safe.runs.map(r=>c.safeRun(btc(r.min),r.below===null?null:btc(r.below))).join(c.sep))));}
   const row=listedId?api.rewardRow(listedId):null,self=x.mine.rows.find(r=>r.id===ch.id);
   if(ch.kind==='list'&&self)box.append(n('p','ws-pdown',c.simSelf(num,week(self.weeklyBefore),row?.status==='earning'&&row.amount?api.format(row.amount):null)));
   box.append(n('p','',c.simK(I.int(x.K.before.lo),I.int(x.K.after.lo),x.down.length,x.up.length)));
   if(x.mine.rows.length){
    box.append(moving(c.simWeek(week(x.mine.before),week(x.mine.after),delta(x.mine.delta)),x.mine.delta));
    const moved=x.mine.rows.filter(r=>!(r.id===ch.id&&ch.kind==='list')).filter(r=>r.after===null||r.after.lo.weight!==r.before.lo.weight||r.after.hi.weight!==r.before.hi.weight||r.weeklyAfter.lo!==r.weeklyBefore.lo||r.weeklyAfter.hi!==r.weeklyBefore.hi);
    if(moved.length){const ul=n('ul','ws-psim-rows');for(const r of moved){const li=n('li','');
      if(r.after===null)li.append(n('span','ws-pmuted',c.simGone(numberOf(s,r.id))));
      else{const d={lo:r.weeklyAfter.lo-r.weeklyBefore.hi,hi:r.weeklyAfter.hi-r.weeklyBefore.lo};li.append(moving(c.simRow(numberOf(s,r.id),R.formatWeight(r.before),R.formatWeight(r.after),week(r.weeklyBefore),week(r.weeklyAfter),delta(d)),d));}
      ul.append(li);}box.append(ul);}
    else box.append(n('p','ws-pmuted',c.simSame));}
   return box;
  }
  function simPanel(c,s){
   anyLabel.firstChild.textContent=c.simAny;anyInput.placeholder=c.simAnyPlaceholder;anyPriceLabel.firstChild.textContent=c.simPrice;anyPrice.placeholder=c.simPricePlaceholder;anySale.textContent=c.simSale;anyCancel.textContent=c.simCancel;
   simTitle.textContent=c.simMine;simClearAll.textContent=c.clearAll;for(const f of [anyField,anyPriceField]){f.x.title=c.clear;f.x.setAttribute('aria-label',c.clear);f.sync();}
   const held=mine(),offers=new Map(s.offers);
   // Any number: listed → sale / reclaim; unlisted → an ask field with quick asks.
   const q=anyInput.value.trim()?globalThis.ShnakasLookup.query(s,anyInput.value.trim()):null,anyId=q?.state==='found'?q.id:null,anyListed=anyId!==null&&offers.has(anyId);
   anyPriceLabel.hidden=anyQuick.hidden=!anyId||anyListed;anySale.hidden=anyCancel.hidden=!anyListed;anyInfo.textContent=anyId?(anyListed?c.simListedAt(btc(offers.get(anyId))):`#${numberOf(s,anyId)} · ${R.formatWeight(R.evaluateSnapshot(s,anyId))}`):'';
   anySale.setAttribute('aria-pressed',String(state.anyAction==='sale'));anyCancel.setAttribute('aria-pressed',String(state.anyAction==='cancel'));
   if(anyId&&!anyListed)paintQuick(anyQuick,anyPrice,s,()=>{anyPriceField.sync();clearTimeout(anyTimer);render();});
   if(!anyId)anyOut.replaceChildren();
   else if(anyListed)anyOut.replaceChildren(...(state.anyAction?[simResult(c,s,PL.simulate(s,{kind:state.anyAction,id:anyId},held),null)]:[]));
   else{const text=anyPrice.value.trim(),p=sats(text);anyOut.replaceChildren(...(text===''?[]:p===null?[n('p','ws-pdown',c.simBad)]:[simResult(c,s,PL.simulate(s,{kind:'list',id:anyId,price:p},held),held.includes(anyId)?anyId:null)]));}
   // My holdings: one row each, built when the set or the language changes; typed asks are kept per piece.
   simHead.hidden=!held.length;simClearAll.disabled=![...state.simPrice.values()].some(v=>v!=='')&&!state.simAction.size;
   for(const id of [...state.simPrice.keys()])if(!held.includes(id))state.simPrice.delete(id);
   for(const id of [...state.simAction.keys()])if(!held.includes(id))state.simAction.delete(id);
   const key=`${held.join()}|${api.lang()}`;if(simKey!==key){simKey=key;simRows.clear();simList.replaceChildren(...held.map(id=>{
    const row=n('div','ws-psim-row'),info=n('div','ws-psim-who'),input=n('input'),label=n('label','ws-plabel'),quick=n('div','ws-pquick'),sale=n('button','ws-text-btn ws-ptoggle'),cancel=n('button','ws-text-btn ws-ptoggle'),out=n('div','ws-psim-out');
    input.inputMode='decimal';input.autocomplete='off';input.maxLength=16;input.value=state.simPrice.get(id)??'';sale.type='button';cancel.type='button';
    let timer=0;const changed=()=>{state.simPrice.set(id,input.value.trim());clearTimeout(timer);timer=setTimeout(render,300);};input.addEventListener('input',changed);
    const f=field(input,()=>{state.simPrice.delete(id);render();});label.append(n('span',''),f.box);
    sale.addEventListener('click',()=>{state.simAction.set(id,'sale');render();});cancel.addEventListener('click',()=>{state.simAction.set(id,'cancel');render();});
    row.append(api.image(id,'sim'),info,label,quick,sale,cancel,out);simRows.set(id,{row,info,input,label,quick,sale,cancel,out,changed,f});return row;}));}
   for(const id of held){const r=simRows.get(id),listed=offers.has(id);
    r.info.replaceChildren(n('strong','',`#${numberOf(s,id)}`),n('small','',listed?`${c.simListedSelf} · ${btc(offers.get(id))} BTC`:R.formatWeight(R.evaluateSnapshot(s,id))));
    r.label.firstChild.textContent=c.simPrice;r.input.placeholder=c.simPricePlaceholder;r.f.x.title=c.clear;r.f.x.setAttribute('aria-label',c.clear);r.f.sync();r.sale.textContent=c.simSale;r.cancel.textContent=c.simCancel;
    r.label.hidden=r.quick.hidden=listed;r.sale.hidden=r.cancel.hidden=!listed;r.row.classList.toggle('is-focus',state.focus===id);
    r.sale.setAttribute('aria-pressed',String(state.simAction.get(id)==='sale'));r.cancel.setAttribute('aria-pressed',String(state.simAction.get(id)==='cancel'));
    if(listed){const action=state.simAction.get(id);r.out.replaceChildren(...(action?[simResult(c,s,PL.simulate(s,{kind:action,id},held),null)]:[]));}
    else{paintQuick(r.quick,r.input,s,()=>{r.f.sync();r.changed();});const text=state.simPrice.get(id)??'',p=sats(text);r.out.replaceChildren(...(text===''?[]:p===null?[n('p','ws-pdown',c.simBad)]:[simResult(c,s,PL.simulate(s,{kind:'list',id,price:p},held),id),n('p','ws-pnote',c.simOtc)]));}
   }
  }

  // ---------------------------------------------------------------- Render.
  function render(){
   // Result areas are rebuilt on every render (new data, a storage change): the control that had the keyboard focus gets
   // it back by its key.
   const focused=section.contains(document.activeElement)?document.activeElement.dataset.focus:undefined;
   const c=C(),s=snap();title.textContent=c.title;basis.textContent=c.basis;goalText.textContent=c.goal[state.tab];howText.textContent=c.how[state.tab];
   for(const [k,b] of tabButtons){b.textContent=c.tabs[k];b.setAttribute('aria-selected',String(k===state.tab));}
   for(const [k,p] of panels)p.hidden=k!==state.tab;
   ({buy:buyPanel,plan:planPanel,lock:lockPanel,sim:simPanel})[state.tab](c,s);
   if(focused!==undefined)panels.get(state.tab).querySelector(`[data-focus="${focused}"]`)?.focus({preventScroll:true});
  }
  return {render,tabLabel:()=>C().tab,
   openTab:k=>{if(KEYS.includes(k)){state.tab=k;render();}},
   /** The simulator for one piece: a holding's own row (focused, its ask field ready, or a listed one's reclaim chosen), or
    * any other number in the top row. */
   openSim:(id,action=null)=>{state.tab='sim';const s=snap();
    if(mine().includes(id)){state.focus=id;if(action)state.simAction.set(id,action);render();const r=simRows.get(id);r?.row.scrollIntoView({block:'center',behavior:'smooth'});(s.offers.some(o=>o[0]===id)?r?.cancel:r?.input)?.focus({preventScroll:true});}
    else{anyInput.value=String(numberOf(s,id));anyField.sync();state.anyAction=null;render();anyRow.scrollIntoView({block:'center',behavior:'smooth'});anyPrice.focus({preventScroll:true});}},
   /** One piece's 400% plan: its row unfolded and brought into view once the table is computed. A number that is not my
    * holding is added beside my holdings first (kept, as any number added there is). */
   openPlan:async id=>{const s=snap();state.tab='plan';
    if(!mine().includes(id)&&!extraIds().includes(id))await saveExtras([...await savedExtras(),numberOf(s,id)]);
    state.open.add(id);state.scrollTo=id;render();},
   extrasChanged:t=>{state.extras=t.mates;render();}};
 }
 root.NakaPlannerUI={mount,copy};
})(globalThis);
