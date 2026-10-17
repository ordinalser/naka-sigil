'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),A=require('../src/lib/rewards'),R=require('../src/lib/rules');
const id=n=>String(n).padStart(64,'0')+'i0';
const raw=(over={})=>({w:0,height:971700,blocks:4,complete:false,base:'14566968',pieces:Array(3333).fill('14566968'),...over});
// rewardEvents [] : this week's records were read and hold no sale or reclaim of these pieces.
const snap={snapshot:{height:971704,collectionFloor:100},collection:{numberStart:0},traits:[],items:{[id(0)]:[0],[id(1)]:[1]},offers:[],rewardEvents:[]};
test('Official accumulator is decoded exactly, not approximated as current rate times elapsed blocks',()=>{const row=A.normalize(raw());assert.equal(row.height,971704);assert.equal(row.acc.length,35552);assert.equal(A.piece(row,1200),0.14566968);assert.equal(A.piece(row,3333),null);assert.equal(A.piece(row,-1),null);const altered=raw();altered.pieces[10]='58267872';assert.equal(A.piece(A.normalize(altered),10),0.58267872);});
test('Reject malformed week, height, size, integer, completion and packed data',()=>{for(const patch of [{w:78},{height:971701},{blocks:1009},{complete:true},{pieces:['4']},{base:'x'},{pieces:Array(3333).fill('-1')},{pieces:Array(3333).fill('18446744073709551616')}])assert.throws(()=>A.normalize(raw(patch)));assert.equal(A.table({...A.normalize(raw()),acc:'bad'}),null);});
test('A number alone yields a reference, not confirmed personal accrual or claimable balances',()=>{const out=A.portfolio(snap,[id(0),id(1)],A.normalize(raw()));assert.equal(out.reference,0.29133936);assert.equal(out.verified,false);assert.equal(out.confirmed,null);assert.equal(A.history(snap,[id(0),id(1)],{},{rows:{}},{},out.phase).weeks.length,0,'No completed week in week one');assert.equal(out.unverified,2);});
test('Only explicit official eligibility readings confirm this week; waiting and listed accrue zero',()=>{const observed={rows:{[id(0)]:{week:0,height:971704,state:'earning'},[id(1)]:{week:0,height:971704,state:'waiting'}}};const out=A.portfolio(snap,[id(0),id(1)],A.normalize(raw()),observed);assert.equal(out.verified,true);assert.equal(out.confirmed,0.14566968);assert.equal(out.rows[1].amount,0);const listed={...snap,offers:[[id(0),100]]};assert.equal(A.portfolio(listed,[id(0)],A.normalize(raw()),observed).confirmed,0);});
test('Old-week, future-block and private claim data are not invented or mixed into the current week',()=>{const row=A.normalize(raw()),later={...snap,snapshot:{...snap.snapshot,height:972709}};const out=A.portfolio(later,[id(0)],row,{rows:{[id(0)]:{week:0,height:971704,state:'earning'}}});assert.equal(out.state,'loading');assert.equal(A.history(later,[id(0)],{},null,{},out.phase).total,null,'Week one finished but its table and the records are not loaded: unknown, not zero');assert.equal(out.reference,null);assert.equal(A.portfolio({...snap,snapshot:{...snap.snapshot,height:971703}},[id(0)],row).reference,null);});
test('Current official lastBlock bonuses are accepted as published, not treated as missing sales',()=>{const r=R.evaluate({number:2000,traits:[{type:'Hair',value:'Rare',floor:null,listed:0,supply:1,officialSource:'lastBlock',officialPct:75}]},100);assert.equal(r.exact,true);assert.equal(r.lo.weight,175);assert.equal(r.traits[0].method,'official-lastBlock');});

test('Confirmed waiting eligibility does not project earnings during the paused reward week',()=>{
 const observed={rows:{[id(0)]:{week:0,height:971704,state:'waiting'}}};const data=A.portfolio(snap,[id(0)],A.normalize(raw()),observed);assert.equal(data.rows[0].paused,true);assert.equal(data.confirmed,0);assert.deepEqual(A.currentRate(snap,data),{lo:0,hi:0});
});

test('A holding bought or reclaimed after the week began earns nothing this week and starts the next (official engine)',()=>{
 // Engine: a note created at block h > start earns from week ceil((h − start) ÷ 1008); a spent note keeps only earlier weeks.
 const S=R.RULES.startBlock,W=R.RULES.weekBlocks,row=A.normalize(raw());
 const moved={...snap,rewardEvents:[[id(0),S+3,'sale']]},data=A.portfolio(moved,[id(0),id(1)],row);
 assert.equal(data.rows[0].status,'waiting');assert.equal(data.rows[0].startsWeek,2);assert.equal(data.rows[0].amount,0);
 assert.equal(data.rows[1].status,'earning');assert.equal(data.count.earning,1);assert.equal(data.count.waiting,1);
 assert.equal(data.reference,0.14566968,'Only the holding that counts this week accrues');
 // An exit at the very last block of a week still waits for the next week; one before the start counts from week 1.
 const edge={...snap,snapshot:{...snap.snapshot,height:S+W},rewardEvents:[[id(0),S+W,'cancel'],[id(1),S,'sale']]};
 const ctx=R.rewardContext(edge,id(0),'unlisted');assert.equal(ctx.state,'waiting');assert.equal(ctx.eligibleAt,S+W+1);
 assert.equal(R.rewardContext(edge,id(1),'unlisted').state,'unverified');
 const rate=A.currentRate(moved,data),steady=A.steadyRate(moved,data);assert.ok(steady.lo>rate.lo,'The weekly rate includes the holding that starts next week');
});

test('Listed holdings earn nothing; the projection adds only the current rate for blocks left in the week',()=>{
 const listed={...snap,offers:[[id(1),100]]},data=A.portfolio(listed,[id(0),id(1)],A.normalize(raw()));
 assert.equal(data.rows[1].status,'listed');assert.equal(data.rows[1].amount,0);
 const rate=A.currentRate(listed,data),p=A.projection(data,rate);assert.equal(p.lo,data.reference+rate.lo*(1008-4)/1008);
 // The latest block's payout is the exact per-block figure (units × v ÷ 10^8) behind the weekly rate, earning holdings only.
 const block=A.blockRate(listed,data),u=R.units(R.evaluateSnapshot(listed,id(0))),v=R.unitRate(R.programmeUnits(listed).lo);
 assert.equal(block.lo,u.lo*v/1e8);assert.ok(Math.abs(block.lo*1008-rate.lo)<1e-9);
 assert.equal(A.projection({...data,state:'loading'},rate),null);
 // My listing someone has bought (confirming) or that I am reclaiming says so; it still earns nothing this block.
 for(const [kind,zh,en] of [['sale','成交中','Selling'],['cancel','撤单中','Reclaiming']]){const closing={...listed,closing:[[id(1),kind]]},r=A.reason(closing,id(1));
  assert.equal(r.closing,kind);assert.ok(A.explain(r,'zh').short.startsWith(zh));assert.ok(A.explain(r,'en').short.startsWith(en));assert.equal(A.portfolio(closing,[id(1)],A.normalize(raw())).rows[0].status,'listed');}
});

test('Each reason names the blocks and the week it counts from; a wallet reading only narrows a public "held"',()=>{
 const S=R.RULES.startBlock,row=A.normalize(raw());
 const s={...snap,rewardEvents:[[id(0),S+3,'sale',S+1]],listedAt:[[id(1),S+2]],offers:[[id(1),100]]};
 const data=A.portfolio(s,[id(0),id(1)],row,{rows:{[id(0)]:{week:0,height:S+4,state:'earning'}}});
 const sold=A.explain(data.rows[0].reason,'zh'),listed=A.explain(data.rows[1].reason,'zh');
 assert.match(sold.full,/区块 971,701 挂单（第 1 周）、区块 971,703 成交/);assert.match(sold.full,/第 2 周（区块 972,709 起）/);assert.equal(data.rows[0].status,'waiting');
 assert.match(listed.full,/区块 971,702 挂单（第 1 周）：挂单那一周整周没有奖励（挂单前的区块也没有）/);
 const held=A.explain(A.portfolio(snap,[id(0)],row).rows[0].reason,'en');assert.match(held.full,/week 1, blocks 971,701–972,708/);
 const past=A.portfolio(snap,[id(0)],row,{rows:{[id(0)]:{week:0,height:S+4,state:'past'}}});assert.equal(past.rows[0].status,'gone');assert.equal(past.rows[0].amount,0);
});

test('Week share is accrued over the pool issued so far; average weight comes from the piece accumulator',()=>{
 const data=A.portfolio(snap,[id(0)],A.normalize(raw()));
 assert.equal(A.weekShare(data),0.14566968/(R.RULES.poolPerWeek*4/1008));assert.equal(data.rows[0].avg,100,'every piece equals the base accumulator in this fixture');
 const twice=raw();twice.pieces[0]=String(14566968*2);assert.equal(A.portfolio(snap,[id(0)],A.normalize(twice)).rows[0].avg,200);
});

test('Completed weeks use official tables only: each holding counts its own run, left pieces their kept weeks',()=>{
 const S=R.RULES.startBlock,Wb=R.RULES.weekBlocks;
 // Week w pays every piece (w+1)·1e8 + its index, so a wrong piece or week shows up.
 const full=w=>A.normalize({w,height:S+w*Wb,blocks:Wb,complete:true,base:'100000000',pieces:Array.from({length:3333},(_,i)=>String((w+1)*1e8+i))});
 const v=(w,i)=>((w+1)*1e8+i)/1e8,tables=n=>Object.fromEntries(Array.from({length:n},(_,w)=>[w,full(w)]));
 const items={...snap,items:{[id(0)]:[0],[id(1)]:[1],[id(5)]:[5],[id(6)]:[6],[id(3)]:[3]}},at=h=>({...items,snapshot:{...snap.snapshot,height:h}}),phase=s=>R.rewardPhase(s.snapshot);
 const meta={[id(0)]:{anchor:S+100,listedAt:null},[id(1)]:{anchor:S+100,listedAt:null},[id(5)]:{anchor:S+3*Wb+20,listedAt:S+3*Wb+10},[id(6)]:{anchor:S+4*Wb,listedAt:null}};
 // id(0) bought in week 1 (from week 2); id(1) never traded; id(5) listed in week 4 and still listed; id(6) listed in week 3,
 // reclaimed in week 4 (back from week 5).
 const events={height:S+5*Wb,rows:{[id(0)]:[[0,S+10,S+19,'sale']],[id(1)]:[],[id(5)]:[[5,S+3*Wb+10,null,'active']],[id(6)]:[[6,S+2*Wb+5,S+3*Wb+7,'cancel']]}};
 const s5=at(S+5*Wb+5),h=A.history(s5,[id(0),id(1),id(5),id(6)],{},events,tables(5),phase(s5),meta);
 assert.deepEqual(h.weeks.map(x=>x.pieces),[3,4,3,2,3],'week 1: no id(0); week 3: id(6) listed; week 4: only id(0) and id(1); week 5: id(6) is back');
 assert.equal(h.weeks[3].amount,v(3,0)+v(3,1),'listing weeks pay nobody');
 assert.equal(h.total,h.weeks.reduce((a,x)=>a+x.amount,0));
 // Records that do not reach the last finished week's last block: unknown, not guessed.
 assert.equal(A.history(s5,[id(1)],{},{...events,height:S+5*Wb-1},tables(5),phase(s5),meta).total,null);
 // A sale the owner has not attributed: both sides' weeks are unknown until they answer.
 const sold=[[0,S+2*Wb+3,S+2*Wb+9,'sale']],unclear=A.history(s5,[id(0)],{},{height:S+5*Wb,rows:{[id(0)]:sold}},tables(5),phase(s5),{[id(0)]:{anchor:S+2*Wb+5,listedAt:S+2*Wb+3}});
 assert.deepEqual(unclear.weeks.map(x=>x.unknown),[1,1,0,1,1]);assert.equal(unclear.total,null);
 // Weeks the wallet showed a private move are left out.
 const gap=A.history(s5,[id(1)],{},events,tables(5),phase(s5),{[id(1)]:{anchor:S+100,listedAt:null,gaps:[2]}});assert.deepEqual(gap.weeks.map(x=>x.pieces),[1,1,0,1,1]);
 // Left: a sale run (weeks from its records) and a private exit run; an old entry without weeks is unknown until re-read.
 const left={[id(3)]:{number:3,runs:[{listedAt:S+Wb+50,soldAt:S+Wb+60,weeks:[[0,0]],source:'sale'}]}},hl=A.history(s5,[],left,events,tables(5),phase(s5),{});
 assert.deepEqual(hl.left.map(x=>[x.number,x.weeks,x.amount]),[[3,1,v(0,3)]]);assert.deepEqual(hl.weeks.map(x=>x.pieces),[1,0,0,0,0]);
 const old=A.history(s5,[],{[id(3)]:{number:3,listedAt:S+Wb+50,soldAt:S+Wb+60,firstWeek:0,lastWeek:0}},events,tables(5),phase(s5),{});assert.equal(old.left[0].amount,null);assert.equal(old.total,null);
 assert.equal(A.weeks({format:1,weeks:{0:full(0)}})[0].week,0);assert.deepEqual(A.weeks({format:1,weeks:{0:full(0),1:full(0)}}),{0:full(0)},'an invalid row is left out, valid ones kept');
});

test('Before launch a listed holding is listed, not counted from week 1 or in the weekly rate',()=>{
 const S=R.RULES.startBlock,s={...snap,snapshot:{height:S-100,collectionFloor:100},offers:[[id(1),100]],listedAt:[[id(1),S-500]]},row=null;
 const data=A.portfolio(s,[id(0),id(1)],row);
 assert.deepEqual(data.rows.map(r=>r.status),['idle','listed']);assert.equal(data.count.idle,1);assert.equal(data.count.listed,1);
 const steady=A.steadyRate(s,data),one=R.weeklyAllocation(R.units(R.evaluateSnapshot(s,id(0))),R.programmeUnits(s));assert.deepEqual(steady,one,'only the unlisted holding counts');
 const e=A.explain(data.rows[1].reason,'zh');assert.match(e.full,/奖励启动前/);assert.doesNotMatch(e.full,/第 -?\d+ 周）/);
 assert.match(A.explain(data.rows[1].reason,'en').full,/before rewards started/);
});

test('A listing made before launch never shows a week 0 or below; buying now counts from the block after the snapshot',()=>{
 const S=R.RULES.startBlock,W=R.RULES.weekBlocks,s={...snap,snapshot:{height:S+500,collectionFloor:100},offers:[[id(1),100]],listedAt:[[id(1),S-900]]};
 for(const lang of ['zh','en'])for(const action of [null,'sale','cancel']){const e=A.explainFor(s,id(1),lang,action);for(const m of `${e.short} ${e.full}`.matchAll(/week (-?\d+)|第 (-?\d+) 周/g))assert.ok(Number(m[1]??m[2])>=1,`${lang} ${action}: ${m[0]}`);}
 // The last block of week 1: a purchase now confirms in week 2 at the earliest, so it counts from week 3.
 const last={...s,snapshot:{height:S+W,collectionFloor:100}};assert.match(A.explainFor(last,id(1),'en','sale').short,/week 3/);
 // At the start block a purchase confirms after it: week 2.
 assert.match(A.explainFor({...s,snapshot:{height:S,collectionFloor:100}},id(1),'en','sale').short,/week 2/);
 // Before: confirmed by the start block, week 1.
 assert.match(A.explainFor({...s,snapshot:{height:S-10,collectionFloor:100}},id(1),'en','sale').short,/week 1/);
});

test('Undecided weeks: records not read this week, or a piece minted after the start, are unknown, not earning',()=>{
 const noEvents={...snap};delete noEvents.rewardEvents;
 const d=A.portfolio(noEvents,[id(0)],A.normalize(raw()));assert.equal(d.rows[0].status,'unknown');assert.equal(d.rows[0].amount,null);assert.equal(d.verified,false);
 const late={...snap,items:{...snap.items,[id(1612)]:[1612]}},l=A.portfolio(late,[id(1612)],A.normalize(raw()));assert.equal(l.rows[0].status,'unknown');
 // A late mint bought publicly in an earlier week counts.
 const S=R.RULES.startBlock,later={...late,snapshot:{...late.snapshot,height:S+1008+5}},rows=A.normalize({...raw(),w:1,height:S+1008,blocks:5});
 assert.equal(A.portfolio(later,[id(1612)],rows,null,{rows:{[id(1612)]:[[1612,S+50,S+60,'sale']]}}).rows[0].status,'earning');
});

test('Wallet readings: last-week waiting has no later week, a "before" reading is no reading, labels only claim checks made',()=>{
 const S=R.RULES.startBlock,W=R.RULES.weekBlocks,lastWeek={...snap,snapshot:{...snap.snapshot,height:S+77*W+5}};
 const row=A.normalize({...raw(),w:77,height:S+77*W,blocks:5}),ob={rows:{[id(0)]:{week:77,height:S+77*W+3,state:'waiting'}}};
 const d=A.portfolio(lastWeek,[id(0)],row,ob);assert.equal(d.rows[0].status,'ended');assert.deepEqual(A.steadyRate(lastWeek,d),{lo:0,hi:0});
 const before=A.portfolio(snap,[id(0)],A.normalize(raw()),{rows:{[id(0)]:{week:0,height:971704,state:'before'}}});assert.equal(before.rows[0].status,'earning');assert.equal(before.readings,0);
 const listedOnly=A.portfolio({...snap,offers:[[id(0),100]]},[id(0)],A.normalize(raw()));assert.equal(listedOnly.verified,true);assert.equal(listedOnly.readings,0,'no wallet check was used');
});
