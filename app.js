(function(){
'use strict';
if(window.top!==window.self){document.body.textContent='';return;}
var $=function(i){return document.getElementById(i)};
var data=null,cur=0,sortCol=-1,sortAsc=true;
var DRIVE_URL='https://docs.google.com/spreadsheets/d/1UuO5FEUyUfGIfDMoEuqFwfb7BAwmEzGV/edit';
var hiddenCols={},freezeN=0,chips={},showRowNum=true;
function lsKey(){return 'ops2027ui:'+cur}
function saveUI(){try{localStorage.setItem(lsKey(),JSON.stringify({h:hiddenCols,f:freezeN,c:chips,r:showRowNum}))}catch(e){}}
function loadUI(){try{var s=JSON.parse(localStorage.getItem(lsKey())||'{}');hiddenCols=s.h||{};freezeN=s.f||0;chips=s.c||{};showRowNum=s.r!==false}catch(e){}}
function isProducts(){return data && data.tabs[cur] && data.tabs[cur].name==='מוצרים'}
function updatesFor(sku){var u=data.updates||{};return u[sku]||[]}
function hasImage(sku){return (data.images||[]).indexOf(sku)>-1}
function imgUrl(sku){var u=(data.imageUrls||{})[sku];return u||('images/'+encodeURIComponent(sku)+'.jpg')}
function esc(s){return String(s==null?'':s)}
function closeOverlays(){var o=$('ovl');if(o)o.remove()}
function showImage(sku,name){
  closeOverlays();
  var o=document.createElement('div');o.id='ovl';o.className='ovl';o.setAttribute('role','dialog');o.setAttribute('aria-label',name);
  var b=document.createElement('button');b.className='ovlx';b.textContent='סגור';b.addEventListener('click',closeOverlays);
  var im=document.createElement('img');im.src=imgUrl(sku);im.alt=name;
  o.appendChild(b);o.appendChild(im);
  o.addEventListener('click',function(e){if(e.target===o)closeOverlays()});
  document.body.appendChild(o);b.focus();
}
function showUpdates(sku,name){
  closeOverlays();
  var list=updatesFor(sku);
  var o=document.createElement('div');o.id='ovl';o.className='ovl';o.setAttribute('role','dialog');o.setAttribute('aria-label','עדכוני מלאי '+name);
  var box=document.createElement('div');box.className='panel';
  var h=document.createElement('h2');h.textContent='עדכוני מלאי: '+name+' ('+sku+')';box.appendChild(h);
  var b=document.createElement('button');b.className='ovlx';b.textContent='סגור';b.addEventListener('click',closeOverlays);box.appendChild(b);
  if(!list.length){var p=document.createElement('p');p.textContent='אין פירוט עדכונים זמין.';box.appendChild(p)}
  else{
    var t=document.createElement('table');t.className='upd';
    var hr=document.createElement('tr');['תאריך','כמות','הערה','סימון'].forEach(function(x){var c=document.createElement('th');c.textContent=x;hr.appendChild(c)});t.appendChild(hr);
    list.forEach(function(u){var r=document.createElement('tr');if(u.dup)r.className='dup';else if(u.sameimg)r.className='simr';
      [u.d,u.q,u.note||''].forEach(function(x){var c=document.createElement('td');c.textContent=x;r.appendChild(c)});
      var c=document.createElement('td');
      if(u.dup){c.textContent='חשוד ככפילות (אותה תמונה, אותה כמות)'}
      else if(u.sameimg){c.textContent='אותה תמונה בשתי+ רישומים';c.className='sim'}
      r.appendChild(c)
      t.appendChild(r)});
    box.appendChild(t);
    var n=document.createElement('p');n.className='dupnote';n.textContent='רישומים שסומנו "חשוד ככפילות" נראים כמו אותה תמונה עם אותה כמות שנשלחה שוב. לפי הכלל שנבחר ב-5.10 הכל נספר כמו שנשלח, אז הספירה לא משתנה.';box.appendChild(n);
  }
  o.appendChild(box);
  o.addEventListener('click',function(e){if(e.target===o)closeOverlays()});
  document.body.appendChild(o);b.focus();
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeOverlays()});

/* column model: {key,label,head index or extra kind} */
function columns(){
  var cols=[];
  if(isProducts()){
    cols.push({key:'x0',label:'מק"ט',x:'sku'});
    cols.push({key:'x1',label:'מוצר באתר',x:'link'});
    cols.push({key:'x2',label:'ספירת מלאי 26',x:'cnt'});
    cols.push({key:'x3',label:'תמונה',x:'img'});
    cols.push({key:'x4',label:'עדכוני מלאי',x:'upd'});
  }
  var head=data.tabs[cur].rows[0]||[];
  head.forEach(function(h,i){cols.push({key:'h'+i,label:String(h||('עמודה '+(i+1))),h:i})});
  return cols;
}
function dupSkuSet(){
  var m={},d={};
  data.tabs[cur].rows.slice(1).forEach(function(r){var k=esc(r[0]);m[k]=(m[k]||0)+1});
  Object.keys(m).forEach(function(k){if(m[k]>1)d[k]=1});
  return d;
}
function passChips(r){
  var sku=esc(r[0]),cnt=parseFloat(r[18]),hasCnt=!isNaN(cnt)&&String(r[18])!=='#N/A'&&cnt>0;
  var hasL=!!esc(r[1]),hasI=hasImage(sku);
  if(chips.stock&& !hasCnt)return false;
  if(chips.nostock&& hasCnt)return false;
  if(chips.link&& !hasL)return false;
  if(chips.nolink&& hasL)return false;
  if(chips.img&& !hasI)return false;
  if(chips.noimg&& hasI)return false;
  if(chips.dup&& !passChips.dups[sku])return false;
  return true;
}
function buildToolbar(){
  var old=$('tools2');if(old)old.remove();
  var bar=document.createElement('div');bar.id='tools2';bar.className='bar2';
  /* Drive button */
  var da=document.createElement('a');da.href=DRIVE_URL;da.target='_blank';da.rel='noopener noreferrer';da.className='btn2 drv';da.textContent='לגיליון בדרייב';bar.appendChild(da);
  /* columns toggle */
  var cb=document.createElement('button');cb.className='btn2';cb.id='colbtn';cb.textContent='הסתרת עמודות ▾';
  cb.addEventListener('click',function(){var p=$('colpanel');p.style.display=p.style.display==='none'?'block':'none'});
  bar.appendChild(cb);
  /* freeze select */
  var fl=document.createElement('label');fl.textContent='קיבוע עמודות מימין: ';bar.appendChild(fl);
  var fs=document.createElement('select');fs.id='frz';
  [0,1,2,3,4,5].forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n===0?'ללא':n;fs.appendChild(o)});
  fs.value=String(freezeN);
  fs.addEventListener('change',function(){freezeN=+this.value;saveUI();render()});
  bar.appendChild(fs);
  /* row number toggle */
  var rl=document.createElement('label');rl.className='ck';bar.appendChild(rl);
  var rc=document.createElement('input');rc.type='checkbox';rc.checked=showRowNum;
  rc.addEventListener('change',function(){showRowNum=this.checked;saveUI();render()});
  rl.appendChild(rc);rl.appendChild(document.createTextNode(' מספור שורות'));
  /* chips (products tab only) */
  if(isProducts()){
    var defs=[['stock','יש מלאי'],['nostock','אין מלאי'],['link','יש לינק'],['nolink','אין לינק'],['img','יש תמונה'],['noimg','אין תמונה'],['dup','כפילויות']];
    defs.forEach(function(dfn){
      var b=document.createElement('button');b.className='chip'+(chips[dfn[0]]?' on':'');b.textContent=dfn[1];
      b.setAttribute('aria-pressed',chips[dfn[0]]?'true':'false');
      b.addEventListener('click',function(){chips[dfn[0]]=!chips[dfn[0]];saveUI();render()});
      bar.appendChild(b);
    });
  }
  /* columns panel */
  var p=document.createElement('div');p.id='colpanel';p.className='colpanel';p.style.display='none';
  var cols=columns();
  cols.forEach(function(c){
    var l=document.createElement('label');l.className='ck';
    var i=document.createElement('input');i.type='checkbox';i.checked=!hiddenCols[c.key];
    i.addEventListener('change',function(){hiddenCols[c.key]=!this.checked;saveUI();render()});
    l.appendChild(i);l.appendChild(document.createTextNode(' '+c.label));
    p.appendChild(l);
  });
  bar.appendChild(p);
  var main=$('app');main.insertBefore(bar,document.querySelector('.wrap'));
}
function applyFreeze(){
  var t=$('t');if(!t)return;
  /* clear old */
  Array.prototype.forEach.call(t.querySelectorAll('.stk'),function(c){c.classList.remove('stk');c.style.right=''});
  if(!freezeN)return;
  var hr=t.querySelector('thead tr');if(!hr)return;
  var hcells=Array.prototype.slice.call(hr.children);
  var vis=hcells.filter(function(c){return c.style.display!=='none'});
  var n=Math.min(freezeN,vis.length-1);
  if(n<=0)return;
  var offs=[],acc=0;
  for(var i=0;i<n;i++){offs.push(acc);acc+=vis[i].offsetWidth}
  Array.prototype.forEach.call(t.rows,function(row){
    var cells=row.children;
    for(var i=0;i<n&&i<cells.length;i++){cells[i].classList.add('stk');cells[i].style.right=offs[i]+'px'}
  });
}
function render(){
  var tab=data.tabs[cur],rows=tab.rows,head=rows[0]||[],body=rows.slice(1);
  var q=$('q').value.trim().toLowerCase();
  if(q)body=body.filter(function(r){return r.some(function(v){return String(v).toLowerCase().indexOf(q)>-1})});
  var prod=isProducts();
  if(prod){passChips.dups=dupSkuSet();body=body.filter(passChips)}
  if(sortCol>-1){body=body.slice().sort(function(a,b){var x=a[sortCol],y=b[sortCol],nx=parseFloat(x),ny=parseFloat(y),c;
    if(!isNaN(nx)&&!isNaN(ny)&&x!==''&&y!=='')c=nx-ny;else c=String(x).localeCompare(String(y),'he');return sortAsc?c:-c})}
  var th=document.querySelector('#t thead'),tb=document.querySelector('#t tbody');
  th.textContent='';tb.textContent='';
  var cols=columns().filter(function(c){return !hiddenCols[c.key]});
  var tr=document.createElement('tr');
  if(showRowNum){var rn=document.createElement('th');rn.scope='col';rn.className='rnum';rn.textContent='#';tr.appendChild(rn)}
  cols.forEach(function(c){
    var cell=document.createElement('th');cell.scope='col';cell.textContent=c.label;
    if(c.h!==undefined){
      cell.tabIndex=0;
      var i=c.h;
      function s(){if(sortCol===i)sortAsc=!sortAsc;else{sortCol=i;sortAsc=true}render()}
      cell.addEventListener('click',s);cell.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();s()}});
      if(sortCol===i)cell.setAttribute('aria-sort',sortAsc?'ascending':'descending');
    }
    tr.appendChild(cell);
  });
  th.appendChild(tr);
  var frag=document.createDocumentFragment();
  body.forEach(function(r,ri){
    var t=document.createElement('tr');
    if(showRowNum){var rc=document.createElement('td');rc.className='rnum';rc.textContent=ri+1;t.appendChild(rc)}
    cols.forEach(function(c){
      var cell=document.createElement('td');
      if(c.x==='sku'){cell.textContent=esc(r[0])}
      else if(c.x==='link'){var link=esc(r[1]);
        if(link){var a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';a.textContent='למוצר באתר';cell.appendChild(a)}}
      else if(c.x==='cnt'){var cnt=esc(r[18]);cell.className='cnt';cell.textContent=(cnt===''||cnt==='#N/A')?'0':cnt}
      else if(c.x==='img'){var sku=esc(r[0]),name=esc(r[2]);
        if(hasImage(sku)){var im=document.createElement('img');im.className='thumb';im.src=imgUrl(sku);im.alt='תמונת '+name;im.loading='lazy';
          im.addEventListener('click',function(){showImage(sku,name)});cell.appendChild(im)}}
      else if(c.x==='upd'){var sku2=esc(r[0]),name2=esc(r[2]);var ub=document.createElement('button');ub.className='btn2';ub.textContent='עדכונים';
        ub.addEventListener('click',function(){showUpdates(sku2,name2)});cell.appendChild(ub)}
      else{var v=r[c.h]==null?'':r[c.h];if(prod&&c.h===18&&(v===''||v==='#N/A'))v='0';cell.textContent=v}
      t.appendChild(cell);
    });
    frag.appendChild(t);
  });
  tb.appendChild(frag);
  $('count').textContent=body.length+' שורות';
  $('cap').textContent=tab.name;
  applyFreeze();
}
function renderAll(){buildToolbar();render()}
async function load(){
  try{
    var r=await fetch('data.json',{cache:'no-store',credentials:'omit'});
    if(!r.ok)throw 0;
    data=await r.json();
    $('asof').textContent='תצוגה לקריאה בלבד. הנתונים נכונים למועד הקובץ בדרייב: '+data.asOf+'. אתר העריכה הקודם (Deno) מושבת זמנית.';
    $('note').textContent='שינויים אינם נשמרים כאן. לעריכה יש להשתמש בגיליון בדרייב.';
    var s=$('tab');data.tabs.forEach(function(t,i){var o=document.createElement('option');o.value=i;o.textContent=t.name;s.appendChild(o)});
    var eb=document.createElement('button');eb.id='xl';eb.className='btn2';eb.textContent='ייצוא לאקסל';
    eb.addEventListener('click',function(){window.exportTableToXlsx(document.getElementById('t'),data.tabs[cur].name)});
    document.querySelector('.bar').appendChild(eb);
    cur=0;loadUI();renderAll();
  }catch(err){$('note').textContent='הנתונים לא נטענו.'}
}
$('q').addEventListener('input',render);
$('tab').addEventListener('change',function(){cur=+this.value;sortCol=-1;hiddenCols={};freezeN=0;chips={};showRowNum=true;loadUI();renderAll()});
load();
})();
