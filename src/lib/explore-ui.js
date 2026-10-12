/** Shared English/Chinese copy and the add/remove control for market tools, popup lookup, comparison and local demo. */
(function(root){'use strict';const copy={
 en:{
  heading:'Find your Naka',intro:'Compare weight, ask and trait bonuses side by side',page:'Shielded Nakas · Compare',demo:'Interactive demo',local:'Local snapshot',
  compare:'Compare',open:'Open comparison',market:'Open market ↗',colMarket:'View on market ↗',
  add:'＋ Compare',inCompare:'✓ In Compare',removeCompare:'✕ Remove',fullShort:'Full 4/4 · open Compare ↗',inCompareTag:'✓ Compare',
  addHint:'Add to Compare (up to four Nakas)',removeHint:'In Compare. Select to remove it.',
  full:'Compare already holds four Nakas. Remove one there to add another.',fullHere:'Four selected. Remove one above to add another.',
  already:n=>`#${n} is already in Compare.`,addError:'Could not save. Try again.',
  lookup:'Add by Shielded number',find:'Add',placeholder:'Shielded number, e.g. 379',invalid:'Enter a valid Shielded number.',missing:'Not in the selected snapshot.',
  remove:'Remove',clear:'Clear',count:n=>`${n} / 4 selected`,load:'Use example selection',
  empty:'Choose up to four Nakas to compare',emptyHint:'Add a number here, or use ＋ Compare in a market inspection or the popup.',
  scroll:'Scroll sideways to see every column',preview:n=>`Enlarge Shielded #${n}`,
  total:'Total weight',after:'After sale',holding:'Holding formula',before:'Before-sale formula',ask:'Ask · BTC',askNote:'Selected-block ask, excluding fees; not a live quote.',
  noFloor:'No collection floor after sale',unavailable:'Unavailable',number:'Number bonus',price:'BTC',
  traitGuide:'Trait bonuses',legend:'↑ Bonus rises · ↓ Bonus falls · ◆ Price basis changes',
  listed:'Listed',unlisted:'Unlisted',unknown:'Listing unknown',
  independent:'Each column: one sale, other listings unchanged. Base 100% · cap 400%.',
  limits:'Formula at this block. Quarterly weights use the official snapshot block. No rewards while listed.',unknownNote:'Ranges reflect missing evidence; the upper end is not guaranteed.',
  filter:'After sale ≥',any:'Any weight',filterNote:'Listed NFTs in this loaded view only. A range passes only if its lower bound meets the minimum.',
  shown:(n,t)=>`${n} / ${t} loaded`,noMatches:'No matches loaded. Browse all in Compare.',
  browse:'Snapshot listings',browseNote:'Selected-block asks, lowest first, excluding fees.',
  demoNote:'Bundled snapshot demo. These are real snapshot calculations, not live listings.',
  basis:'Calculation basis',rules:'Rule sources',version:'Rules published 2026-10-08',proof:'Base 100% + trait bonuses + highest number bonus, capped at 400%.',
  share:'No wallet connection, API key or upload needed.'},
 zh:{
  heading:'找到你的 Naka',intro:'并排比较权重、挂价和属性加成',page:'Shielded Nakas · 比较',demo:'交互演示',local:'本地快照',
  compare:'比较',open:'打开比较页',market:'打开市场 ↗',colMarket:'前往市场 ↗',
  add:'＋ 加入比较',inCompare:'✓ 已加入比较',removeCompare:'✕ 移出比较',fullShort:'已满 4/4 · 去比较页 ↗',inCompareTag:'✓ 比较',
  addHint:'加入比较页（最多四枚）',removeHint:'已在比较中，点击移出。',
  full:'比较已满四枚，在比较页移除一枚后才能加入新的。',fullHere:'已选满四枚，移除上方一枚后可继续加入。',
  already:n=>`#${n} 已在比较中。`,addError:'保存失败，请重试。',
  lookup:'输入 Shielded 编号加入比较',find:'加入比较',placeholder:'输入 Shielded 编号，如 379',invalid:'请输入有效的 Shielded 编号。',missing:'所选区块快照未收录该编号。',
  remove:'移除',clear:'清空',count:n=>`已选 ${n} / 4`,load:'载入示例',
  empty:'选择至多四枚 Naka 进行比较',emptyHint:'在这里输入编号，或在市场悬浮明细、插件弹窗中点击“＋ 加入比较”。',
  scroll:'横向滑动查看全部列',preview:n=>`放大 Shielded #${n}`,
  total:'总权重',after:'成交后',holding:'持有公式值',before:'成交前公式值',ask:'挂单价格 · BTC',askNote:'所选区块挂单价格，不含费用；不是实时报价。',
  noFloor:'成交后集合地板不存在',unavailable:'无法计算',number:'编号加成',price:'BTC',
  traitGuide:'特征加成',legend:'↑ 加成上升 · ↓ 加成下降 · ◆ 价格依据变化',
  listed:'已挂单',unlisted:'未挂单',unknown:'挂单状态未知',
  independent:'每列仅成交该挂单，其他挂单不变。含基础 100%，封顶 400%。',
  limits:'所示区块公式值；季度权重按官方快照区块。挂单期间奖励为零。',unknownNote:'区间包含缺失的成交依据，不保证达到上限。',
  filter:'成交后 ≥',any:'不限权重',filterNote:'仅筛选当前已加载的挂单 NFT；区间按下限判断是否达标。',
  shown:(n,t)=>`${n} / ${t} 已加载`,noMatches:'已加载项无匹配，请在比较页查看全部快照挂单。',
  browse:'快照中的挂单',browseNote:'所选区块挂价从低到高，不含费用。',
  demoNote:'内置快照演示。数据按真实快照计算，不是实时挂单。',
  basis:'计算依据',rules:'规则来源',version:'规则发布于 2026-10-08',proof:'基础 100% + 特征加成 + 最高编号加成，上限 400%。',
  share:'无需连接钱包、API key 或上传数据。'}};
 const pick=lang=>copy[lang==='zh'?'zh':'en'];
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
 root.NakaExploreUI={pick,paintCompare};
})(globalThis);
