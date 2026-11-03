/**
 * The weight inspection bubble, shared by the market pages (content script) and the extension page so both behave the
 * same: it opens for the anchor under the pointer, under keyboard focus or tapped; it touches its anchor, takes the side
 * with room and draws a tail toward the anchor.
 * A hover card is for a look: it closes once the pointer has left both the anchor and the card, and the next anchor the
 * pointer reaches opens its own card. On its way from the anchor to the card the pointer may cut across what lies beside
 * the anchor: while it stays inside the corridor from where it left the anchor to the card (the convex hull of that exit
 * point and the card), the card stays open and nothing on the way opens; leaving the corridor ends the crossing at once,
 * resting in it ends it after REST ms. Once the pointer is on the card (or a press or the focus is in it), the card stays
 * where it is: what the viewer does there or what the page redraws (a fold opening, rows arriving, a button relabelled,
 * newer data) changes its content, never its place. It grows downward, and newer data waits behind a notice at its
 * bottom edge instead of replacing what is being read. A clicked card (the anchor clicked, or Enter or Space on it)
 * stays until dismissed (×, Escape, a click outside). Styles: content/content.css (.shn-pop).
 */
(function(root){
 'use strict';
 const SVG='http://www.w3.org/2000/svg';
 // The corridor: the exit point widened by PAD px along the anchor's edge, as Radix Tooltip's grace area does; a pointer
 // resting in it for REST ms is not heading for the card (Floating UI's safePolygon closes after 40 ms at rest, Radix
 // never while inside; REST lets a hand slow down near the card and still feels immediate).
 const PAD=5,REST=100;
 function viewportRect(){
  const view=root.visualViewport;
  const v={left:view?.offsetLeft??0,top:view?.offsetTop??0,
   width:Math.min(document.documentElement.clientWidth,innerWidth,view?.width??Infinity),
   height:Math.min(document.documentElement.clientHeight,innerHeight,view?.height??Infinity)};
  v.right=v.left+v.width;v.bottom=v.top+v.height;return v;
 }
 /** Convex hull of [x, y] points (Andrew's monotone chain). */
 function hull(points){
  const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lower=[],upper=[];
  for(const q of p){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],q)<=0)lower.pop();lower.push(q);}
  for(const q of p.reverse()){while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],q)<=0)upper.pop();upper.push(q);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
 }
 /** Whether [x, y] lies inside the polygon (even-odd rule). */
 function within([x,y],poly){
  let hit=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}
  return hit;
 }
 /**
  * options: selector (anchors), id (bubble element id), build(anchor) → {className, nodes} (null: nothing to show),
  * target(anchor) → element the tail centres on, raise(anchor) → px the anchor's hover area extends above it,
  * identity(anchor) → string (the piece first, before a '|'); validate() follows the page's redraws: a card in use (clicked,
  * or the pointer or focus on it) keeps its view (offering newer data, or saying its piece left the list); a hover card
  * not yet reached moves to the badge redrawn in its anchor's place for the same piece, and closes when its anchor left
  * the page or now shows another piece.
  */
 function create({selector,id,build,target,raise,identity}){
  let pop=null,anchor=null,key=null,viewport=null,pinned=false,restoring=false,suppressPreview=false,rebuilding=false,held=null,lastRect=null;
  // still: the place a card keeps once the viewer uses it (left, top, its height limit and content height then, its side
  // and its anchor's place then); null while a hover card follows its anchor. transit: the pointer crossing from the anchor
  // to the card (the padded exit points, where the pointer is, the rest timer).
  let still=null,transit=null,last=null;
  const resize=new ResizeObserver(()=>{if(anchor)position();});
  const shown=()=>Boolean(pop?.classList.contains('shn-pop--show'));
  function arrive(){if(transit){clearTimeout(transit.timer);transit=null;}}
  function hide(){
   arrive();
   if(!pop)return;
   pop.classList.remove('shn-pop--show');anchor?.removeAttribute('aria-describedby');anchor?.removeAttribute('data-shn-open');
   resize.disconnect();anchor=null;key=null;viewport=null;pinned=false;still=null;held=null;lastRect=null;
  }
  /** Moves an open bubble to the badge the page drew for its piece in place of its anchor. */
  function retarget(next){
   anchor.removeAttribute('data-shn-open');anchor.removeAttribute('aria-describedby');anchor=next;anchor.setAttribute('data-shn-open','true');anchor.setAttribute('aria-describedby',pop.id);
   resize.disconnect();resize.observe(pop.querySelector('.shn-pop__surface'));resize.observe(anchor);
  }
  const zh=()=>document.documentElement.lang.startsWith('zh');
  const contentHeight=surface=>{const css=getComputedStyle(surface);return Math.ceil(surface.scrollHeight+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth));};
  function dismiss(){const restore=anchor,inside=pop?.contains(document.activeElement);restoring=true;suppressPreview=true;hide();if(inside&&restore?.isConnected)restore.focus({preventScroll:true});restoring=false;}
  /** From now on the card keeps its place: the viewer is on it, pressed in it, moved the focus into it or clicked its anchor. */
  function hold(){
   if(still||!anchor)return;
   const surface=pop.querySelector('.shn-pop__surface');
   still={left:parseFloat(pop.style.left),top:parseFloat(pop.style.top),cap:parseFloat(surface.style.maxHeight),base:contentHeight(surface),height:pop.offsetHeight,side:held,anchorRect:anchor.getBoundingClientRect()};
  }
  function pin(){arrive();pinned=true;if(pop){pop.setAttribute('role','dialog');pop.setAttribute('aria-label',zh()?'藏品详情':'Piece details');pop.classList.add('shn-pop--pinned');pop.querySelector('.shn-pop__tools').hidden=false;hold();position();}}
  function show(a,{pin:keep=true,at:place=null,side:keepSide=null}={}){
   if(anchor===a&&key===identity(a)&&shown()){if(keep)pin();return;}
   if(anchor)hide();
   held=keepSide;
   const content=build(a);if(!content)return;
   if(!pop){pop=document.createElement('div');pop.id=id;pop.setAttribute('role','tooltip');pop.tabIndex=0;document.body.appendChild(pop);}
   a.setAttribute('aria-describedby',pop.id);anchor=a;key=identity(a);
   const surface=document.createElement('div');surface.className='shn-pop__surface';surface.append(...content.nodes);
   const pointer=document.createElement('span');pointer.className='shn-pop__pointer';pointer.setAttribute('aria-hidden','true');
   const svg=document.createElementNS(SVG,'svg'),group=document.createElementNS(SVG,'g');
   for(const cls of ['shn-pop__pointer-fill','shn-pop__pointer-edge']){const path=document.createElementNS(SVG,'path');path.setAttribute('class',cls);group.append(path);}
   svg.append(group);pointer.append(svg);const tools=document.createElement('div');tools.className='shn-pop__tools';tools.hidden=true;const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',zh()?'关闭':'Close');close.className='shn-pop__close';close.addEventListener('click',dismiss);tools.append(close);rebuilding=true;pop.replaceChildren(surface,pointer,tools);rebuilding=false;
   pop.setAttribute('role','tooltip');pop.className=`shn-pop ${content.className}`;a.setAttribute('data-shn-open','true');
   // A card refreshed to newer data keeps the place it had.
   still=place;
   if(!position())return;
   pop.classList.add('shn-pop--show');if(keep)pin();resize.disconnect();resize.observe(surface);resize.observe(a);
  }
  /** The badge among these nearest to where the anchor last was. */
  function nearest(list){
   const x=(lastRect.left+lastRect.right)/2,y=(lastRect.top+lastRect.bottom)/2;let best=null,d=Infinity;
   for(const b of list){const r=b.getBoundingClientRect(),dd=((r.left+r.right)/2-x)**2+((r.top+r.bottom)/2-y)**2;if(dd<d){d=dd;best=b;}}
   return best;
  }
  function validate(){
   if(!anchor)return;
   const asset=key.split('|')[0];
   if(pinned||still){
    // A card in use keeps its displayed block until explicitly refreshed or dismissed, and stays with its piece: with the
    // anchor while that still shows the piece, else with the piece's badge nearest the anchor's last place.
    const all=[...document.querySelectorAll(selector)].filter(b=>identity(b).split('|')[0]===asset);
    const replacement=all.includes(anchor)?anchor:all.length?nearest(all):null;
    if(replacement&&replacement!==anchor)retarget(replacement);
    // The notices go at the end of the card and stick to its bottom edge: nothing the viewer may be about to click moves.
    const surface=pop.querySelector('.shn-pop__surface'),notice=()=>{let box=surface.querySelector(':scope>.shn-pop__notice');if(!box){box=document.createElement('div');box.className='shn-pop__notice';surface.append(box);}return box;};
    if(replacement&&identity(replacement)!==key&&!pop.querySelector('.shn-pop__refresh')){const refresh=document.createElement('button');refresh.type='button';refresh.className='shn-pop__refresh';refresh.textContent=zh()?'数据已更新 · 刷新此卡':'Data updated · refresh this card';refresh.addEventListener('click',()=>{const open=[...pop.querySelectorAll('details[open]')].map(d=>d.className),scroll=pop.querySelector('.shn-pop__surface').scrollTop;show(anchor,{pin:pinned,at:still,side:still.side});for(const d of pop.querySelectorAll('details'))if(open.includes(d.className))d.open=true;position();pop.querySelector('.shn-pop__surface').scrollTop=scroll;});notice().append(refresh);}
    let gone=surface.querySelector('.shn-pop__gone');if(!replacement&&!gone){gone=document.createElement('span');gone.className='shn-pop__gone';gone.textContent=zh()?'已离开当前列表 · 保留此卡':'No longer in this list · saved view';notice().prepend(gone);}else if(replacement)gone?.remove();
    const box=surface.querySelector(':scope>.shn-pop__notice');if(box&&!box.childElementCount)box.remove();
    position();return;
   }
   if(anchor.isConnected&&identity(anchor)===key){position();return;}
   // The page redrew the badge (a list re-render, newer data) before the pointer reached the card: the card stays with the
   // same piece when it was drawn in the same place, showing that badge's card; anything else (another piece there, the
   // piece moved away or gone) closes it.
   const at=lastRect,inPlace=b=>{const r=b.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;return x>=at.left-2&&x<=at.right+2&&y>=at.top-2&&y<=at.bottom+2;};
   const next=[...document.querySelectorAll(selector)].find(b=>identity(b).split('|')[0]===asset&&inPlace(b));
   if(!next){hide();return;}
   if(identity(next)===key){if(next!==anchor)retarget(next);position();return;}
   // Redrawn with newer data: the new card opens in the same place, and a crossing toward it goes on.
   const crossing=transit;transit=null;
   show(next,{pin:false,side:held});
   if(crossing&&shown()){transit=crossing;track(crossing.x,crossing.y);}
  }
  function closeOnViewportChange(){
   if(!anchor||!viewport)return;
   const v=viewportRect();if(['left','top','width','height'].some(k=>v[k]!==viewport[k])){if(pinned)position();else hide();}
  }
  function position(){
   // The bubble touches its anchor (G=0), so the pointer moves straight from anchor to bubble with no gap to cross.
   const M=8,G=0,v=viewportRect();viewport=v;
   const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
   const visibleRect=node=>{
    const r=node.getBoundingClientRect(),out={left:Math.max(r.left,v.left),right:Math.min(r.right,v.right),top:Math.max(r.top,v.top),bottom:Math.min(r.bottom,v.bottom)};
    for(let parent=node.parentElement;parent&&parent!==document.documentElement;parent=parent.parentElement){
     const css=getComputedStyle(parent),p=parent.getBoundingClientRect();
     if(/auto|scroll|hidden|clip/.test(css.overflowX)){out.left=Math.max(out.left,p.left+parent.clientLeft);out.right=Math.min(out.right,p.left+parent.clientLeft+parent.clientWidth);}
     if(/auto|scroll|hidden|clip/.test(css.overflowY)){out.top=Math.max(out.top,p.top+parent.clientTop);out.bottom=Math.min(out.bottom,p.top+parent.clientTop+parent.clientHeight);}
    }
    return out;
   };
   const surface=pop.querySelector('.shn-pop__surface');
   if(anchor.isConnected)lastRect=anchor.getBoundingClientRect();
   if(still){
    // A card in use stays where it was (a clicked card is only kept inside a changed viewport).
    const width=Math.max(1,Math.floor(Math.min(420,v.width-2*M))),left=pinned?clamp(still.left,v.left+M,v.right-width-M):still.left,top=pinned?clamp(still.top,v.top+M,v.bottom-M-60):still.top;
    pop.style.width=width+'px';pop.style.left=left+'px';pop.style.top=top+'px';pop.dataset.shnSide=still.side;
    // It grows downward to the viewport's edge once its content grows (a fold opened, rows arrived), never before: taking
    // hold of a card changes nothing about it. Nor while growing would pull the viewer's scrolled place back (a scrolled
    // card with too little content below to fill the extra height): then it grows later, once there is content to show.
    const room=Math.max(1,Math.floor(v.bottom-M-top)),limit=contentHeight(surface)>still.base?room:Math.min(still.cap,room),was=surface.style.maxHeight,scroll=surface.scrollTop;
    surface.style.maxHeight=limit+'px';if(parseFloat(was)<limit&&surface.scrollTop!==scroll){surface.style.maxHeight=was;surface.scrollTop=scroll;}
    // The tail stays while the card still meets its anchor as it did: both where they were, and a card above its anchor not
    // grown down over it.
    const r=anchor.getBoundingClientRect(),was0=still.anchorRect,h=pop.offsetHeight;
    const meets=anchor.isConnected&&left===still.left&&top===still.top&&Math.abs(r.left-was0.left)<0.5&&Math.abs(r.top-was0.top)<0.5&&Math.abs(r.right-was0.right)<0.5&&Math.abs(r.bottom-was0.bottom)<0.5&&(still.side!=='bottom'||Math.abs(h-still.height)<0.5);
    if(meets){const a=visibleRect(anchor);a.top=Math.max(v.top,a.top-raise(anchor));drawTail(still.side,a,pop.offsetWidth,h);}
    else{pop.querySelector('.shn-pop__pointer').style.display='none';pop.dataset.shnTail='none';}
    return true;
   }
   const a=visibleRect(anchor),centre=target(anchor);let t=visibleRect(centre??anchor);
   if(a.right<=a.left||a.bottom<=a.top){hide();return false;}
   a.top=Math.max(v.top,a.top-raise(anchor));
   if(t.right<=t.left||t.bottom<=t.top)t=a;
   pop.style.width=`${Math.max(1,Math.floor(Math.min(420,v.width-2*M)))}px`;
   const w=pop.offsetWidth,natural=contentHeight(surface);
   const room={bottom:a.top-v.top-M-G,top:v.bottom-M-a.bottom-G,right:a.left-v.left-M-G,left:v.right-M-a.right-G};
   // An open preview keeps the side it opened on while its content changes size (artwork decoding, rows arriving), so the
   // part under the pointer does not jump across the anchor; it moves only when that side has no usable room left.
   const KEEP=120,usable=s=>s==='top'||s==='bottom'?room[s]>=Math.min(natural,KEEP):w<=room[s];
   const side=held!==null&&usable(held)?held:natural<=room.bottom?'bottom':natural<=room.top?'top':w<=room.right?'right':w<=room.left?'left':room.bottom>=room.top?'bottom':'top';
   held=side;
   const limit=Math.max(1,Math.floor(Math.min(v.height-2*M,side==='top'||side==='bottom'?room[side]:v.height-2*M)));
   surface.style.maxHeight=`${limit}px`;
   const h=pop.offsetHeight,cx=(t.left+t.right)/2,cy=(t.top+t.bottom)/2;
   // Round toward the anchor so the shared edge never opens a sub-pixel gap.
   const left=side==='right'?Math.ceil(a.left-w):side==='left'?Math.floor(a.right):Math.round(clamp(cx-w/2,v.left+M,v.right-w-M));
   const top=side==='bottom'?Math.ceil(a.top-h):side==='top'?Math.floor(a.bottom):Math.round(clamp(cy-h/2,v.top+M,v.bottom-h-M));
   pop.style.left=`${left}px`;pop.style.top=`${top}px`;pop.dataset.shnSide=side;
   drawTail(side,a,w,h);
   return true;
  }
  /**
   * Speech-bubble tail beside the anchor on the shared edge, curling toward it. Canonical shape in (u along the edge,
   * n outward) units: base u 0..11 on the edge, tip at u 17, n 12. It goes before the anchor when the bubble edge has
   * room there, otherwise after it (mirrored); with no room on either side the bubble needs no tail.
   */
  function drawTail(side,a,w,h){
   const pointer=pop.querySelector('.shn-pop__pointer'),svg=pointer.firstChild,[fill,edge]=svg.firstChild.children;
   const rect=pop.getBoundingClientRect(),vertical=side==='top'||side==='bottom',span=vertical?w:h,CLEAR=10;
   const near=vertical?a.left-rect.left:a.top-rect.top,far=vertical?a.right-rect.left:a.bottom-rect.top;
   const before=near-19,after=far+19;
   let s0,dir;
   if(before>=CLEAR){s0=before;dir=1;}
   else if(after<=span-CLEAR){s0=after;dir=-1;}
   else{pointer.style.display='none';pop.dataset.shnTail='none';return;}
   const map=(u,n)=>{const p=s0+dir*u;return side==='bottom'?[p,h+n]:side==='top'?[p,-n]:side==='right'?[w+n,p]:[-n,p];};
   const pt=(u,n)=>map(u,n).map(x=>Math.round(x*10)/10).join(' ');
   const curve=`M${pt(0,0)}C${pt(2,6)} ${pt(8,11)} ${pt(17,12)}C${pt(12,8)} ${pt(11,4)} ${pt(11,0)}`;
   fill.setAttribute('d',`M${pt(0,-2.5)}L${curve.slice(1)}L${pt(11,-2.5)}Z`);
   edge.setAttribute('d',curve);
   pointer.style.display='';pointer.style.left='0px';pointer.style.top='0px';pointer.style.width=`${w}px`;pointer.style.height=`${h}px`;
   svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
   pop.dataset.shnTail=dir===1?'before':'after';
  }
  const anchorOf=node=>node instanceof Element?node.closest(selector):null;
  // ---------------------------------------------------------------- crossing from the anchor to the card
  /**
   * The pointer left the anchor, not onto the card, and is at (x1, y1). Where it crossed the anchor's edge: on the way
   * from its last place inside the anchor's hover area (its box and the part raised above it) to (x1, y1); when it crossed
   * the whole anchor between two moves, the nearest point of that area. The event's own point lies already past the edge,
   * by as much as one move.
   */
  function depart(x1,y1){
   const b=anchor.getBoundingClientRect(),r={left:b.left,right:b.right,top:b.top-raise(anchor),bottom:b.bottom},clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
   let x,y;
   if(last&&last[0]>=r.left&&last[0]<=r.right&&last[1]>=r.top&&last[1]<=r.bottom){
    const [x0,y0]=last,dx=x1-x0,dy=y1-y0;let t=1;
    if(dx>0)t=Math.min(t,(r.right-x0)/dx);else if(dx<0)t=Math.min(t,(r.left-x0)/dx);
    if(dy>0)t=Math.min(t,(r.bottom-y0)/dy);else if(dy<0)t=Math.min(t,(r.top-y0)/dy);
    x=x0+dx*t;y=y0+dy*t;
   }else{x=clamp(x1,r.left,r.right);y=clamp(y1,r.top,r.bottom);}
   const d={left:Math.abs(x-r.left),right:Math.abs(x-r.right),top:Math.abs(y-r.top),bottom:Math.abs(y-r.bottom)};
   const edge=['left','right','top','bottom'].reduce((m,s)=>d[s]<d[m]?s:m);
   const pad=edge==='top'?[[x-PAD,y+PAD],[x+PAD,y+PAD]]:edge==='bottom'?[[x-PAD,y-PAD],[x+PAD,y-PAD]]:edge==='left'?[[x+PAD,y-PAD],[x+PAD,y+PAD]]:[[x-PAD,y-PAD],[x-PAD,y+PAD]];
   transit={pad,x:x1,y:y1,timer:0};track(x1,y1);
  }
  /** The pointer at (x, y) during a crossing: still heading for the card, or not. */
  function track(x,y){
   clearTimeout(transit.timer);transit.x=x;transit.y=y;
   const c=pop.getBoundingClientRect();
   if(within([x,y],hull([...transit.pad,[c.left,c.top],[c.right,c.top],[c.right,c.bottom],[c.left,c.bottom]])))transit.timer=setTimeout(settle,REST);
   else settle();
  }
  /** The crossing is over short of the card: the badge the pointer stopped on opens its card; anywhere else closes it. */
  function settle(){
   const {x,y}=transit;arrive();
   const under=document.elementFromPoint(x,y);
   if(under&&pop.contains(under)){hold();return;}
   const b=anchorOf(under);
   if(b===anchor)return;
   if(b&&!suppressPreview)show(b,{pin:false});else hide();
  }
  document.addEventListener('pointermove',e=>{
   if(e.movementX||e.movementY)suppressPreview=false;
   // Where the pointer is after this move; mouseout comes before the move's own pointermove, so it still finds the
   // pointer's place before the move here.
   last=[e.clientX,e.clientY];
   if(!transit)return;
   if(pop.contains(e.target)){arrive();hold();return;}
   if(anchor.contains(e.target)){arrive();return;}
   track(e.clientX,e.clientY);
  },{passive:true});
  document.addEventListener('mouseover',e=>{
   if(shown()&&pop.contains(e.target)){arrive();hold();return;}
   if(suppressPreview||pinned||pop?.contains(e.target))return;
   const b=anchorOf(e.target);if(b===anchor){arrive();return;}
   // What the pointer passes over on its way to the card waits: the crossing decides when it ends.
   if(transit)return;
   if(b)show(b,{pin:false});else hide();
  },true);
  document.addEventListener('mouseout',e=>{
   if(rebuilding||pinned)return;
   if(e.relatedTarget===null){hide();return;}
   if(!anchor||anchor.contains(e.relatedTarget)||pop.contains(e.relatedTarget))return;
   if(anchorOf(e.target)===anchor){if(!transit)depart(e.clientX,e.clientY);return;}
   // Off the card: it closes, unless onto its anchor (above).
   if(pop.contains(e.target))hide();
  },true);
  document.addEventListener('focusin',e=>{
   if(shown()&&pop.contains(e.target)){hold();return;}
   if(!restoring&&!suppressPreview&&!pinned&&e.target.matches?.(selector))show(e.target,{pin:false});
  });
  // The focus leaving the card or its anchor closes a hover card, unless the pointer is still on one of them (the focus was
  // lost to nothing, or the viewer tabbed away while pointing at the card): a hover card closes once neither holds it.
  document.addEventListener('focusout',e=>{if(!rebuilding&&!pinned&&((e.target.matches?.(selector)||pop?.contains(e.target))&&!pop?.contains(e.relatedTarget))&&!pop?.matches(':hover')&&!anchor?.matches(':hover'))hide();});
  // The anchor is its own inspection target, also inside a card link or button.
  document.addEventListener('click',e=>{
   const b=anchorOf(e.target);
   if(b){e.preventDefault();e.stopPropagation();show(b);}
   else if(!pop?.contains(e.target))hide();
  },true);
  document.addEventListener('keydown',e=>{
   if(e.key==='Tab')suppressPreview=false;
   if(e.key==='Escape')dismiss();
   if(e.target.matches?.(selector)&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();show(e.target);}
  },true);
  // A press inside a card holds it in place before the press takes effect (also a touch or a pen, which sends no hover):
  // a fold opening or a button relabelling then changes the card's content, never its place.
  document.addEventListener('pointerdown',e=>{if(shown()&&pop.contains(e.target))hold();},true);
  root.addEventListener('scroll',e=>{if(!pinned&&!pop?.contains(e.target))hide();},true);
  // Leaving the window (another app, a link opened in a new tab) closes a hover card; a clicked card stays until dismissed.
  root.addEventListener('blur',()=>{if(!pinned)hide();});
  root.addEventListener('resize',closeOnViewportChange);
  // Pinch zoom moves the visual viewport without a window resize.
  root.visualViewport?.addEventListener('resize',closeOnViewportChange);
  root.visualViewport?.addEventListener('scroll',closeOnViewportChange);
  return {show,hide,validate};
 }
 root.NakaPopover={create,viewportRect};
})(globalThis);
