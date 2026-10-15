(function(){
'use strict';
if(window.top!==window.self){document.body.textContent='';return;}
var $=function(i){return document.getElementById(i)};
var data=null,cur=null,sortCol=-1,sortAsc=true;
function render(){
  var tab=data.tabs[cur],rows=tab.rows,head=rows[0]||[],body=rows.slice(1);
  var q=$('q').value.trim().toLowerCase();
  if(q)body=body.filter(function(r){return r.some(function(v){return String(v).toLowerCase().indexOf(q)>-1})});
  if(sortCol>-1){body=body.slice().sort(function(a,b){var x=a[sortCol],y=b[sortCol],nx=parseFloat(x),ny=parseFloat(y),c;
    if(!isNaN(nx)&&!isNaN(ny)&&x!==''&&y!=='')c=nx-ny;else c=String(x).localeCompare(String(y),'he');return sortAsc?c:-c})}
  var th=document.querySelector('#t thead'),tb=document.querySelector('#t tbody');
  th.textContent='';tb.textContent='';
  var tr=document.createElement('tr');
  head.forEach(function(h,i){var c=document.createElement('th');c.scope='col';c.tabIndex=0;c.textContent=h;
    function s(){if(sortCol===i)sortAsc=!sortAsc;else{sortCol=i;sortAsc=true}render()}
    c.addEventListener('click',s);c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();s()}});
    if(sortCol===i)c.setAttribute('aria-sort',sortAsc?'ascending':'descending');tr.appendChild(c)});
  th.appendChild(tr);
  var frag=document.createDocumentFragment();
  body.forEach(function(r){var t=document.createElement('tr');head.forEach(function(_,i){var c=document.createElement('td');c.textContent=r[i]==null?'':r[i];t.appendChild(c)});frag.appendChild(t)});
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
    cur=0;render();
  }catch(err){$('note').textContent='הנתונים לא נטענו.'}
}
$('q').addEventListener('input',render);
$('tab').addEventListener('change',function(){cur=+this.value;sortCol=-1;render()});
load();
})();
