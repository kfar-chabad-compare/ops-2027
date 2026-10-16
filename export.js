/* Minimal XLSX export: real .xlsx (zip, stored entries, inline strings). No libraries. */
(function(){
'use strict';
var CRC_T=null;
function crc32(buf){if(!CRC_T){CRC_T=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC_T[n]=c}}
  var c=0xFFFFFFFF;for(var i=0;i<buf.length;i++)c=CRC_T[(c^buf[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function te(s){return new TextEncoder().encode(s)}
function u16(n){return [n&255,(n>>>8)&255]}
function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function zipStore(files){
  var out=[],central=[],off=0;
  files.forEach(function(f){
    var name=te(f.name),data=f.data,crc=crc32(data);
    var h=[].concat([0x50,0x4B,3,4],u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0));
    out.push(new Uint8Array(h),name,data);
    var cd=[].concat([0x50,0x4B,1,2],u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off));
    central.push(new Uint8Array(cd),name);
    var sz=h.length+name.length+data.length;off+=sz;
  });
  var cdSize=0;central.forEach(function(b){cdSize+=b.length});
  var eocd=[].concat([0x50,0x4B,5,6],u16(0),u16(0),u16(files.length),u16(files.length),u32(cdSize),u32(off),u16(0));
  var parts=out.concat(central,[new Uint8Array(eocd)]);
  var tot=0;parts.forEach(function(p){tot+=p.length});
  var res=new Uint8Array(tot),p=0;
  parts.forEach(function(b){res.set(b,p);p+=b.length});
  return res;
}
function xesc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function colName(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function sheetXml(rows){
  var body=rows.map(function(r,ri){
    var cells=r.map(function(v,ci){
      if(v===''||v==null)return '';
      var ref=colName(ci)+(ri+1);
      if(typeof v==='number'&&isFinite(v))return '<c r="'+ref+'"><v>'+v+'</v></c>';
      var s=String(v);
      if(/^-?\d+(\.\d+)?$/.test(s)&&s.length<15)return '<c r="'+ref+'"><v>'+s+'</v></c>';
      return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xesc(s)+'</t></is></c>';
    }).join('');
    return '<row r="'+(ri+1)+'">'+cells+'</row>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>'+
    '<sheetData>'+body+'</sheetData></worksheet>';
}
function buildXlsx(sheetName,rows){
  var files=[
    {name:'[Content_Types].xml',data:te('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')},
    {name:'_rels/.rels',data:te('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')},
    {name:'xl/workbook.xml',data:te('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xesc(sheetName).slice(0,31)+'" sheetId="1" r:id="rId1"/></sheets></workbook>')},
    {name:'xl/_rels/workbook.xml.rels',data:te('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')},
    {name:'xl/worksheets/sheet1.xml',data:te(sheetXml(rows))}
  ];
  return zipStore(files);
}
/* Collect exactly what the table shows: headers + visible rows. Links become their URL; pure-UI cells (buttons/images) export empty. */
function rowsFromTable(table){
  var rows=[];
  var hr=table.querySelector('thead tr');
  if(hr)rows.push([].map.call(hr.children,function(th){return th.textContent}));
  [].forEach.call(table.querySelectorAll('tbody tr'),function(tr){
    rows.push([].map.call(tr.children,function(td){
      var a=td.querySelector('a[href]');
      if(a)return a.getAttribute('href');
      if(td.querySelector('button,img'))return '';
      return td.textContent;
    }));
  });
  return rows;
}
window.exportTableToXlsx=function(table,tabName){
  var bytes=buildXlsx(tabName,rowsFromTable(table));
  var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='ops-2027-'+tabName+'.xlsx';
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
};
})();
