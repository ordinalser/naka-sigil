/** Shared English/Chinese copy and the add/remove control for market tools, popup lookup, comparison and local demo. */
(function(root){'use strict';const copy={
 en:{
  heading:'Find your Naka. Raise your weight.',intro:'See what your holdings earn each week, then compare listings by weight, ask and traits',page:'Shielded Nakas · Holdings & Compare',local:'Local snapshot',
  compare:'Compare',open:'Open comparison',market:'Open market ↗',colMarket:'View on market ↗',
  add:'＋ Compare',inCompare:'✓ In Compare',removeCompare:'✕ Remove',fullShort:'Full 4/4 · open Compare ↗',inCompareTag:'✓ Compare',
  addHint:'Add to Compare (up to four Nakas)',removeHint:'In Compare. Select to remove it.',
  full:'Compare already holds four Nakas. Remove one there to add another.',fullHere:'Four selected. Remove one above to add another.',
  already:n=>`#${n} is already in Compare.`,addError:'Could not save. Try again.',
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
  
  rules:'Rule sources',version:'Current on-chain reward rules',proof:'Base 100% + trait bonuses + highest number bonus, capped at 400%.',
  share:'No wallet connection, API key or upload needed.',
  holdings:'My holdings',holdingsNote:'Saved only on this device. You maintain it, and it can include Nakas held in other accounts.',
  
  holdingsEmpty:'Add your holdings to see your weekly allocation and how a purchase or delisting changes it.',holdingsMissing:'Some holdings are not in the current data.',
  weekly:'Est. weekly allocation',perWeek:v=>`${v} SHNAKAS / week`,gainWeek:v=>`${v} SHNAKAS / week`,ofPool:v=>`${v} of the weekly pool`,
  listedNoEarn:'Listed · earns nothing while listed',
  allocationBasis:'Official preview basis: 266,640 SHNAKAS a week shared by the weight units of all 3,333 pieces (100% = 4 units). Listed holdings earn nothing; a new holding counts from the next reward week. Not a payout guarantee.',
  boost:'Raise my weight',boostHint:'Listings that raise your weekly allocation if bought',boostEmpty:'Add holdings to use Raise my weight.',
  boostNote:'Listings that raise your weekly SHNAKAS · lowest ask first, fees excluded',sortGain:'Largest gain',sortAsk:'Lowest ask',noGain:'No listing in this view raises your allocation.',
  forMe:'For my holdings',weeklyNow:'Weekly now',weeklyAfterBuy:'Weekly after buying',weeklyAfterCancel:'Weekly after delisting',
  newNaka:'This Naka',affected:'Weight changes in your holdings',close:'Close',
  addHolding:'＋ My holdings',inHoldings:'✓ My holdings',holdingHint:'Add to My holdings (saved on this device)',holdingRemoveHint:'In My holdings. Select to remove it.',
  addVisible:n=>`＋ Add these ${n} Nakas to My holdings`,addRest:(n,k)=>`＋ Add the other ${n} (${k} already added)`,addedVisible:n=>`✓ All ${n} on this page are in My holdings`,openHoldings:'My holdings ↗',pieces:n=>`${n} ${n===1?'Naka':'Nakas'}`,
  bundledNote:'Historical data demo · example holdings · not live listings',
  navHome:'Holdings',compareSlotsLeft:n=>`＋ ${n} more can be compared`,numberPromptMulti:'e.g. 379, 1025, 1500',multiHint:'Separate numbers with commas or spaces.',skipInvalid:t=>`“${t}” is not a number`,skipMissing:n=>`#${n} is not in this block's data`,skipHeld:n=>`#${n} is already in My holdings`,skipCompared:n=>`#${n} is already in Compare`,skipFull:n=>`#${n}: Compare holds 4 at most`,addedSkipped:(n,list)=>`Added ${n}. Skipped: ${list.join('; ')}`,navBlock:'Block',stripStart:n=>`Start in ${n} blocks`,emptyTitle:'Add your first Naka',emptyText:'See how much SHNAKAS it earns each week.',emptyAdd:'＋ Add a number',emptyOr:'Or add a whole page at once',vaultLink:'Vault',walletLink:'Wallet holdings',emptyJumpNote:'Open one, go to Vault or Holdings, then press “＋ Add these Nakas to My holdings” on that page.',tilesTitle:n=>`All holdings (${n})`,allocTitleBlock:'Allocation at this block',perFull:'100% weight / week',perCap:'400% cap / week',unitsK:'All weight units (K)',poolWeek:'Pool / week',allocNote:v=>`One unit earns v = ${v} base units a block, from the official endpoint's formula.`,scheduleWeekN:n=>`Week ${n}`,scheduleEndBlock:'Last rewarded block',scheduleClaim:'Claim deadline',progressLabel:'Weeks completed',weeksDone:(n,t)=>`${n} / ${t}`,listAdd:'＋ Add',listedCount:n=>`${n} listed, not earning`,scheduleTitle:'Reward schedule',blocksN:n=>`${n} blocks`,weeksN:n=>`${n} weeks`,afterDelist:'If delisted',earnListed:'0',
  safeList:['Never connects to a wallet','No login, approval or signature','Reads only public market data and the numbers you add','Holdings, comparison and settings stay on this device','Open source: review it and build it yourself'],
  formulaWeek:'Weekly SHNAKAS = weight units × v × 1,008 ÷ 10⁸',formulaRate:'v = floor(26,664,000,000,000 ÷ 1,008 ÷ K)',
  allocLines:['100% weight = 4 units; K is the units of all 3,333 catalog pieces, minted or not','Only holdings not listed at the block count; a new or delisted holding counts from the next reward week','Matches the official weights endpoint block by block; before rewards start it is a preview, not a payout promise'],
  rulesFormula:'Total weight = base 100% + every trait bonus + the highest number bonus, capped at 400%',traitTitle:'Trait bonus · trait floor ÷ collection floor',numberTitle:'Number bonus · highest tier only',
  zeroRule:'A trait with no listing: at least 20 pieces +100%; fewer than 20 uses the median of its last 3 sales against the collection floor (two sales: their mean; one: that sale; none: +0%).',
  scheduleRule:(start,blocks,weeks)=>`Rewards run from block ${start}, ${blocks} blocks a week for ${weeks} weeks. A listed piece earns nothing while listed.`,pieceRow:w=>`This Naka · ${w}`,pieceRowCancel:w=>`This Naka once delisted · ${w}`,othersRow:'Your other holdings',unchanged:'unchanged',totalRow:'Total',navExplore:'Find & compare',navAbout:'About',safeTitle:'Read-only by design',forMeShort:v=>`For my holdings ${v} / week`,compareAddShort:'＋ Add',readOnlyTag:'Read-only, no signing',
  addHoldingPopup:'Add',raiseLink:'Raise weight ↗',raiseHint:'Listings ranked by how much they add to your weekly SHNAKAS, each with a Buy link',buyNow:'Buy ↗',buyHint:'Open this listing on the market',
  compareEmptyPopup:'Nothing to compare yet',compareHowPopup:'Tap here to enter numbers (comma-separated), or add from a market inspection.',compareOpen:'Full comparison with traits ↗',
  lookupHow:'Listed Nakas show their after-sale weight; unlisted ones show their holding weight.',blockChip:h=>`Block ${h}`,alreadyHeld:n=>`#${n} is already in My holdings.`,sharedTrait:n=>`Shared by ${n} held ${n===1?'Naka':'Nakas'}`,showAll:'Show all',zeroSupplement:'Zero-listing supplement',
  addHoldingTitle:'Add a holding',addCompareTitle:'Add to Compare',numberPrompt:'Shielded number, e.g. 379',confirmAdd:'Add',cancel:'Cancel',
  expandAll:n=>`Show all ${n}`,collapse:'Show less',tileHint:n=>`Check #${n}`,listedShort:'Listed · not earning',
  cancelLead:'If you delist it',buyLead:n=>`If you buy #${n}`,hoverMore:'Hover a listed holding to see what delisting changes.',
  tabListings:'Listings',aboutTitle:'About',aboutSafe:'Read-only and safe',aboutAlloc:'How the weekly figure is calculated',aboutRules:'Weight rules',aboutData:'Data and privacy',
  allocationFormula:'Each weight unit earns v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) base units per block, where K is the units of all 3,333 catalog pieces (100% = 4 units). A week is 1,008 blocks; 1 SHNAKAS = 10⁸ base units. This is the official weights endpoint\'s own arithmetic, so each figure equals the official per-block value × 1,008.',
  dataDetail:'Listings, sales and official weights come from the public Ord Dropz API; block times from a public block explorer. Artwork loads from the same public image URLs the official site uses. Holdings, comparison and settings stay on this device and are never uploaded.',
  versionLine:v=>`Version ${v} · Unlicense`,
  
  readOnlyDetail:'Naka Sigil only reads public market data and the numbers you add. It never connects to a wallet, asks you to log in, requests approval or signs anything. Holdings stay on this device.',
  openSource:'Open source ↗',openSourceHint:'Source code on GitHub',weekUnit:'SHNAKAS / week',sharePool:v=>`${v} of pool`,
  manage:'Manage ↗',listedTag:'Listed',blockBasis:h=>`Block ${h} · official preview basis`,
  holdingsPopupEmpty:'Add your Nakas to see your weekly SHNAKAS',holdingsPopupHow:'Type a number with ＋ Add, or add a whole page in your Vault or Wallet with one click.',
  pageHoldings:'Held on this page',pageWeekly:n=>`${n} ${n===1?'Naka':'Nakas'} on this page`,myHoldingsLine:(n,v)=>`My holdings: ${n} · ${v} SHNAKAS / week`,
  removeHolding:n=>`Remove #${n} from My holdings`,holdingsHow:'Use ＋ to add a number, or add every Naka shown in your Vault or Wallet with one click.'},
 zh:{
  heading:'找到你的 Naka，增加你的权重',intro:'先看持仓每周能分到多少 SHNAKAS，再按权重、挂价和属性比较挂单',page:'Shielded Nakas · 持仓与比较',local:'本地快照',
  compare:'比较',open:'打开比较页',market:'打开市场 ↗',colMarket:'前往市场 ↗',
  add:'＋ 加入比较',inCompare:'✓ 已加入比较',removeCompare:'✕ 移出比较',fullShort:'已满 4/4 · 去比较页 ↗',inCompareTag:'✓ 比较',
  addHint:'加入比较页（最多四枚）',removeHint:'已在比较中，点击移出。',
  full:'比较已满四枚，在比较页移除一枚后才能加入新的。',fullHere:'已选满四枚，移除上方一枚后可继续加入。',
  already:n=>`#${n} 已在比较中。`,addError:'保存失败，请重试。',
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
  
  rules:'规则来源',version:'当前链上奖励规则',proof:'基础 100% + 特征加成 + 最高编号加成，上限 400%。',
  share:'无需连接钱包、API key 或上传数据。',
  holdings:'我的持仓',holdingsNote:'只保存在本机，由你手动维护，可以包含其他账号里的 NFT。',
  
  holdingsEmpty:'添加你的持仓，查看每周分配，以及买入或撤单后的变化。',holdingsMissing:'部分持仓不在当前数据中。',
  weekly:'预计每周分配',perWeek:v=>`每周 ${v} SHNAKAS`,gainWeek:v=>`每周 ${v} SHNAKAS`,ofPool:v=>`占每周奖池 ${v}`,
  listedNoEarn:'挂单中 · 挂单期间不计分配',
  allocationBasis:'按官方预览口径：每周 266,640 SHNAKAS 按全部 3,333 枚的权重单位分配（100% = 4 单位）。挂单中的持仓不计；新买入的持仓从下一个奖励周开始计入。不构成发放承诺。',
  boost:'增加我的权重',boostHint:'买入后能增加你每周分配的挂单',boostEmpty:'先加入持仓，才能使用“增加我的权重”。',
  boostNote:'能增加你每周 SHNAKAS 的挂单 · 默认挂价从低到高，不含手续费',sortGain:'增加最多',sortAsk:'挂价最低',noGain:'当前范围内没有能增加你分配的挂单。',
  forMe:'对我的持仓',weeklyNow:'现在每周',weeklyAfterBuy:'买入后每周',weeklyAfterCancel:'撤单后每周',
  newNaka:'这一枚',affected:'持仓中权重有变化的',close:'关闭',
  addHolding:'＋ 我的持仓',inHoldings:'✓ 我的持仓',holdingHint:'添加到我的持仓（只保存在本机）',holdingRemoveHint:'已在我的持仓中，点击移出。',
  addVisible:n=>`＋ 将本页 ${n} 枚添加到我的持仓`,addRest:(n,k)=>`＋ 添加其余 ${n} 枚（已添加 ${k} 枚）`,addedVisible:n=>`✓ 本页 ${n} 枚都在我的持仓`,openHoldings:'我的持仓 ↗',pieces:n=>`${n} 枚`,
  bundledNote:'历史数据演示 · 示例持仓 · 不是当前挂单',
  navHome:'持仓',compareSlotsLeft:n=>`＋ 还可加入 ${n} 枚`,numberPromptMulti:'如 379, 1025, 1500',multiHint:'可一次输入多个编号，用英文逗号或空格分隔',skipInvalid:t=>`“${t}”不是有效编号`,skipMissing:n=>`#${n} 不在当前区块数据中`,skipHeld:n=>`#${n} 已在我的持仓`,skipCompared:n=>`#${n} 已在比较中`,skipFull:n=>`#${n} 超出比较上限 4 枚`,addedSkipped:(n,list)=>`已添加 ${n} 枚；跳过：${list.join('；')}`,navBlock:'区块',stripStart:n=>`距启动 ${n} 块`,emptyTitle:'添加你的第一枚 Naka',emptyText:'看看它每周能分到多少 SHNAKAS。',emptyAdd:'＋ 添加编号',emptyOr:'或一次添加整页',vaultLink:'金库',walletLink:'钱包持仓',emptyJumpNote:'打开后进入“金库”或“持仓”，点页面上的“＋ 将本页 N 枚添加到我的持仓”。',tilesTitle:n=>`全部持仓 (${n})`,allocTitleBlock:'本区块分配',perFull:'100% 权重 / 周',perCap:'400% 封顶 / 周',unitsK:'全目录权重单位 K',poolWeek:'每周奖池',allocNote:v=>`每个权重单位每块得到 v = ${v} 个最小单位，与官方接口算法一致。`,scheduleWeekN:n=>`第 ${n} 周`,scheduleEndBlock:'最后计奖区块',scheduleClaim:'领取截止区块',progressLabel:'已完成',weeksDone:(n,t)=>`${n} / ${t} 周`,listAdd:'＋ 添加',listedCount:n=>`${n} 枚挂单中，不计分配`,scheduleTitle:'奖励时间表',blocksN:n=>`${n} 块`,weeksN:n=>`${n} 周`,afterDelist:'撤单后',earnListed:'0',
  safeList:['从不连接钱包','无需登录、授权或签名','只读取公开市场数据和你添加的编号','持仓、比较和设置只保存在本机','代码开源，可以自行审查和编译'],
  formulaWeek:'每周 SHNAKAS = 权重单位 × v × 1,008 ÷ 10⁸',formulaRate:'v = floor(26,664,000,000,000 ÷ 1,008 ÷ K)',
  allocLines:['100% 权重 = 4 个权重单位；K 是全部 3,333 枚（含未铸造）的权重单位合计','只计区块时未挂单的持仓；新买入或撤单的持仓从下一个奖励周开始计入','与官方权重接口逐块一致；奖励启动前为预览，不构成发放承诺'],
  rulesFormula:'总权重 = 基础 100% + 各特征加成 + 编号加成（只取最高一档），封顶 400%',traitTitle:'特征加成 · 特征地板价 ÷ 集合地板价',numberTitle:'编号加成 · 只取最高一档',
  zeroRule:'特征没有挂单时：至少 20 件 +100%；不足 20 件按最近 3 笔成交价的中位数对比集合地板（两笔取平均、一笔取该笔、无成交 +0%）。',
  scheduleRule:(start,blocks,weeks)=>`奖励自区块 ${start} 起，每周 ${blocks} 块，共 ${weeks} 周；挂单期间不计奖励。`,pieceRow:w=>`这一枚 · ${w}`,pieceRowCancel:w=>`这一枚撤单后 · ${w}`,othersRow:'原有持仓',unchanged:'不变',totalRow:'合计',navExplore:'查询·比较',navAbout:'说明',safeTitle:'只读观察，天生安全',forMeShort:v=>`对我的持仓 每周 ${v}`,compareAddShort:'＋ 加入',readOnlyTag:'只读 · 无需登录、授权、签名',
  addHoldingPopup:'添加',raiseLink:'增加我的权重 ↗',raiseHint:'按能增加你每周 SHNAKAS 的多少排序挂单，每枚都可直接去购买',buyNow:'去购买 ↗',buyHint:'在市场打开这枚挂单',
  compareEmptyPopup:'还没有选择比较的 Naka',compareHowPopup:'点这里输入编号（多个用英文逗号分隔），也可以在市场悬浮明细中加入。',compareOpen:'查看完整比较（含特征）↗',
  lookupHow:'已挂单显示成交后权重，未挂单显示持有权重。',blockChip:h=>`区块 ${h}`,alreadyHeld:n=>`#${n} 已在我的持仓中。`,sharedTrait:n=>`持仓中 ${n} 枚共享此特征`,showAll:'显示全部',zeroSupplement:'零挂单补充规则',
  addHoldingTitle:'添加持仓',addCompareTitle:'加入比较',numberPrompt:'Shielded 编号，如 379',confirmAdd:'添加',cancel:'取消',
  expandAll:n=>`展开全部 ${n} 枚`,collapse:'收起',tileHint:n=>`查看 #${n} 的权重`,listedShort:'挂单中 · 不计分配',
  cancelLead:'如果撤单',buyLead:n=>`如果买入 #${n}`,hoverMore:'鼠标移到挂单中的持仓上，可查看撤单后的变化。',
  tabListings:'挂单',aboutTitle:'说明',aboutSafe:'只读与安全',aboutAlloc:'每周分配怎么算',aboutRules:'权重规则',aboutData:'数据与隐私',
  allocationFormula:'每个权重单位每块得到 v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) 个最小单位，K 为全目录 3,333 枚的权重单位合计（100% = 4 单位）。一周 1,008 块，1 SHNAKAS = 10⁸ 最小单位。这就是官方权重接口自己的算法，所以每个数字都等于官方每块数值 × 1,008。',
  dataDetail:'挂单、成交和官方权重来自 Ord Dropz 公开接口，区块时间来自公开区块浏览器；藏品图片使用官方网站同样的公开图片地址。持仓、比较和设置只保存在本机，从不上传。',
  versionLine:v=>`版本 ${v} · Unlicense 许可`,
  
  readOnlyDetail:'Naka Sigil 只读取公开市场数据和你自己添加的编号，从不连接钱包，不要求登录、授权或签名。持仓只保存在本机。',
  openSource:'开源代码 ↗',openSourceHint:'GitHub 上的源代码',weekUnit:'SHNAKAS / 周',sharePool:v=>`占奖池 ${v}`,
  manage:'管理 ↗',listedTag:'挂单中',blockBasis:h=>`区块 ${h} · 官方预览口径`,
  holdingsPopupEmpty:'添加你的 Naka，查看每周能分到多少 SHNAKAS',holdingsPopupHow:'点“＋ 添加”输入编号，或在金库、钱包页一键添加整页。',
  pageHoldings:'本页持仓',pageWeekly:n=>`本页 ${n} 枚`,myHoldingsLine:(n,v)=>`我的持仓 ${n} 枚 · 每周 ${v} SHNAKAS`,
  removeHolding:n=>`从我的持仓移除 #${n}`,holdingsHow:'点击“＋ 添加持仓”输入编号，或在金库、钱包页一键添加页面上显示的全部 Naka。'}};
 const pick=lang=>copy[lang==='zh'?'zh':'en'];
 const GITHUB='https://github.com/ordinalser/naka-sigil';
 /** Piece artwork from the public art endpoint the official site uses, then its Ordinals inscription, then the sigil. */
 function art(snap,id,fallbackClass){
  const img=document.createElement('img'),asset=snap.items[id][0]-snap.collection.numberStart;
  img.src=`https://shielded-api.ord-dropz.xyz/api/shielded/art/${asset}?c=${encodeURIComponent(snap.collection.cid)}`;img.alt=`Shielded #${snap.items[id][0]}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  let ordinals=false;img.addEventListener('error',()=>{if(!ordinals){ordinals=true;img.src=`https://ordinals.com/content/${id}`;}else img.replaceWith(globalThis.NakaPixel.sigil(fallbackClass));});
  return img;
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
  return {
   safe:[list(c.safeList,'naka-about__checks'),links],
   alloc:[formula,list(c.allocLines,'naka-about__list')],
   rules:[node('p','naka-about__lead',c.rulesFormula),node('p','naka-about__label',c.traitTitle),tiles([...W.traitTiers].reverse().map(t=>[`+${t.pct}%`,`≥${t.num/t.den}×`])),
    node('p','naka-about__label',c.numberTitle),tiles(W.numberTiers.map(t=>[`+${t.pct}%`,`< ${int(t.below)}`])),node('p','',c.zeroRule),node('p','',c.scheduleRule(int(W.startBlock+1),int(W.weekBlocks),W.weeks)),ruleLinks],
   data:[node('p','',c.dataDetail)],
  };
 }
 /** Several Shielded numbers in one entry, separated by commas or whitespace: the Nakas found in `snap` that are not already in
  * `present`, in input order without repeats, and a reason for every entry that was skipped. */
 function resolveNumbers(snap,raw,present,c,alreadyReason){
  const ids=[],skipped=[];
  for(const token of String(raw).replace(/#\s+(?=\d)/g,'#').split(/[,，\s]+/).map(t=>t.trim()).filter(Boolean)){
   const q=globalThis.ShnakasLookup.query(snap,token);
   if(q.state==='invalid')skipped.push(c.skipInvalid(token));
   else if(q.state==='missing')skipped.push(c.skipMissing(q.number));
   else if(present.includes(q.id)||ids.includes(q.id))skipped.push(alreadyReason(q.number));
   else ids.push(q.id);
  }
  return {ids,skipped,empty:!ids.length&&!skipped.length};
 }
 root.NakaExploreUI={pick,paintCompare,shn,percent,holdingsLine,art,about,resolveNumbers,GITHUB};
})(globalThis);
