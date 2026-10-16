(function(){
'use strict';
if(window.top!==window.self){document.body.textContent='';return;}
var $=function(i){return document.getElementById(i)};
var data=null,cur=null,sortCol=-1,sortAsc=true;
var PRODUCTS_TAB=0;
function isProducts(){return data && data.tabs[cur] && data.tabs[cur].name==='מוצרים'}
function updatesFor(sku){var u=data.updates||{};return u[sku]||[]}
function imgUrl(sku){var u=(data.imageUrls||{})[sku];return u||('images/'+encodeURIComponent(sku)+'.jpg')}
function hasImage(sku){return (data.images||[]).indexOf(sku)>-1}
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
function render(){
  var tab=data.tabs[cur],rows=tab.rows,head=rows[0]||[],body=rows.slice(1);
  var q=$('q').value.trim().toLowerCase();
  if(q)body=body.filter(function(r){return r.some(function(v){return String(v).toLowerCase().indexOf(q)>-1})});
  if(sortCol>-1){body=body.slice().sort(function(a,b){var x=a[sortCol],y=b[sortCol],nx=parseFloat(x),ny=parseFloat(y),c;
    if(!isNaN(nx)&&!isNaN(ny)&&x!==''&&y!=='')c=nx-ny;else c=String(x).localeCompare(String(y),'he');return sortAsc?c:-c})}
  var th=document.querySelector('#t thead'),tb=document.querySelector('#t tbody');
  th.textContent='';tb.textContent='';
  var tr=document.createElement('tr');
  var prod=isProducts();
  if(prod){['מק"ט','מוצר באתר','ספירת מלאי 26','תמונה','עדכוני מלאי'].forEach(function(h){var c=document.createElement('th');c.scope='col';c.textContent=h;tr.appendChild(c)})}
  head.forEach(function(h,i){var c=document.createElement('th');c.scope='col';c.tabIndex=0;c.textContent=h;
    function s(){if(sortCol===i)sortAsc=!sortAsc;else{sortCol=i;sortAsc=true}render()}
    c.addEventListener('click',s);c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();s()}});
    if(sortCol===i)c.setAttribute('aria-sort',sortAsc?'ascending':'descending');tr.appendChild(c)});
  th.appendChild(tr);
  var frag=document.createDocumentFragment();
  body.forEach(function(r){var t=document.createElement('tr');
    if(prod){
      var sku=esc(r[0]),link=esc(r[1]),name=esc(r[2]),cnt=esc(r[18]);
      var c0=document.createElement('td');c0.textContent=sku;t.appendChild(c0);
      var c1=document.createElement('td');
      if(link){var a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';a.textContent='למוצר באתר';c1.appendChild(a)}
      t.appendChild(c1);
      var c2=document.createElement('td');c2.className='cnt';c2.textContent=(cnt===''||cnt==='#N/A')?'0':cnt;t.appendChild(c2);
      var c3=document.createElement('td');
      if(hasImage(sku)){var im=document.createElement('img');im.className='thumb';im.src=imgUrl(sku);im.alt='תמונת '+name;im.loading='lazy';
        im.addEventListener('click',function(){showImage(sku,name)});c3.appendChild(im)}
      t.appendChild(c3);
      var c4=document.createElement('td');var ub=document.createElement('button');ub.className='btn2';ub.textContent='עדכונים';
      ub.addEventListener('click',function(){showUpdates(sku,name)});c4.appendChild(ub);t.appendChild(c4);
    }
    head.forEach(function(_,i){var c=document.createElement('td');var v=r[i]==null?'':r[i];if(prod&&i===18&&(v===''||v==='#N/A'))v='0';c.textContent=v;t.appendChild(c)});
    frag.appendChild(t)});
  tb.appendChild(frag);
  $('count').textContent=body.length+' שורות';
  $('cap').textContent=tab.name;
}
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
    cur=0;render();
  }catch(err){$('note').textContent='הנתונים לא נטענו.'}
}
$('q').addEventListener('input',render);
$('tab').addEventListener('change',function(){cur=+this.value;sortCol=-1;render()});
load();
})();
