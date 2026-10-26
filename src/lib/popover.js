/**
 * The weight inspection bubble, shared by the market pages (content script) and the extension page so both behave the
 * same: it opens for the anchor under the pointer, under keyboard focus or tapped; it touches its anchor, so the pointer
 * moves straight onto it and it stays open while the pointer is on either; it takes the side with room and draws a tail
 * toward the anchor; Hover previews close on leave; clicked sheets stay fixed until dismissed, including during async updates. Styles: content/content.css (.shn-pop).
 */
(function(root){
 'use strict';
 const SVG='http://www.w3.org/2000/svg';
 function viewportRect(){
  const view=root.visualViewport;
  const v={left:view?.offsetLeft??0,top:view?.offsetTop??0,
   width:Math.min(document.documentElement.clientWidth,innerWidth,view?.width??Infinity),
   height:Math.min(document.documentElement.clientHeight,innerHeight,view?.height??Infinity)};
  v.right=v.left+v.width;v.bottom=v.top+v.height;return v;
 }
 /**
  * options: selector (anchors), id (bubble element id), build(anchor) → {className, nodes} (null: nothing to show),
  * target(anchor) → element the tail centres on, raise(anchor) → px the anchor's hover area extends above it,
  * identity(anchor) → string; validate() closes the bubble when its anchor left the page or now shows another piece.
  */
 function create({selector,id,build,target,raise,identity}){
  let pop=null,anchor=null,key=null,viewport=null,pinned=false,origin=null,restoring=false,suppressPreview=false,rebuilding=false;
  const resize=new ResizeObserver(()=>{if(anchor)position();});
  function hide(){
   if(!pop)return;
   pop.classList.remove('shn-pop--show');anchor?.removeAttribute('aria-describedby');anchor?.removeAttribute('data-shn-open');
   resize.disconnect();anchor=null;key=null;viewport=null;pinned=false;origin=null;
  }
  const zh=()=>document.documentElement.lang.startsWith('zh');
  function dismiss(){const restore=anchor,inside=pop?.contains(document.activeElement);restoring=true;suppressPreview=true;hide();if(inside&&restore?.isConnected)restore.focus({preventScroll:true});restoring=false;}
  function pin(){pinned=true;if(pop){pop.setAttribute('role','dialog');pop.setAttribute('aria-label',zh()?'藏品详情':'Piece details');pop.classList.add('shn-pop--pinned');pop.querySelector('.shn-pop__pointer')?.setAttribute('hidden','');pop.querySelector('.shn-pop__tools').hidden=false;position();}}
  function show(a,{pin:keep=true,at:stay=null}={}){
   if(anchor===a&&key===identity(a)&&pop?.classList.contains('shn-pop--show')){if(keep)pin();return;}
   if(anchor)hide();
   const content=build(a);if(!content)return;
   if(!pop){pop=document.createElement('div');pop.id=id;pop.setAttribute('role','tooltip');pop.tabIndex=0;document.body.appendChild(pop);}
   a.setAttribute('aria-describedby',pop.id);anchor=a;key=identity(a);
   const surface=document.createElement('div');surface.className='shn-pop__surface';surface.append(...content.nodes);
   const pointer=document.createElement('span');pointer.className='shn-pop__pointer';pointer.setAttribute('aria-hidden','true');
   const svg=document.createElementNS(SVG,'svg'),group=document.createElementNS(SVG,'g');
   for(const cls of ['shn-pop__pointer-fill','shn-pop__pointer-edge']){const path=document.createElementNS(SVG,'path');path.setAttribute('class',cls);group.append(path);}
   svg.append(group);pointer.append(svg);const tools=document.createElement('div');tools.className='shn-pop__tools';tools.hidden=true;const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',zh()?'关闭':'Close');close.className='shn-pop__close';close.addEventListener('click',dismiss);tools.append(close);rebuilding=true;pop.replaceChildren(surface,pointer,tools);rebuilding=false;
   pop.setAttribute('role','tooltip');pop.className=`shn-pop ${content.className}`;a.setAttribute('data-shn-open','true');
   if(keep&&stay){pinned=true;origin=stay;}
   if(!position())return;
   pop.classList.add('shn-pop--show');if(keep)pin();resize.disconnect();resize.observe(surface);resize.observe(a);
  }
  function validate(){
   if(!anchor)return;
   if(pinned){
    const asset=key.split('|')[0],replacement=[...document.querySelectorAll(selector)].find(a=>identity(a).split('|')[0]===asset);
    if(replacement&&replacement!==anchor){anchor.removeAttribute('data-shn-open');anchor.removeAttribute('aria-describedby');anchor=replacement;anchor.setAttribute('data-shn-open','true');anchor.setAttribute('aria-describedby',pop.id);}
    // An interactive sheet keeps its displayed block until explicitly refreshed or dismissed.
    if(replacement&&identity(replacement)!==key&&!pop.querySelector('.shn-pop__refresh')){const refresh=document.createElement('button');refresh.type='button';refresh.className='shn-pop__refresh';refresh.textContent=document.documentElement.lang.startsWith('zh')?'数据已更新 · 刷新此卡':'Data updated · refresh this card';refresh.addEventListener('click',()=>{const open=[...pop.querySelectorAll('details[open]')].map(d=>d.className),scroll=pop.querySelector('.shn-pop__surface').scrollTop,at=origin;show(anchor,{at});for(const d of pop.querySelectorAll('details'))if(open.includes(d.className))d.open=true;position();pop.querySelector('.shn-pop__surface').scrollTop=scroll;});pop.querySelector('.shn-pop__surface').prepend(refresh);}
    const tools=pop.querySelector('.shn-pop__surface');let gone=tools.querySelector('.shn-pop__gone');if(!replacement&&!gone){gone=document.createElement('span');gone.className='shn-pop__gone';gone.textContent=zh()?'已离开当前列表 · 保留此卡':'No longer in this list · saved view';tools.prepend(gone);}else if(replacement)gone?.remove();
    position();return;
   }
   if(!anchor.isConnected||identity(anchor)!==key)hide();else position();
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
   if(pinned&&origin){
    const width=Math.max(1,Math.floor(Math.min(420,v.width-2*M))),left=clamp(origin.left,v.left+M,v.right-width-M),top=clamp(origin.top,v.top+M,v.bottom-M-60);
    pop.style.width=width+'px';pop.style.left=left+'px';pop.style.top=top+'px';pop.querySelector('.shn-pop__surface').style.maxHeight=Math.max(1,v.bottom-M-top)+'px';viewport=v;return true;
   }
   const a=visibleRect(anchor),centre=target(anchor);let t=visibleRect(centre??anchor);
   if(a.right<=a.left||a.bottom<=a.top){hide();return false;}
   a.top=Math.max(v.top,a.top-raise(anchor));
   if(t.right<=t.left||t.bottom<=t.top)t=a;
   const surface=pop.querySelector('.shn-pop__surface');
   pop.style.width=`${Math.max(1,Math.floor(Math.min(420,v.width-2*M)))}px`;
   const w=pop.offsetWidth,css=getComputedStyle(surface);
   const natural=Math.ceil(surface.scrollHeight+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth));
   const room={bottom:a.top-v.top-M-G,top:v.bottom-M-a.bottom-G,right:a.left-v.left-M-G,left:v.right-M-a.right-G};
   const side=natural<=room.bottom?'bottom':natural<=room.top?'top':w<=room.right?'right':w<=room.left?'left':room.bottom>=room.top?'bottom':'top';
   const limit=Math.max(1,Math.floor(Math.min(v.height-2*M,side==='top'||side==='bottom'?room[side]:v.height-2*M)));
   surface.style.maxHeight=`${limit}px`;
   const h=pop.offsetHeight,cx=(t.left+t.right)/2,cy=(t.top+t.bottom)/2;
   // Round toward the anchor so the shared edge never opens a sub-pixel gap.
   const left=side==='right'?Math.ceil(a.left-w):side==='left'?Math.floor(a.right):Math.round(clamp(cx-w/2,v.left+M,v.right-w-M));
   const top=side==='bottom'?Math.ceil(a.top-h):side==='top'?Math.floor(a.bottom):Math.round(clamp(cy-h/2,v.top+M,v.bottom-h-M));
   pop.style.left=`${left}px`;pop.style.top=`${top}px`;pop.dataset.shnSide=side;
   origin={left,top};drawTail(side,a,w,h);
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
  document.addEventListener('pointermove',e=>{if(e.movementX||e.movementY)suppressPreview=false;},{passive:true});
  document.addEventListener('mouseover',e=>{
   if(suppressPreview||pinned||pop?.contains(e.target))return;
   const b=anchorOf(e.target);if(b===anchor)return;
   if(b)show(b,{pin:false});else hide();
  },true);
  document.addEventListener('mouseout',e=>{
   if(rebuilding||pinned)return;
   if(e.relatedTarget===null){hide();return;}
   const fromAnchor=anchorOf(e.target)===anchor;
   if((fromAnchor||pop?.contains(e.target))&&!anchor?.contains(e.relatedTarget)&&!pop?.contains(e.relatedTarget))hide();
  },true);
  document.addEventListener('focusin',e=>{if(!restoring&&!suppressPreview&&!pinned&&e.target.matches?.(selector))show(e.target,{pin:false});});
  document.addEventListener('focusout',e=>{if(!rebuilding&&!pinned&&((e.target.matches?.(selector)||pop?.contains(e.target))&&!pop?.contains(e.relatedTarget)))hide();});
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
  // A press on an action inside a preview keeps it (the page may redraw under it); opening or closing a fold only reads, so
  // the preview still closes when the pointer leaves.
  document.addEventListener('pointerdown',e=>{if(pop?.contains(e.target)&&!e.target.closest?.('summary'))pin();},true);
  root.addEventListener('scroll',e=>{if(!pinned&&!pop?.contains(e.target))hide();},true);
  root.addEventListener('blur',hide);
  root.addEventListener('resize',closeOnViewportChange);
  // Pinch zoom moves the visual viewport without a window resize.
  root.visualViewport?.addEventListener('resize',closeOnViewportChange);
  root.visualViewport?.addEventListener('scroll',closeOnViewportChange);
  return {show,hide,validate};
 }
 root.NakaPopover={create,viewportRect};
})(globalThis);
