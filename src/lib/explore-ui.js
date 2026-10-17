/** Shared English/Chinese copy and the add/remove control for market tools, popup lookup, comparison and local demo. */
(function(root){'use strict';const copy={
 en:{
  heading:'Find your Naka. Raise your weight.',intro:'See what your holdings earn each week, then compare listings by weight, ask and traits',page:'Shielded Nakas · Holdings & Compare',local:'Local snapshot',
  compare:'Compare',open:'Open comparison',market:'Open market ↗',colMarket:'View on market ↗',
  add:'＋ Compare',inCompare:'✓ In Compare',removeCompare:'✕ Remove',fullShort:'Full 4/4 · open Compare ↗',inCompareTag:'✓ Compare',
  addHint:'Add to Compare (up to four Nakas)',removeHint:'In Compare. Select to remove it.',
  full:'Compare already holds four Nakas. Remove one there to add another.',fullHere:'Four selected. Remove one above to add another.',
  addError:'Could not save. Try again.',
  lookup:'Add by Shielded number',find:'Add',placeholder:'Shielded number, e.g. 379',invalid:'Enter a valid Shielded number.',missing:'Not in the selected snapshot.',
  remove:'Remove',clear:'Clear',count:n=>`${n} / 4 selected`,load:'Use example selection',
  empty:'Choose up to four Nakas to compare',emptyHint:'Use ＋ Add to Compare above, or ＋ Compare in a market inspection or the popup.',
  scroll:'Scroll sideways to see every column',preview:n=>`Enlarge Shielded #${n}`,
  total:'Total weight',after:'After sale',holding:'Holding formula',before:'Before-sale formula',ask:'Ask · BTC',askNote:'Selected-block ask, excluding fees; not a live quote.',
  noFloor:'No collection floor after sale',unavailable:'Unavailable',number:'Number bonus',price:'BTC',
  traitGuide:'Trait bonuses',legend:'↑ Bonus rises · ↓ Bonus falls · ◆ Price basis changes',
  listed:'Listed',unlisted:'Unlisted',unknown:'Listing unknown',
  independent:'Each column: one sale, other listings unchanged. Base 100% · cap 400%.',
  limits:'Block weight, not accrued rewards. No rewards while listed.',unknownNote:'Ranges reflect missing evidence; the upper end is not guaranteed.',
  filter:'After sale ≥',any:'Any weight',filterNote:'Listed NFTs in this loaded view only. A range passes only if its lower bound meets the minimum.',
  shown:(n,t)=>`${n} / ${t} loaded`,noMatches:'No matches loaded. Browse all in Compare.',
  browse:'Market listings',browseNote:'Lowest ask first, fees excluded · hover a card for its weekly gain',
  
  rules:'Rule sources',version:'Current on-chain reward rules',
  share:'No wallet connection, API key or upload needed.',
  holdings:'My holdings',holdingsNote:'Saved only on this device. You maintain it, and it can include Nakas held in other accounts.',
  
  holdingsEmpty:'Add your holdings to see your weekly allocation and how a purchase or delisting changes it.',
  weekly:'Est. weekly allocation',perWeek:v=>`${v} SHNAKAS / week`,gainWeek:v=>`${v} SHNAKAS / week`,ofPool:v=>`${v} of the weekly pool`,
  listedNoEarn:'Listed · earns nothing while listed',
  allocationBasis:'Official formula basis: 266,640 SHNAKAS a week shared by the weight units of all 3,333 pieces (100% = 4 units). Listed holdings earn nothing; a new holding counts from the next reward week. Not a payout guarantee.',
  boost:'Raise my weight',boostHint:'Listings that raise your weekly allocation if bought',boostEmpty:'Add holdings to use Raise my weight.',
  forMe:'For my holdings',weeklyAfterBuy:'Weekly after buying',
  affected:'Weight changes in your holdings',close:'Close',
  addHolding:'＋ My holdings',inHoldings:'✓ My holdings',holdingHint:'Add to My holdings (saved on this device)',holdingRemoveHint:'In My holdings. Select to remove it.',
  addVisible:n=>`＋ Add these ${n} Nakas to My holdings`,addRest:(n,k)=>`＋ Add the other ${n} (${k} already added)`,addedVisible:n=>`✓ All ${n} on this page are in My holdings`,openHoldings:'My holdings ↗',pieces:n=>`${n} ${n===1?'Naka':'Nakas'}`,
  bundledNote:'Historical data demo · example holdings · not live listings',
  navHome:'Holdings',compareSlotsLeft:n=>`＋ ${n} more can be compared`,numberPromptMulti:'e.g. 379, 1025, 1500',multiHint:'Separate numbers with commas, spaces or line breaks.',skipInvalid:t=>`“${t}” is not a number`,skipMissing:n=>`#${n} is not in this block's data`,skipHeld:n=>`#${n} is already in My holdings`,skipCompared:n=>`#${n} is already in Compare`,skipFull:n=>`#${n}: Compare holds 4 at most`,addedSkipped:(n,list)=>`Added ${n}. Skipped: ${list.join('; ')}`,navBlock:'Block',stripStart:n=>`Week 1 in ${n} block${n==='1'?'':'s'}`,navSections:'Sections',emptyTitle:'Add your first Naka',emptyText:'See how much SHNAKAS it earns each week.',emptyAdd:'＋ Add a number',emptyOr:'Or add a whole page at once',vaultLink:'Vault',walletLink:'Wallet holdings',emptyJumpNote:'Open one, go to Vault or Holdings, then press “＋ Add these Nakas to My holdings” on that page.',tilesTitle:n=>`All holdings (${n})`,allocTitleBlock:'Allocation at this block',perFull:'100% weight / week',perCap:'400% cap / week',unitsK:'All weight units (K)',poolWeek:'Pool / week',allocNote:v=>`One unit earns v = ${v} base units a block, from the official endpoint's formula.`,scheduleWeekN:n=>`Week ${n}`,scheduleEndBlock:'Last rewarded block',scheduleClaim:'Claim deadline',progressLabel:'Weeks completed',weeksDone:(n,t)=>`${n} / ${t}`,listAdd:'＋ Add',scheduleTitle:'Reward schedule',afterDelist:'If delisted',earnListed:'0',
  aboutCases:'Reward eligibility · every action',casesLead:'Per the official engine: a week pays only the holder whose piece did not move all week. Any move — listing, sale, send, even to yourself — ends that week for the piece, and the new holder starts the week after. The action counts in the week of the block it confirms in, first to last block alike.',casesWhat:'What you do',casesThis:'This week',casesLater:'Later weeks',
  caseGroups:[
   {title:'Public actions · read automatically',rows:[
    ['Hold it, do nothing','Earns the whole week','Every week; claimable once each week ends','ok'],
    ['List it (even if reclaimed at once)','Nothing: the listing week earns nothing, its earlier blocks included','Nothing while listed; weeks completed before the listing stay claimable','no'],
    ['Edit the price (no delist)','No change: still listed','Still listed','info'],
    ['Reclaim (cancel the listing)','Nothing in the reclaim week either','Resumes the week after','no'],
    ['Sell','Nobody earns that week for the piece','The seller keeps the full weeks before the listing week; the buyer starts next week','no'],
    ['Buy','Nothing, even when bought in a week’s last block','From next week','no'],
   ]},
   {title:'Private actions · not in public records',rows:[
    ['Send it to someone','Nothing','Full weeks before the send stay claimable','no'],
    ['Receive it privately','Nothing','From next week','no'],
    ['Send to yourself, or Add relay credits','Nothing: adding credits sends the piece to yourself','From next week, as before','no'],
   ]},
   {title:'No effect on eligibility',rows:[
    ['Claim (weekly, or let weeks build and claim once)','Keeps earning, no gap','Programme claim deadline: block 1,102,740','ok'],
    ['Private claim / claim with the piece shown','A private claim pays the 100% base','Show the piece to collect its trait bonus, now or later','ok'],
    ['Prove you hold a piece; withdraw sale proceeds','No effect (the proof is off-chain; proceeds are BTC, not the piece)','No effect','ok'],
   ]},
   {title:'When',rows:[
    ['Held unlisted at block 971,700 or earlier','—','From week 1 (block 971,701)','ok'],
    ['Any block of a week, first to last','The rules above apply to that week','A new holding starts the next week','info'],
    ['Week 78, the last','The same rules','A purchase, reclaim or receipt then has no later week','info'],
    ['After block 1,050,324','Accrual has ended','Claim completed weeks before the deadline','info'],
   ]},
   {title:'Other',rows:[
    ['Sell into an offer','Like a sale: nothing that week','The seller keeps earlier full weeks; the buyer starts next week','no'],
    ['A Naka minted after launch (6 were still unminted at block 971,787)','Nothing in its mint week','From the week after','info'],
    ['Listed and unminted Nakas','Their units still count in K','Nobody claims those shares and nobody else gets them; where they go is not stated officially','info'],
   ]},
  ],
  safeList:['Never connects to a wallet','No login, approval or signature','Reads only public market data, the numbers you add, and what you choose to sync from pages already shown','Holdings, comparison, teammates and settings stay on this device','Open source: review it and build it yourself'],
  formulaWeek:'Weekly SHNAKAS = weight units × v × 1,008 ÷ 10⁸',formulaRate:'v = floor(26,664,000,000,000 ÷ 1,008 ÷ K)',
  allocLines:['100% weight = 4 units; K is the units of all 3,333 catalog pieces, minted or not, listed pieces included','Weights are re-scored every block from the listings active after it; a week pays the sum of its 1,008 blocks','Matches the official weights endpoint block by block; not a payout promise'],
  rulesFormula:'Total weight = base 100% + every trait bonus + the highest number bonus, capped at 400%',traitTitle:'Trait bonus · trait floor ÷ collection floor',numberTitle:'Number bonus · highest tier only',
  zeroRule:'A trait with no listing: at least 20 pieces +100%; fewer than 20 uses the median of its last 3 sales against the collection floor (two sales: their mean; one: that sale; none: +0%).',
  scheduleRule:(start,blocks,weeks)=>`Rewards run from block ${start}, ${blocks} blocks a week for ${weeks} weeks.`,pieceRow:w=>`This Naka · ${w}`,pieceRowCancel:w=>`This Naka once delisted · ${w}`,othersRow:'Your other holdings',unchanged:'unchanged',totalRow:'Total',navRaise:'Raise weight',searchOpen:'Look up a number · Compare',subSearch:'Look up · Compare',navAbout:'About',safeTitle:'Read-only by design',forMeShort:v=>`For my holdings ${v} / week`,compareAddShort:'＋ Add',readOnlyTag:'Read-only, no signing',
  raiseFull:'Full page ↗',raiseFullHint:'Open Raise weight on the extension page: every listing, every piece, combined plans',raiseBasis:h=>`Listings at block ${h} · fees excluded`,raiseScope:(n,list)=>`Includes ${n} added number${n===1?'':'s'}: ${list.join(', ')}${n>list.length?` and ${n-list.length} more`:''}`,raiseRunning:'Computing…',
  raiseEmpty:'Add your holdings first: then this tab shows which listing to buy and how to reach 400%.',raiseEnded:'The reward period is over; no week is left to earn.',
  raiseBuyTitle:'Best buy',raisePlanTitle:'Reach 400%',raiseLockTitle:'Own a trait',raiseSimTitle:'Simulate',raiseAllBuys:n=>`All ${n} ↗`,raiseAllPlans:n=>`All ${n} ↗`,raiseAllTraits:n=>`All ${n} ↗`,
  raiseBuyNone:'No listing raises your weekly SHNAKAS right now.',raisePlanDone:'Nothing to take to 400%: every piece is there already or being sold.',raisePlanNone:'Current listings cannot take any piece to 400%.',raisePlanAuto:n=>`${n===1?'One piece reaches':`${n} pieces reach`} 400% once listings already closing close: nothing to do.`,
  raisePer:v=>`+${v} per 0.001 BTC`,raiseWeek:'/ week',raiseFree:'Free',raisePlanCost:(c,b)=>b?`${c} BTC · buy ${b}`:'Free: reclaims only',raiseMate:'Mate',
  raiseBuyHint:n=>`Open #${n} on the market`,raisePlanHint:n=>`The steps for #${n} on the extension page`,
  raiseLockOnce:p=>`once ours ${p}`,raiseLockOurs:(k,n)=>`ours ${k}/${n}`,raiseLockDeal:n=>`${n} by private deal`,raiseLockUnminted:n=>`${n} unminted`,raiseLockNoFloor:'buying leaves no listing to score',raiseLockMissing:'missing',raiseLockKept:'bonus kept',
  raiseLockNone:n=>n?`${n===1?'The one trait our pieces carry is':`All ${n} traits our pieces carry are`} already all ours: nothing to do.`:'Our pieces carry no trait to own right now.',raiseLockHint:name=>`How to own ${name}, on the extension page`,
  raiseSimLine:'What a listing, sale or reclaim does to everyone',buyNow:'Buy ↗',buyHint:'Open this listing on the market',
  compareEmptyPopup:'Nothing to compare yet',compareHowPopup:'Tap here to enter numbers (comma- or space-separated), or add from a market inspection.',compareOpen:'Full comparison with traits ↗',
  lookupHow:'Listed Nakas show their after-sale weight; unlisted ones show their holding weight.',blockChip:h=>`Block ${h}`,sharedTrait:n=>`Shared by ${n} held ${n===1?'Naka':'Nakas'}`,showAll:'Show all',zeroSupplement:'Zero-listing supplement',
  addHoldingTitle:'Add a holding',addCompareTitle:'Add to Compare',confirmAdd:'Add',cancel:'Cancel',
  expandAll:n=>`Show all ${n}`,collapse:'Show less',tileHint:n=>`Check #${n}`,listedShort:'Listed · not earning',
  buyLead:n=>`If you buy #${n}`,
  tabListings:'Listings',aboutTitle:'About',aboutSafe:'Read-only and safe',aboutAlloc:'How the weekly figure is calculated',aboutRules:'Weight rules',aboutData:'Data and privacy',
  
  dataDetail:'Listings, sales and official weights come from the public Ord Dropz API; block times from a public block explorer. Artwork loads from the same public image URLs the official site uses. Holdings, comparison, teammates’ numbers and settings stay on this device and are never uploaded.',
  versionLine:v=>`Version ${v} · Unlicense`,
  
  readOnlyDetail:'Naka Sigil reads public market data, the numbers you add, and — only when you press its sync button on the Wallet page — the eligibility states already shown there. It never connects to a wallet, asks you to log in, requests approval or signs anything. Holdings stay on this device.',
  openSource:'Open source ↗',weekUnit:'SHNAKAS / week',
  manage:'Manage ↗',listedTag:'Listed',blockBasis:h=>`Block ${h} · official weights basis`,
  copyAll:'Copy all numbers',copyAllDone:n=>`Copied ${n} number${n===1?'':'s'}`,copyAllFailed:'Copy failed',copyAllHint:'Numbers only, comma-separated: paste them into Add to import',
  wantPrefix:'Want to buy',wantCopy:'Copy wanted post',wantCopied:n=>`Copied a wanted post for ${n}: paste it in the group`,wantHint:'“Want to buy” and the numbers, comma-separated: post it in the group; pasted into Add, the numbers import',tgWanted:'Post it in the Naka Telegram group ↗',tgJoin:'Join the Telegram group ↗',
  
  pageHoldings:'Held on this page',pageWeekly:n=>`${n} ${n===1?'Naka':'Nakas'} on this page`,myHoldingsLine:(n,v)=>`My holdings: ${n} · ${v} SHNAKAS / week`,
  avgWeight:(avg,now)=>`This week’s average weight ${avg}% (official accumulator) · now ${now}`,weightDetail:n=>`Weight breakdown of #${n}`,hoverWeight:'Hover the weight badge on a Naka for its breakdown, as on the market; select the rest of the card to simulate listing it.',
  confirmTitle:'A sale Naka Sigil cannot attribute: did you sell or buy?',toConfirm:'Confirm sale',confirmAsk:'Did you sell it or buy it?',leftThisWeek:(list,keeps)=>`Sold this week: ${list.join(', ')}. Moved to Left${keeps?'; the full weeks held before listing stay claimable':''}`,leftItem:(n,h)=>`#${n} (block ${h})`,leftSoldWeek:(list,n)=>`Sold this week: ${list.join(', ')}${n>list.length?` and ${n-list.length} more`:''}. Moved to Left`,leftView:'View ↗',leftDismiss:'Dismiss',confirmSale:(n,l,s)=>`#${n}: listed at block ${l}, sold at block ${s}.`,markSold:'I sold it',markBought:'I bought it',markFailed:'Not saved: the public records of this sale are not loaded yet.',holdingsWaiting:n=>`${n} saved ${n===1?'Naka awaits':'Nakas await'} public data; their IDs are kept`,
  weeksTitle:'Weekly totals',weekCols:{week:'Week',pieces:'Pieces counted',amount:'SHNAKAS'},weekName:n=>`Week ${n}`,weekUnknown:'Not determinable yet',weekReading:'Reading the official table…',
  weeksNote:'Finished weeks only, from the official weekly tables. Each holding counts the weeks of your own run of it: from your purchase (or the mint) through your listings and reclaims, minus listing weeks and weeks the Wallet page showed it moving privately. Claimed parts are included; the official wallet shows what is still claimable. Claims can wait and be made in one go until block 1,102,740.',
  leftTitle:n=>`Left your vault (${n})`,leftSold:(l,w,s)=>`Listed at block ${l} (${w}), sold at block ${s}`,leftWallet:'Sent away privately (shown on your Wallet page)',leftKeeps:(weeks,v)=>`Keeps weeks ${weeks}${v===null?'':` · ${v} SHNAKAS`}`,leftNone:'No full week before it left: nothing to claim',
  leftRestore:'Back to holdings',leftRemove:'Remove',leftNote:'A piece that left keeps your full weeks before it left (before the listing week for a sale); that week and later earn nothing for you. Claim them in the official wallet.',
  thisWeek:'This week',perWeekShort:'/ week',thisWeekUnit:'this week',perWeekLine:v=>`${v} / wk`,idleNote:'Counts from week 1',simulateHint:n=>`#${n}: select to simulate listing it`,simLink:'Simulate listing ↗',simLinkHint:'What listing this holding at a price does to you and to other Nakas',planLink:'Plan to 400% ↗',planLinkHint:'Cheapest purchases or reclaims that bring this Naka to the 400% cap',
  removeHolding:n=>`Remove #${n} from My holdings`,holdingsHow:'Use ＋ to add a number, or add every Naka shown in your Vault or Wallet with one click.',holdingsHowDemo:'Use ＋ to add a number (this demo keeps them in this browser only).',
  syncButton:'Sync displayed eligibility to Naka Sigil',syncTitle:'Reads the earning state of each piece shown here (and the weeks a piece that left kept); stored on this device only. Claims nothing.',syncOk:'✓ Synced on this device',syncMoved:n=>`✓ Synced; ${n} ${n===1?'piece':'pieces'} sent away moved to Left your vault`,
  syncAhead:'This page is a block ahead of Naka Sigil’s data: try again in about a minute',syncNoLive:'Naka Sigil has no live data yet: keep an Ord Dropz page open for a minute and try again',syncBadReading:'Could not read the week and block progress on this page',syncBoundary:'The page is between two weeks (0 / 1008): sync after the next block',syncFailed:'Not synced: try again',
  findSearching:n=>`Naka Sigil: finding #${n} on the market…`,findFound:(n,after,gain)=>`Found #${n}: ${after} once you buy it${gain?`, your weekly SHNAKAS ${gain}`:''}`,findFoundHeld:(n,w)=>`Found #${n}: not for sale, weight ${w}`,
  findPending:n=>`#${n} is being bought by someone (spinner on its card): it confirms in the next block, so buying it now fails`,findGone:n=>`#${n} is no longer listed: just bought or reclaimed`,findSearchBtn:'Search by number',
  findNoGrid:n=>`The market grid did not load: search for #${n} yourself`,fxAfter:'After buying',fxGain:v=>`${v} / week`,fxWeight:'Weight',findMissing:n=>`#${n} does not show after the search: it may have just sold (with “Listed only” on, sold pieces are hidden)`,findNoSearch:n=>`The market’s search box was not found: type ${n} into it`,findNotInData:n=>`#${n} is not in Naka Sigil’s data`},
 zh:{
  heading:'找到你的 Naka，增加你的权重',intro:'先看持仓每周能分到多少 SHNAKAS，再按权重、挂价和属性比较挂单',page:'Shielded Nakas · 持仓与比较',local:'本地快照',
  compare:'比较',open:'打开比较页',market:'打开市场 ↗',colMarket:'前往市场 ↗',
  add:'＋ 加入比较',inCompare:'✓ 已加入比较',removeCompare:'✕ 移出比较',fullShort:'已满 4/4 · 去比较页 ↗',inCompareTag:'✓ 比较',
  addHint:'加入比较页（最多四枚）',removeHint:'已在比较中，点击移出。',
  full:'比较已满四枚，在比较页移除一枚后才能加入新的。',fullHere:'已选满四枚，移除上方一枚后可继续加入。',
  addError:'保存失败，请重试。',
  lookup:'输入 Shielded 编号加入比较',find:'加入比较',placeholder:'输入 Shielded 编号，如 379',invalid:'请输入有效的 Shielded 编号。',missing:'所选区块快照未收录该编号。',
  remove:'移除',clear:'清空',count:n=>`已选 ${n} / 4`,load:'载入示例',
  empty:'选择至多四枚 Naka 进行比较',emptyHint:'点击上方“＋ 加入比较”输入编号，或在市场悬浮明细、插件弹窗中加入。',
  scroll:'横向滑动查看全部列',preview:n=>`放大 Shielded #${n}`,
  total:'总权重',after:'成交后',holding:'持有公式值',before:'成交前公式值',ask:'挂单价格 · BTC',askNote:'所选区块挂单价格，不含费用；不是实时报价。',
  noFloor:'成交后集合地板不存在',unavailable:'无法计算',number:'编号加成',price:'BTC',
  traitGuide:'特征加成',legend:'↑ 加成上升 · ↓ 加成下降 · ◆ 价格依据变化',
  listed:'已挂单',unlisted:'未挂单',unknown:'挂单状态未知',
  independent:'每列仅成交该挂单，其他挂单不变。含基础 100%，封顶 400%。',
  limits:'区块权重，非累计奖励；挂单期间奖励为零。',unknownNote:'区间包含缺失的成交依据，不保证达到上限。',
  filter:'成交后 ≥',any:'不限权重',filterNote:'仅筛选当前已加载的挂单 NFT；区间按下限判断是否达标。',
  shown:(n,t)=>`${n} / ${t} 已加载`,noMatches:'已加载项无匹配，请在比较页查看全部快照挂单。',
  browse:'市场挂单',browseNote:'挂价从低到高，不含手续费 · 悬停查看买入后的每周增量',
  
  rules:'规则来源',version:'当前链上奖励规则',
  share:'无需连接钱包、API key 或上传数据。',
  holdings:'我的持仓',holdingsNote:'只保存在本机，由你手动维护，可以包含其他账号里的 NFT。',
  
  holdingsEmpty:'添加你的持仓，查看每周分配，以及买入或撤单后的变化。',
  weekly:'预计每周分配',perWeek:v=>`每周 ${v} SHNAKAS`,gainWeek:v=>`每周 ${v} SHNAKAS`,ofPool:v=>`占每周奖池 ${v}`,
  listedNoEarn:'挂单中 · 挂单期间没有奖励',
  allocationBasis:'按官方公式：每周 266,640 SHNAKAS 按全部 3,333 枚的权重单位分配（100% = 4 单位）。挂单中的持仓没有奖励；新买入的持仓从下一个奖励周开始有奖励。不构成发放承诺。',
  boost:'增加我的权重',boostHint:'买入后能增加你每周分配的挂单',boostEmpty:'先加入持仓，才能使用“增加我的权重”。',
  forMe:'对我的持仓',weeklyAfterBuy:'买入后每周',
  affected:'持仓中权重有变化的',close:'关闭',
  addHolding:'＋ 我的持仓',inHoldings:'✓ 我的持仓',holdingHint:'添加到我的持仓（只保存在本机）',holdingRemoveHint:'已在我的持仓中，点击移出。',
  addVisible:n=>`＋ 将本页 ${n} 枚添加到我的持仓`,addRest:(n,k)=>`＋ 添加其余 ${n} 枚（已添加 ${k} 枚）`,addedVisible:n=>`✓ 本页 ${n} 枚都在我的持仓`,openHoldings:'我的持仓 ↗',pieces:n=>`${n} 枚`,
  bundledNote:'历史数据演示 · 示例持仓 · 不是当前挂单',
  navHome:'持仓',compareSlotsLeft:n=>`＋ 还可加入 ${n} 枚`,numberPromptMulti:'如 379, 1025, 1500',multiHint:'可一次输入多个编号，用逗号、顿号、空格或换行分隔（中英文逗号都可以）',skipInvalid:t=>`“${t}”不是有效编号`,skipMissing:n=>`#${n} 不在当前区块数据中`,skipHeld:n=>`#${n} 已在我的持仓`,skipCompared:n=>`#${n} 已在比较中`,skipFull:n=>`#${n} 超出比较上限 4 枚`,addedSkipped:(n,list)=>`已添加 ${n} 枚；跳过：${list.join('；')}`,navBlock:'区块',stripStart:n=>`距第 1 周 ${n} 块`,navSections:'页面导航',emptyTitle:'添加你的第一枚 Naka',emptyText:'看看它每周能分到多少 SHNAKAS。',emptyAdd:'＋ 添加编号',emptyOr:'或一次添加整页',vaultLink:'金库',walletLink:'钱包持仓',emptyJumpNote:'打开后进入“金库”或“持仓”，点页面上的“＋ 将本页 N 枚添加到我的持仓”。',tilesTitle:n=>`全部持仓 (${n})`,allocTitleBlock:'本区块分配',perFull:'100% 权重 / 周',perCap:'400% 封顶 / 周',unitsK:'全目录权重单位 K',poolWeek:'每周奖池',allocNote:v=>`每个权重单位每块得到 v = ${v} 个最小单位，与官方接口算法一致。`,scheduleWeekN:n=>`第 ${n} 周`,scheduleEndBlock:'最后有奖励的区块',scheduleClaim:'领取截止区块',progressLabel:'已完成',weeksDone:(n,t)=>`${n} / ${t} 周`,listAdd:'＋ 添加',scheduleTitle:'奖励时间表',afterDelist:'撤单后',earnListed:'0',
  aboutCases:'奖励资格 · 各种操作',casesLead:'按官方引擎：一周的奖励只给这一周里这一枚完全没动过的持有人。挂单、成交、转出，哪怕转给自己，这一周就没有奖励，新的持有人从下一周起有奖励。操作算在它确认的那一块所在的周，一周的第一块和最后一块都一样。',casesWhat:'操作',casesThis:'本周',casesLater:'之后各周',
  caseGroups:[
   {title:'公开操作 · 插件自动识别',rows:[
    ['一直持有，不做任何操作','整周有奖励','每周都有奖励，周结束后可领取','ok'],
    ['挂单（哪怕马上撤单）','没有奖励：挂单那一周整周都没有，挂单前的区块也没有','挂单期间每周都没有奖励；挂单前已完成的周仍可领取','no'],
    ['改价（不撤单）','不变：仍在挂单中','仍按挂单处理','info'],
    ['撤单','撤单这一周也没有奖励','撤单的下一周起恢复奖励','no'],
    ['卖出','这一周这一枚谁都没有奖励','卖家保留挂单那一周之前完整周的奖励；买家下一周起有奖励','no'],
    ['买入','没有奖励，哪怕在一周的最后一块买入','下一周起有奖励','no'],
   ]},
   {title:'私下操作 · 公开记录里看不到',rows:[
    ['私下转给别人','没有奖励','转出前完整的周仍可领取','no'],
    ['私下收到','没有奖励','下一周起有奖励','no'],
    ['转给自己、加中继额度（Add relay credits）','没有奖励：加中继额度会把这一枚转给自己','下一周起照常有奖励','no'],
   ]},
   {title:'不影响资格的操作',rows:[
    ['领取奖励（每周领，或攒着一次领）','照常有奖励，不断档','协议领取截止区块 1,102,740','ok'],
    ['隐私领取 / 展示藏品领取','隐私领取先付 100% 基础部分','展示藏品后可以领特征加成，也可以稍后补领','ok'],
    ['证明持有、提取卖出所得 BTC','不影响（证明不上链；提取的是 BTC，不是藏品）','不影响','ok'],
   ]},
   {title:'时间点',rows:[
    ['区块 971,700（含）之前持有且没挂单','—','第 1 周（区块 971,701 起）开始有奖励','ok'],
    ['一周的第一块到最后一块','在这一周任何一块操作，这一周都按上面的规则算','新的持有记录从下一周起有奖励','info'],
    ['第 78 周（最后一周）','规则相同','这一周买入、撤单或收到的已经没有后续能拿奖励的周','info'],
    ['区块 1,050,324 之后','奖励已结束','已完成的周在领取截止前领取','info'],
   ]},
   {title:'其它',rows:[
    ['接受报价（Offers）成交','和卖出一样：这一周没有奖励','卖家保留之前完整周的奖励；买家下一周起有奖励','no'],
    ['启动后才铸造的 Naka（区块 971,787 时还有 6 枚未铸造）','铸造那一周没有奖励','下一周起有奖励','info'],
    ['挂单中和未铸造的 Naka','它们的权重照样算进全网 K','这部分份额没人能领，也不分给别人；去向官方没有说明','info'],
   ]},
  ],
  safeList:['从不连接钱包','无需登录、授权或签名','只读取公开市场数据、你添加的编号，以及你在官方页面主动同步的已显示信息','持仓、比较、队友和设置只保存在本机','代码开源，可以自行审查和编译'],
  formulaWeek:'每周 SHNAKAS = 权重单位 × v × 1,008 ÷ 10⁸',formulaRate:'v = floor(26,664,000,000,000 ÷ 1,008 ÷ K)',
  allocLines:['100% 权重 = 4 个权重单位；K 是全部 3,333 枚（含未铸造、含挂单中）的权重单位合计','权重逐块计算：每个区块按该块确认后的有效挂单重算，一周 1,008 块逐块累加','与官方权重接口逐块一致；不构成发放承诺'],
  rulesFormula:'总权重 = 基础 100% + 各特征加成 + 编号加成（只取最高一档），封顶 400%',traitTitle:'特征加成 · 特征地板价 ÷ 集合地板价',numberTitle:'编号加成 · 只取最高一档',
  zeroRule:'特征没有挂单时：至少 20 件 +100%；不足 20 件按最近 3 笔成交价的中位数对比集合地板（两笔取平均、一笔取该笔、无成交 +0%）。',
  scheduleRule:(start,blocks,weeks)=>`奖励自区块 ${start} 起，每周 ${blocks} 块，共 ${weeks} 周。`,pieceRow:w=>`这一枚 · ${w}`,pieceRowCancel:w=>`这一枚撤单后 · ${w}`,othersRow:'原有持仓',unchanged:'不变',totalRow:'合计',navRaise:'增加权重',searchOpen:'查询编号 · 比较',subSearch:'查询 · 比较',navAbout:'说明',safeTitle:'只读观察，天生安全',forMeShort:v=>`对我的持仓 每周 ${v}`,compareAddShort:'＋ 加入',readOnlyTag:'只读 · 无需登录、授权、签名',
  raiseFull:'完整页 ↗',raiseFullHint:'在插件独立页打开“增加权重”：全部挂单、全部持仓、合并方案',raiseBasis:h=>`按区块 ${h} 的挂单计算 · 不含手续费`,raiseScope:(n,list)=>`含添加的编号 ${n} 枚：${list.join('、')}${n>list.length?' 等':''}`,raiseRunning:'计算中…',
  raiseEmpty:'先添加持仓：这里会告诉你买哪单划算、怎么冲到 400%。',raiseEnded:'奖励期已结束，没有还能拿奖励的周。',
  raiseBuyTitle:'买哪单划算',raisePlanTitle:'冲 400%',raiseLockTitle:'垄断特征',raiseSimTitle:'模拟',raiseAllBuys:n=>`全部 ${n} 单 ↗`,raiseAllPlans:n=>`全部 ${n} 枚 ↗`,raiseAllTraits:n=>`全部 ${n} 个 ↗`,
  raiseBuyNone:'现在没有能让你每周增加的挂单。',raisePlanDone:'没有要冲 400% 的：持仓都已到 400%，或正在卖出。',raisePlanNone:'现有挂单不够把任何一枚冲到 400%。',raisePlanAuto:n=>`${n} 枚在已成交或撤单中的挂单关闭后会自动到 400%，无需操作。`,
  raisePer:v=>`每 0.001 BTC +${v}`,raiseWeek:'每周',raiseFree:'免费',raisePlanCost:(c,b)=>b?`${c} BTC · 买 ${b} 单`:'免费：只需撤单',raiseMate:'队友',
  raiseBuyHint:n=>`在市场打开 #${n} 这张卡`,raisePlanHint:n=>`在独立页查看 #${n} 冲 400% 的步骤`,
  raiseLockOnce:p=>`垄断后 ${p}`,raiseLockOurs:(k,n)=>`我们 ${k}/${n}`,raiseLockDeal:n=>`私下收购 ${n} 枚`,raiseLockUnminted:n=>`未铸造 ${n} 枚`,raiseLockNoFloor:'买下后无挂单可算',raiseLockMissing:'还差',raiseLockKept:'加成不变',
  raiseLockNone:n=>n?`持仓带的 ${n} 个特征都已全在我们手里，没有要做的。`:'持仓里现在没有可垄断的特征。',raiseLockHint:name=>`在独立页查看如何垄断 ${name}`,
  raiseSimLine:'挂单、成交或撤单对你和全网的影响',buyNow:'去购买 ↗',buyHint:'在市场打开这枚挂单',
  compareEmptyPopup:'还没有选择比较的 Naka',compareHowPopup:'点这里输入编号（多个用逗号或空格分隔），也可以在市场悬浮明细中加入。',compareOpen:'查看完整比较（含特征）↗',
  lookupHow:'已挂单显示成交后权重，未挂单显示持有权重。',blockChip:h=>`区块 ${h}`,sharedTrait:n=>`持仓中 ${n} 枚共享此特征`,showAll:'显示全部',zeroSupplement:'零挂单补充规则',
  addHoldingTitle:'添加持仓',addCompareTitle:'加入比较',confirmAdd:'添加',cancel:'取消',
  expandAll:n=>`展开全部 ${n} 枚`,collapse:'收起',tileHint:n=>`查看 #${n} 的权重`,listedShort:'挂单中 · 没有奖励',
  buyLead:n=>`如果买入 #${n}`,
  tabListings:'挂单',aboutTitle:'说明',aboutSafe:'只读与安全',aboutAlloc:'每周分配怎么算',aboutRules:'权重规则',aboutData:'数据与隐私',
  
  dataDetail:'挂单、成交和官方权重来自 Ord Dropz 公开接口，区块时间来自公开区块浏览器；藏品图片使用官方网站同样的公开图片地址。持仓、比较、队友编号和设置只保存在本机，从不上传。',
  versionLine:v=>`版本 ${v} · Unlicense 许可`,
  
  readOnlyDetail:'Naka Sigil 只读取公开市场数据、你自己添加的编号，以及你在钱包页点同步按钮时页面上已显示的资格状态；从不连接钱包，不要求登录、授权或签名。持仓只保存在本机。',
  openSource:'开源代码 ↗',weekUnit:'SHNAKAS / 周',
  manage:'管理 ↗',listedTag:'挂单中',blockBasis:h=>`区块 ${h} · 官方权重口径`,
  copyAll:'复制全部编号',copyAllDone:n=>`已复制 ${n} 个编号`,copyAllFailed:'复制失败',copyAllHint:'纯数字、逗号分隔；对方在“添加”里粘贴即可导入',
  wantPrefix:'求购',wantCopy:'复制求购信息',wantCopied:n=>`已复制 ${n} 个编号的求购信息，进群粘贴即可`,wantHint:'“求购”加逗号分隔的编号：发到群里求购；粘贴进“添加”也能直接导入这些编号',tgWanted:'进入 Naka Telegram 群求购 ↗',tgJoin:'进入 Telegram 交流群 ↗',
  
  pageHoldings:'本页持仓',pageWeekly:n=>`本页 ${n} 枚`,myHoldingsLine:(n,v)=>`我的持仓 ${n} 枚 · 每周 ${v} SHNAKAS`,
  avgWeight:(avg,now)=>`本周平均权重 ${avg}%（官方累计表）· 当前 ${now}`,weightDetail:n=>`#${n} 的权重明细`,hoverWeight:'鼠标移到图片右下角的权重标签查看明细（与市场相同）；点卡片其它位置模拟挂单。',
  confirmTitle:'插件分不清这笔成交是你卖出还是你买入，请选一下',toConfirm:'待确认',confirmAsk:'是你卖出还是买入？',leftThisWeek:(list,keeps)=>`本周卖出 ${list.join('、')}，已移到已离手${keeps?'；挂单前完整持有的周仍可领取':''}`,leftItem:(n,h)=>`#${n}（区块 ${h}）`,leftSoldWeek:(list,n)=>`本周卖出 ${list.join('、')}${n>list.length?` 等 ${n} 枚`:''}，已移到已离手`,leftView:'查看 ↗',leftDismiss:'关闭',confirmSale:(n,l,s)=>`#${n}：区块 ${l} 挂单，区块 ${s} 成交。`,markSold:'是我卖出的',markBought:'是我买入的',markFailed:'没保存：还没读到这笔成交的公开记录。',holdingsWaiting:n=>`${n} 枚已保存持仓正在等待公开数据，编号不会移除`,
  weeksTitle:'每周收益',weekCols:{week:'周',pieces:'有奖励的枚数',amount:'SHNAKAS'},weekName:n=>`第 ${n} 周`,weekUnknown:'暂时无法确定',weekReading:'正在读取官方周累计表…',
  weeksNote:'只列已结束的周，金额来自官方周累计表。每一枚按你自己持有的那一段算：从你买入（或铸造）起，经过你的挂单和撤单，扣掉挂单那几周和钱包页显示私下转移的那几周。含已领取部分，可领取余额以官方钱包为准。没领的周会一直累积，可以一次领完，截止区块 1,102,740。',
  leftTitle:n=>`已离手（${n}）`,leftSold:(l,w,s)=>`区块 ${l} 挂单（${w}），区块 ${s} 售出`,leftWallet:'私下转出（钱包页显示）',leftKeeps:(weeks,v)=>`保留第 ${weeks} 周${v===null?'':` · ${v} SHNAKAS`}`,leftNone:'离手前没有完整的周，没有可领取的',
  leftRestore:'放回持仓',leftRemove:'移除',leftNote:'离手的 Naka 保留你离手前完整的周（卖出的算到挂单那一周之前）；那一周及以后都不再归你。请在官方钱包领取。',
  thisWeek:'本周',perWeekShort:'每周',thisWeekUnit:'本周',perWeekLine:v=>`每周 ${v}`,idleNote:'第 1 周起有奖励',simulateHint:n=>`#${n}：点击模拟挂单的影响`,simLink:'挂单模拟 ↗',simLinkHint:'按某个价格挂出这一枚，对你和其它 Naka 有什么影响',planLink:'冲 400% 方案 ↗',planLinkHint:'把这一枚推到 400% 封顶的最省钱买单或撤单组合',
  removeHolding:n=>`从我的持仓移除 #${n}`,holdingsHow:'点击“＋ 添加持仓”输入编号，或在金库、钱包页一键添加页面上显示的全部 Naka。',holdingsHowDemo:'点击“＋ 添加持仓”输入编号（演示页只保存在这个浏览器里）。',
  syncButton:'将当前奖励资格同步到插件',syncTitle:'读取本页显示的每枚奖励状态（以及已离手藏品保留到第几周），只保存在本机，不做任何领取操作。',syncOk:'✓ 已同步到本机',syncMoved:n=>`✓ 已同步；${n} 枚私下转出的移到了“已离手”`,
  syncAhead:'本页比插件的数据新一个区块：约一分钟后再点',syncNoLive:'插件还没有实时数据：保持一个 Ord Dropz 页面打开一分钟后再点',syncBadReading:'没读懂本页的周次和区块进度',syncBoundary:'本页正处在两周交界（0 / 1008 块）：下一块出来后再同步',syncFailed:'没同步成功，请重试',
  findSearching:n=>`Naka Sigil：正在市场里找 #${n}…`,findFound:(n,after,gain)=>`找到 #${n}：买入后 ${after}${gain?`，我每周 ${gain}`:''}`,findFoundHeld:(n,w)=>`找到 #${n}：未挂单，权重 ${w}`,
  findPending:n=>`#${n} 正在被别人购买（卡片右上角在转圈）：等下一块确认，现在买会失败`,findGone:n=>`#${n} 已不在挂单里：刚被买走或撤单`,findSearchBtn:'按编号搜索',
  findNoGrid:n=>`市场网格没有加载出来：请自己搜索 #${n}`,fxAfter:'买入后',fxGain:v=>`每周 ${v}`,fxWeight:'权重',findMissing:n=>`搜索后没有显示 #${n}：可能刚被买走（勾选了“仅看在售”时，已售出的不显示）`,findNoSearch:n=>`没找到市场的搜索框：请在搜索框输入 ${n}`,findNotInData:n=>`插件数据里没有 #${n}`}};
 const pick=lang=>copy[lang==='zh'?'zh':'en'];
 const GITHUB='https://github.com/ordinalser/naka-sigil';
 /** The Naka community group on Telegram: where wanted posts go, and the popup's About links to it. */
 const TELEGRAM='https://t.me/+fRT4yVcxZ6VlNTBl';
 /** Piece artwork from the public art endpoint the official site uses, then its Ordinals inscription, then the sigil. */
 function art(snap,id,fallbackClass){
  const img=document.createElement('img'),asset=snap.items[id][0]-snap.collection.numberStart;
  img.src=`https://shielded-api.ord-dropz.xyz/api/shielded/art/${asset}?c=${encodeURIComponent(snap.collection.cid)}`;img.alt=`Shielded #${snap.items[id][0]}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  let ordinals=false;img.addEventListener('error',()=>{if(!ordinals){ordinals=true;img.src=`https://ordinals.com/content/${id}`;}else img.replaceWith(globalThis.NakaPixel.sigil(fallbackClass));});
  return img;
 }
 /** A per-page artwork store: one element per place and NFT, reused by every render. Re-appending the same element keeps
  * the decoded image (and a fallback that already replaced it), so data refreshes never reload or flash artwork. */
 function artStore(){
  const store=new Map();
  return (snap,id,fallbackClass,place)=>{const key=place+'\u0000'+id;if(!store.has(key)){const holder=document.createElement('span');holder.className='naka-art';holder.append(art(snap,id,fallbackClass));store.set(key,holder);}return store.get(key);};
 }
 /** Paint one add/remove control from NakaExplore.compareState: a full selection explains itself instead of silently disabling. */
 function paintCompare(button,state,c){
  const span=(cls,text)=>{const s=document.createElement('span');s.className=cls;s.textContent=text;return s;};
  const was=button.dataset.compare;
  // Just added under the pointer or keyboard focus: confirm "In Compare" until the pointer or focus leaves,
  // instead of immediately revealing the remove action.
  if(state==='selected'&&was!==undefined&&was!=='selected'){
   button.classList.add('naka-select--fresh');
   const settle=()=>button.classList.remove('naka-select--fresh');
   button.addEventListener('mouseleave',settle,{once:true});button.addEventListener('blur',settle,{once:true});
  }else if(state!=='selected')button.classList.remove('naka-select--fresh');
  button.dataset.compare=state;button.setAttribute('aria-pressed',String(state==='selected'));button.disabled=false;
  if(state==='selected')button.replaceChildren(span('naka-select__on',c.inCompare),span('naka-select__off',c.removeCompare));
  else if(state==='full')button.replaceChildren(span('',c.fullShort));
  else if(state==='add')button.replaceChildren(span('',c.add));
  else throw new Error(`Unknown comparison state: ${state}`);
  button.title=state==='selected'?c.removeHint:state==='full'?c.full:c.addHint;
 }
 /** SHNAKAS amounts at two decimals (the official per-block rate is exact to 8); a range keeps both ends. */
 const amount=x=>x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 function shn(range,sign=false){const f=x=>(sign&&x>=0.005?'+':'')+amount(x);const lo=f(range.lo),hi=f(range.hi);return lo===hi?lo:`${lo}–${hi}`;}
 function percent(range){const f=x=>(x*100).toFixed(3)+'%';const lo=f(range.lo),hi=f(range.hi);return lo===hi?lo:`${lo}–${hi}`;}
 /** What a purchase or delisting does to my weekly SHNAKAS: the piece itself (with its weight), my other holdings
  * (shared traits and the programme total can move them), and the total before → after in pixel figures. */
 function holdingsLine(x,c){
  const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const change=d=>d.lo>0?'up':d.hi<0?'down':d.lo===0&&d.hi===0?'same':'unknown';
  const a=x.allocation,box=node('div','naka-holdings'),rows=node('dl','naka-holdings__rows');
  const row=(label,value,cls,d)=>{const r=node('div',cls);const dd=node('dd');dd.append(value);if(d)dd.dataset.change=change(d);r.append(node('dt','',label),dd);rows.append(r);};
  const weight=globalThis.ShnakasRules.formatWeight(x.scenario.result);
  row(x.action==='sale'?c.pieceRow(weight):c.pieceRowCancel(weight),`+${shn(a.piece)}`,'',a.piece);
  row(c.othersRow,a.others.delta.lo===0&&a.others.delta.hi===0?c.unchanged:shn(a.others.delta,true),'',a.others.delta);
  const total=node('span','naka-holdings__total'),after=shn(a.after.weekly),delta=shn(a.delta,true);
  const pixels=text=>{const s=node('span','naka-holdings__pixels');s.append(node('span','naka-sr',text),globalThis.NakaPixel.digits(text.replace(/[^0-9.,+\-–]/g,''),''));return s;};
  const deltaNode=pixels(delta);deltaNode.dataset.change=change(a.delta);
  total.append(node('span','naka-holdings__before',`${shn(a.before.weekly)} →`),pixels(after),deltaNode);
  row(c.totalRow,total,'naka-holdings__sum');
  box.append(node('p','naka-holdings__title',`${c.forMe} · ${c.weekUnit}`),rows);box.title=c.allocationBasis;return box;
 }
 /** About content shared by the popup tab and the extension page, built from the rule constants themselves:
  * the read-only promise, the weekly arithmetic, the weight rules and the data sources. */
 function about(c,R,version){
  const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const link=(text,href)=>{const a=node('a','',text);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
  const list=(items,cls)=>{const ul=node('ul',cls);for(const t of items)ul.append(node('li','',t));return ul;};
  const tiles=items=>{const box=node('div','naka-about__tiles');for(const [top,bottom] of items){const t=node('div','naka-about__tile');t.append(node('b','',top),node('span','',bottom));box.append(t);}return box;};
  const int=n=>n.toLocaleString('en-US'),W=R.RULES;
  const links=node('p','naka-about__links');links.append(link(c.openSource,GITHUB),node('span','',c.versionLine(version)));
  const formula=node('div','naka-about__formula');formula.append(node('code','',c.formulaWeek),node('code','',c.formulaRate));
  const ruleLinks=node('p','naka-about__links');ruleLinks.append(link(c.rules,W.rewardsSource),link(c.zeroSupplement,W.zeroListingSource));
  // Every action, grouped: what you do, what it means for this week and for later weeks.
  const groups=c.caseGroups.map(g=>{const box=node('section','naka-about__group'),list=node('dl','naka-about__cases');
   for(const [what,now,later,tone] of g.rows){const row=node('div','naka-about__case');row.dataset.tone=tone;
    const line=(tag,text)=>{const d=node('dd','');d.append(node('span','naka-about__tag',tag),node('span','',text));return d;};
    row.append(node('dt','',what),line(c.casesThis,now),line(c.casesLater,later));list.append(row);}
   box.append(node('h3','naka-about__group-title',g.title),list);return box;});
  const head=node('div','naka-about__case naka-about__case--head');head.setAttribute('aria-hidden','true');head.append(node('span','',c.casesWhat),node('span','',c.casesThis),node('span','',c.casesLater));
  return {
   cases:[node('p','',c.casesLead),head,...groups],
   safe:[list(c.safeList,'naka-about__checks'),links],
   alloc:[formula,list(c.allocLines,'naka-about__list')],
   rules:[node('p','naka-about__lead',c.rulesFormula),node('p','naka-about__label',c.traitTitle),tiles([...W.traitTiers].reverse().map(t=>[`+${t.pct}%`,`≥${t.num/t.den}×`])),
    node('p','naka-about__label',c.numberTitle),tiles(W.numberTiers.map(t=>[`+${t.pct}%`,`< ${int(t.below)}`])),node('p','',c.zeroRule),node('p','',c.scheduleRule(int(W.startBlock+1),int(W.weekBlocks),W.weeks)),ruleLinks],
   data:[node('p','',c.dataDetail)],
  };
 }
 /** A wanted post as Own a trait copies it: the lead-in of the language shown, then the numbers ascending, comma-separated
  * ("Want to buy 87, 826, 1466"). The same text pasted into any Add box imports those numbers (resolveNumbers). */
 const wantText=(c,numbers)=>`${c.wantPrefix} ${[...numbers].sort((a,b)=>a-b).join(', ')}`;
 // The lead-in of a wanted post in either language, as it opens a pasted entry (an optional colon after it).
 const WANT_LEAD=new RegExp(`^\\s*(?:${[copy.zh.wantPrefix,copy.en.wantPrefix].join('|')})\\s*[:：]?\\s*`,'i');
 /** Several Shielded numbers in one entry, separated by commas (, ， 、) or any whitespace: the Nakas found in `snap` that are
  * not already in `present`, in input order without repeats, and a reason for every entry that was skipped. A wanted post
  * pasted whole (its lead-in, then numbers) reads as its numbers. */
 function resolveNumbers(snap,raw,present,c,alreadyReason){
  const ids=[],skipped=[];
  for(const token of String(raw).replace(WANT_LEAD,'').replace(/#\s+(?=\d)/g,'#').split(/[,，、\s]+/).map(t=>t.trim()).filter(Boolean)){
   const q=globalThis.ShnakasLookup.query(snap,token);
   if(q.state==='invalid')skipped.push(c.skipInvalid(token));
   else if(q.state==='missing')skipped.push(c.skipMissing(q.number));
   else if(present.includes(q.id)||ids.includes(q.id))skipped.push(alreadyReason(q.number));
   else ids.push(q.id);
  }
  return {ids,skipped,empty:!ids.length&&!skipped.length};
 }
 /** Room for every number at once in a field that takes several (3,333 numbers of up to four digits, comma and space). */
 const LIST_MAX=20000;
 /** A field that takes several numbers is one line, and a single-line field drops the line breaks of a pasted list, joining
  * its numbers into one; a pasted list with line breaks has them turned into separators instead. */
 function listField(input){
  input.maxLength=LIST_MAX;
  input.addEventListener('paste',ev=>{
   const text=ev.clipboardData.getData('text/plain');if(!/[\r\n]/.test(text))return; // one line: the browser pastes it as it is
   ev.preventDefault();input.setRangeText(text.trim().replace(/\s*[\r\n]+\s*/g,', '),input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input',{bubbles:true}));
  });
 }
 /**
  * Where to buy or check one Naka: its collection page with the number in the hash. The content script scrolls the market
  * from the top down to a listed Naka's card (the page's own search for one not for sale) and reveals it with a card
  * effect, so its live state shows there among its neighbours (an item page opened alone does not, and its buy button then
  * fails for a piece just bought).
  */
 function marketFind(snap,id){return `https://ord-dropz.xyz/secondary/collections/${snap.collection.slug}#naka-find=${snap.items[id][0]}`;}
 root.NakaExploreUI={pick,paintCompare,shn,percent,holdingsLine,art,artStore,about,resolveNumbers,listField,wantText,marketFind,GITHUB,TELEGRAM};
})(globalThis);
