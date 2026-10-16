const cv=document.getElementById('calendar'),ctx=cv.getContext('2d');
const off=document.createElement('canvas'),oc=off.getContext('2d'),sm=document.createElement('canvas'),sx_=sm.getContext('2d',{willReadFrequently:true});
const CW=5.6,CH=9;let S=1,GC=1,GRW=1,cpx=1,cph=1;
function resize(){const d=Math.min(2,devicePixelRatio||1),w=cv.clientWidth,h=cv.clientHeight;cv.width=w*d;cv.height=h*d;
 S=w/760*d;cpx=CW*S;cph=CH*S;GC=Math.ceil(cv.width/cpx);GRW=Math.ceil(cv.height/cph);
 off.width=GC*2;off.height=GRW*2;sm.width=GC;sm.height=GRW}
addEventListener('resize',resize);resize();

/* glyph atlas: 0/1 x 6 tonal levels, lavender -> #5B3FD3 */
const AW=14,AH=32,LV=['#F0ECFC','#DDD5F8','#BFB1F2','#9985E8','#7860DC','#5B3FD3'];
const ATL=(()=>{const c=document.createElement('canvas');c.width=AW*12;c.height=AH;const g=c.getContext('2d');
 g.textAlign='center';g.textBaseline='middle';
 ['0','1'].forEach((ch,gi)=>LV.forEach((col,l)=>{g.save();g.translate((gi*6+l)*AW+AW/2,AH/2+1);g.scale(.62,1);
  g.font='500 30px ui-monospace,Menlo,Consolas,monospace';g.fillStyle=col;g.fillText(ch,0,0);g.restore()}));return c})();
const GRAY=Array.from({length:33},(_,i)=>{const v=Math.round(255*(1-i/32));return`rgb(${v},${v},${v})`});

/* artwork textures */
const cache={};
function mkTex(key,cols,rows,draw,lw,lh){
 if(cache[key])return cache[key];
 const k=3,w=cols*k,h=rows*k,c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.fillRect(0,0,w,h);
 g.save();g.scale(w/(lw||w),h/(lh||h));draw(g,lw||w,lh||h);g.restore();
 const px=g.getImageData(0,0,w,h).data,out=new Float32Array(cols*rows);
 for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){let s=0;
  for(let y=0;y<k;y++)for(let x=0;x<k;x++)s+=px[((r*k+y)*w+cc*k+x)*4];
  out[r*cols+cc]=1-s/(k*k*255)}
 const b=new Float32Array(out.length);
 for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){let s=0,n=0;
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const rr=r+y,c2=cc+x,wt=(x||y)?1:2;
   if(rr>=0&&rr<rows&&c2>=0&&c2<cols){s+=out[rr*cols+c2]*wt;n+=wt}}b[r*cols+cc]=s/n}
 return cache[key]=b}
const PC=64,PR=48,PW=330,PH=380,PY=-190;
function pageTex(j){
 const dt=new Date(2027,0,1+(((j%31)+31)%31)),key=dt.toDateString();
 return mkTex(key,PC,PR,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#f7f7f7');gr.addColorStop(1,'#c2c2c2');
  g.fillStyle=gr;g.beginPath();g.roundRect(3,3,w-6,h-6,14);g.fill();
  g.save();g.clip();g.fillStyle='#383838';g.fillRect(0,0,w,34);g.restore();
  g.strokeStyle='#b4b4b4';g.lineWidth=2;g.beginPath();g.roundRect(3,3,w-6,h-6,14);g.stroke();
  g.fillStyle='#fff';[36,96].forEach(x=>{g.beginPath();g.arc(x,11,4.5,0,7);g.fill()});
  g.textAlign='center';g.fillStyle='#fff';g.font='800 17px Helvetica,Arial,sans-serif';
  g.fillText(dt.toLocaleString('en-US',{month:'long'}).toUpperCase(),w/2,28);
  g.strokeStyle='#666';g.lineWidth=2;g.setLineDash([4,4]);g.beginPath();g.moveTo(10,41);g.lineTo(w-10,41);g.stroke();g.setLineDash([]);
  g.fillStyle='#555';g.font='700 11px Helvetica,Arial,sans-serif';
  g.fillText(dt.toLocaleString('en-US',{weekday:'long'}).toUpperCase(),w/2,58);
  g.fillStyle='#000';g.font='800 90px Helvetica,Arial,sans-serif';g.fillText(dt.getDate(),w/2,127);
  g.fillStyle='#777';g.font='700 10px Helvetica,Arial,sans-serif';g.fillText(dt.getFullYear(),w/2,142)},132,150)}
const BC=70,BR=54,BW=366,BH=450,BY=-216;
const bodyTex=()=>mkTex('body',BC,BR,(g,w,h)=>{
 g.fillStyle='#d0d0d0';g.beginPath();g.roundRect(2,2,w-4,h-4,18);g.fill();
 g.strokeStyle='#666';g.lineWidth=3;g.stroke();
 const kx=w/BW,ky=h/BH;g.fillStyle='#fff';g.beginPath();g.roundRect(18*kx,26*ky,PW*kx,(PH+30)*ky,10);g.fill();
 g.fillStyle='#222';[.27,.73].forEach(x=>{g.beginPath();g.roundRect(x*w-3,3,6,8,3);g.fill()})});

/* scene pose (repeats every 6 s) */
let G={},T6=0;
function pose(t){T6=t*Math.PI/3;const s=Math.sin;
 const rx=-.07+.05*s(T6+1.3),ry=.14*s(T6),rz=.035*s(T6+2.2);
 G={cx:Math.cos(rx),sx:Math.sin(rx),cy:Math.cos(ry),sy:Math.sin(ry),cz:Math.cos(rz),sz:Math.sin(rz),
  x:8*s(T6+.6)+3*s(2*T6),y:-8+11*s(T6)+4*s(2*T6+1),bob:s(T6)}}

/* paper layer -> deformed luminance image (offscreen). Glyphs are NOT drawn here. */
function layer(o){
 const{cols,rows,W,H,y0,tex}=o,cw=W/cols,ch=H/rows,phi=o.phi||0,fade=o.fade??1,rev=o.reveal??1,r0=o.r0??0,
  sry=Math.sin(o.ry||0),cry=Math.cos(o.ry||0),srz=Math.sin(o.rz||0),crz=Math.cos(o.rz||0),
  pn=phi/2.25,lat=1-.1*pn,dx=o.dx||0,dy=o.dy||0,dz=o.dz||0,seed=o.seed;
 let cy=0,cz=0;const ys=[],zs=[],ths=[];
 for(let r=0;r<rows;r++){const v=(r+.5)/rows,th=phi*(.12+.88*Math.pow(v,1.25)),c=Math.cos(th),s=Math.sin(th);
  ys[r]=cy+c*ch/2;zs[r]=cz+s*ch/2;ths[r]=th;cy+=c*ch;cz+=s*ch}
 oc.globalAlpha=(o.alpha??1)*Math.pow(fade,.8);
 for(let r=0;r<rows;r++){
  const v=(r+.5)/rows,th=ths[r],ct=Math.cos(th),back=th>1.5708,yc=.35+.65*Math.abs(ct);
  for(let c=0;c<cols;c++){
   const raw=Math.imul(c+1,374761393)^Math.imul(r+1,668265263)^Math.imul(seed+1,1274126177);
   let h=Math.imul(raw^(raw>>>13),1274126177);h^=h>>>16;
   const hh=(h>>>0)/4294967296;
   if(hh>fade*2||(r<r0&&hh>rev))continue;
   const d0=tex[r*cols+c],u=(c+.5)/cols;
   let d=back?.08+.3*d0:d0*(.6+.4*Math.cos(th-.5))*(1+.28*Math.cos(T6+u*3.1+v*2.3+seed*.7));
   if(o.tone)d*=.75;
   if(d<.012)continue;
   const x=(u-.5)*W*lat+Math.sin(T6+v*3.5+seed)*2.5*v;
   const z=zs[r]+Math.sin(T6+u*3.1+v*2.3+seed*.7)*4.5*(.5+.5*v)+pn*40*Math.pow(2*u-1,2)*v;
   const yl=ys[r],x1=x*cry+z*sry,z1=-x*sry+z*cry;
   const px=x1*crz-yl*srz+dx,py=y0+x1*srz+yl*crz+dy,pz=z1+dz;
   const a=px*G.cz-py*G.sz,b=px*G.sz+py*G.cz,
    b2=b*G.cx-pz*G.sx,z3=b*G.sx+pz*G.cx,a3=a*G.cy+z3*G.sy,z4=-a*G.sy+z3*G.cy,
    sc=1000/(1000-z4),X=a3*sc+G.x,Y=b2*sc+G.y;
   const hx=(X*S+cv.width/2)/cpx*2,hy=(Y*S+cv.height/2)/cph*2,
    pw=Math.max(1.8,cw*sc*Math.max(.45,Math.abs(cry))*S/cpx*2*1.4),
    ph=Math.max(1.8,ch*sc*yc*S/cph*2*1.4);
   oc.fillStyle=GRAY[Math.min(32,(d*32)|0)];
   oc.fillRect(hx-pw/2,hy-ph/2,pw,ph)}}
 oc.globalAlpha=1}

const E=x=>x*x*(3-2*x),cl=x=>Math.max(0,Math.min(1,x)),PERIOD=3,LIFE=5.2;
function pageState(s){
 const pk=E(cl(s/2.6)),d=E(cl((s-1.6)/3.4));
 return{phi:pk*2.25*(1-.45*d),ry:d*.85,rz:d*.5,dx:d*310,dy:-d*300,dz:d*140,fade:1-E(cl((s-2.1)/3))}}
const base=j=>({tex:pageTex(j),cols:PC,rows:PR,W:PW,H:PH,y0:PY,seed:((j%31)+31)%31,r0:PR-3});

function frame(now){
 const t=now/1000+.9,tt=t/PERIOD,n=Math.floor(tt);pose(t);
 /* 1. render the floating calendar as a luminance image */
 oc.globalAlpha=1;oc.fillStyle='#fff';oc.fillRect(0,0,off.width,off.height);
 layer({tex:bodyTex(),cols:BC,rows:BR,W:BW,H:BH,y0:BY,seed:3,alpha:.9});
 const sN=t-n*PERIOD,rv=E(cl((sN-.4)/1.4));
 for(let j=n+3;j>=n+1;j--){const dep=j-tt,o=base(j);
  Object.assign(o,{dy:dep*9,dz:-dep*12,alpha:1-.1*dep,tone:dep>1.3?1:0,reveal:j===n+1?rv:0});layer(o)}
 for(const j of [n-1,n]){const s=t-j*PERIOD;if(s>=LIFE)continue;
  const o=base(j);Object.assign(o,pageState(s));o.r0=0;layer(o)}
 /* 2. glow + shadow (smooth, behind glyphs) */
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
 ctx.setTransform(S,0,0,S,cv.width/2,cv.height/2);
 let gr=ctx.createRadialGradient(G.x,G.y,0,G.x,G.y,360);
 gr.addColorStop(0,'rgba(91,63,211,.05)');gr.addColorStop(1,'rgba(91,63,211,0)');
 ctx.fillStyle=gr;ctx.fillRect(-900,-900,1800,1800);
 /* 3. fixed grid: every glyph stays put and upright; only its tone and digit change */
 sx_.drawImage(off,0,0,GC,GRW);
 const px=sx_.getImageData(0,0,GC,GRW).data;
 ctx.setTransform(1,0,0,1,0,0);
 const dw=cpx*1.12,dh=cph*1.2;
 for(let gy=0;gy<GRW;gy++)for(let gx=0;gx<GC;gx++){
  const d=1-px[(gy*GC+gx)*4]/255;if(d<.05)continue;
  const lv=Math.min(5,Math.floor(Math.pow(d,.9)*5.8));
  let h=Math.imul(gx+7,374761393)^Math.imul(gy+3,668265263);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
  const bit=((h>>>6)+Math.floor(T6*.8+((h>>>14)&31)*.31))&1;
  ctx.drawImage(ATL,(bit*6+lv)*AW,0,AW,AH,(gx+.5)*cpx-dw/2,(gy+.5)*cph-dh/2,dw,dh)}
 if(!still.matches&&!document.hidden)raf=requestAnimationFrame(frame)}
const still=matchMedia('(prefers-reduced-motion: reduce)');let raf=0;
function play(){cancelAnimationFrame(raf);raf=0;if(document.hidden)return;if(still.matches)frame(2100);else raf=requestAnimationFrame(frame)}
still.addEventListener('change',play);document.addEventListener('visibilitychange',play);addEventListener('pagehide',()=>cancelAnimationFrame(raf));
play();
