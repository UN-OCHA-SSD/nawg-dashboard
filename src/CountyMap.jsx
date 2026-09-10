import React, {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Plus,Minus,ArrowsOut,ArrowUp} from '@phosphor-icons/react';
import {BAND_COLORS,severityInfo} from './data-model.mjs';
import {cellColor,comparable} from './analytics-model.mjs';
import {resizePreservingView} from './map-viewport.mjs';
export function mapValue(cell,indicator,previous=null,canCompare=false) {
  if(!cell?.row||cell.conflict) return {color:'#b9c2cd',label:cell?.conflict?'Conflicting records':'No data'};
  if(indicator==='score'){const t=Math.min(1,Math.max(0,cell.score/10));return {color:'rgb('+[228,240,252].map((v,i)=>Math.round(v+([6,92,178][i]-v)*t)).join(',')+')',label:'NSS '+cell.score.toFixed(2)};}
  if(indicator==='change'){if(!canCompare||previous?.score==null||cell.score==null)return {color:'#b9c2cd',label:'No comparable previous observation'};const d=cell.score-previous.score;return {color:d>0.005?'#dc4b57':d<-.005?'#329d93':'#f6f5ed',label:(d>0?'+':'')+d.toFixed(2)+' points vs comparison'};}
  if(indicator==='band')return {color:cellColor(cell),label:'Band '+cell.band};
  return severityInfo(cell.row[indicator]);
}
export function CountyMap({model,period,selected,onSelect,visibleKeys,indicator='band',countyMode=false,compare=''}) {
  const element=useRef(null),map=useRef(null),layers=useRef(null),labels=useRef(null),props=useRef();
  const savedView=useRef(null),fittedCounty=useRef(selected);
  props.current={model,period,selected,onSelect,visibleKeys,indicator,countyMode};
  function fit(){
    if(!map.current||!layers.current)return;
    let target=layers.current;
    if(props.current.countyMode)layers.current.eachLayer(l=>{if(l.feature.key===props.current.selected)target=l;});
    map.current.fitBounds(target.getBounds(),{paddingTopLeft:props.current.countyMode?[65,65]:[10,62],paddingBottomRight:props.current.countyMode?[65,65]:[10,35],animate:false,maxZoom:props.current.countyMode?9:7});
  }
  function drawLabels(){
    if(!map.current||!labels.current)return;
    labels.current.clearLayers();
    const pr=props.current,m=map.current,taken=[],size=m.getSize();
    if(!pr.countyMode)for(const [name,lat,lng] of [['SUDAN',12.1,29],['ETHIOPIA',7.6,36.4],['CENTRAL AFRICAN REPUBLIC',6.9,22],['DEMOCRATIC REPUBLIC OF THE CONGO',2.3,27.6],['UGANDA',2.15,32.4],['KENYA',3.9,36]]){
      const node=document.createElement('span');node.textContent=name;
      labels.current.addLayer(L.tooltip({permanent:true,direction:'center',className:'country-label',opacity:1}).setLatLng([lat,lng]).setContent(node));
    }
    const candidates=pr.model.features.filter(f=>pr.visibleKeys.has(f.key)||f.key===pr.selected).sort((a,b)=>(b.key===pr.selected)-(a.key===pr.selected));
    for(const f of candidates){
      const ll=L.latLng(f.properties.center_lat,f.properties.center_lon),point=m.latLngToContainerPoint(ll);
      const box={x:point.x-(f.name.length*5.3+12)/2,y:point.y-10,w:f.name.length*5.3+12,h:20};
      if(point.x<20||point.x>size.x-20||point.y<20||point.y>size.y-20)continue;
      if(taken.some(b=>box.x<b.x+b.w+3&&box.x+box.w>b.x-3&&box.y<b.y+b.h+3&&box.y+box.h>b.y-3))continue;
      taken.push(box);
      const node=document.createElement('span');node.textContent=f.name;
      labels.current.addLayer(L.tooltip({permanent:true,direction:'center',className:'county-label'+(f.key===pr.selected?' selected-label':''),opacity:1}).setLatLng(ll).setContent(node));
    }
  }
  useEffect(()=>{
    const m=L.map(element.current,{zoomControl:false,attributionControl:false,scrollWheelZoom:false,minZoom:4,maxZoom:12,zoomSnap:0.05,zoomDelta:0.5});
    map.current=m;
    m.createPane('international');m.getPane('international').style.zIndex=450;m.getPane('international').style.pointerEvents='none';
    if(model.international)L.geoJSON(model.international,{pane:'international',interactive:false,style:f=>({className:'international-boundary',color:'#8392a3',weight:1.4,opacity:0.9,dashArray:f.properties.cartographic_style==='Dashed boundary line'?'7 5':f.properties.cartographic_style==='Dashed-dotted boundary line'?'8 4 2 4':f.properties.cartographic_style==='Dotted boundary line'?'2 4':null})}).addTo(m);
    layers.current=L.geoJSON({type:'FeatureCollection',features:model.features},{style:{color:'#c9bca3',weight:0.8,fillOpacity:1},onEachFeature:(f,l)=>{
      l.on('click',()=>props.current.onSelect(f.key));
      l.on('mouseover',()=>{l.setStyle({weight:2});l.bringToFront();});
      l.on('mouseout',()=>l.setStyle({weight:f.key===props.current.selected?2.6:0.7}));
    }}).addTo(m);
    labels.current=L.layerGroup().addTo(m);
    L.control.scale({imperial:false,maxWidth:110,position:'bottomright'}).addTo(m);
    m.on('zoomend moveend',drawLabels);
    if(savedView.current)m.setView(savedView.current.center,savedView.current.zoom,{animate:false});else fit();
    const observer=new ResizeObserver(()=>{resizePreservingView(m);drawLabels();});observer.observe(element.current);
    return()=>{observer.disconnect();savedView.current={center:m.getCenter(),zoom:m.getZoom()};m.remove();map.current=null;};
  },[model]);
  useEffect(()=>{
    if(!layers.current)return;
    layers.current.eachLayer(l=>{
      const key=l.feature.key,cell=model.cells.get(period+'/'+key),value=mapValue(cell,indicator,model.cells.get(compare+'/'+key),comparable(model,period,compare)),visible=visibleKeys.has(key);
      l.setStyle({fillColor:value.color,fillOpacity:visible?0.96:0.13,color:key===selected?'#0879fa':'#aa9272',opacity:visible?1:0.25,weight:key===selected?2.6:0.7});
      if(key===selected)l.bringToFront();
      const content=document.createElement('div'),strong=document.createElement('strong'),detail=document.createElement('div');
      strong.textContent=l.feature.name;detail.textContent=value.label+(cell?.score!=null?' · NSS '+cell.score.toFixed(2):'');content.append(strong,detail);
      if(l.getTooltip())l.setTooltipContent(content);else l.bindTooltip(content,{sticky:true,className:'map-hover'});
      const el=l.getElement();if(el){el.setAttribute('tabindex',visible?'0':'-1');el.setAttribute('role','button');el.setAttribute('aria-label',l.feature.name+' — '+detail.textContent);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(key);}};}
    });
    drawLabels();
  },[model,period,selected,indicator,visibleKeys,countyMode,compare]);
  useEffect(()=>{
    if(countyMode&&fittedCounty.current!==selected)fit();
    fittedCounty.current=selected;
  },[selected,countyMode]);
  return <div className={'map-wrapper '+(countyMode?'local-map':'')} aria-label={countyMode?'County context map':'South Sudan county map'}>
    <div ref={element} className="leaflet-surface"/>
    <div className="map-controls"><button aria-label="Zoom in" onClick={()=>map.current.zoomIn()}><Plus/></button><button aria-label="Zoom out" onClick={()=>map.current.zoomOut()}><Minus/></button><button aria-label="Fit map" onClick={fit}><ArrowsOut/></button></div>
    <div className="map-north"><span>N</span><ArrowUp weight="bold"/></div>
    <div className="map-attribution"><a href="https://gis.unocha.org/server/rest/services/COD/GLB_COD_Admin2/MapServer/0" target="_blank" rel="noreferrer">Counties: OCHA</a><span> · </span><a href="https://gis.unocha.org/server/rest/services/Hosted/World_International_Boundaries__Adm0___Line/FeatureServer/0" target="_blank" rel="noreferrer" title="UN boundary types retained; dashed and dotted lines indicate special boundary status. Boundaries do not imply UN endorsement.">Borders: UN</a></div>
  </div>;
}
