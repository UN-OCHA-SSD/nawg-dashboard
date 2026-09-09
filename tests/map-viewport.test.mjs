import test from 'node:test';
import assert from 'node:assert/strict';
import {resizePreservingView} from '../src/map-viewport.mjs';

test('resize retains the exact manually chosen zoom and center without fitting bounds',()=>{
 const chosen={lat:8.7213,lng:30.4541},calls=[];
 const map={
  getCenter:()=>chosen,getZoom:()=>8.35,
  invalidateSize:options=>calls.push(['invalidateSize',options]),
  setView:(center,zoom,options)=>calls.push(['setView',center,zoom,options]),
  fitBounds:()=>assert.fail('A layout update must never fit geographic bounds'),
 };
 resizePreservingView(map);
 assert.deepEqual(calls,[['invalidateSize',{pan:false,animate:false,debounceMoveend:true}],['setView',chosen,8.35,{animate:false}]]);
});

test('repeated resizing causes no accumulated zoom or center drift',()=>{
 let center={lat:7.3,lng:29.7},zoom=6.55;
 const map={getCenter:()=>({...center}),getZoom:()=>zoom,invalidateSize:()=>{center={lat:center.lat+.05,lng:center.lng-.05};},setView:(c,z)=>{center=c;zoom=z;}};
 for(let month=0;month<36;month++)resizePreservingView(map);
 assert.deepEqual(center,{lat:7.3,lng:29.7});assert.equal(zoom,6.55);
});
