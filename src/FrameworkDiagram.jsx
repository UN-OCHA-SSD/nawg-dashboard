import React, {useId, useMemo, useState} from 'react';
import {MagnifyingGlassPlus, MagnifyingGlassMinus, CornersOut, ArrowCounterClockwise, X} from '@phosphor-icons/react';
import referenceData from '../data/nawg-reference.json';
import './framework-diagram.css';

// Coordinates follow the supplied framework flowchart (2048 × 868).
// These are interactive methodological UI nodes, not a raster illustration.
const inputs = [
 {id:'demog',box:[16,48,214,73],lines:['Demographic','vulnerability'],detail:'Demographic vulnerability contributes to the Underlying Vulnerability Score (UVS).'},
 {id:'stock',box:[16,133,214,73],lines:['Displacement','stock'],detail:'Displacement stock contributes to the UVS and captures underlying vulnerability associated with IDPs and returnees.'},
 {id:'ipclong',box:[16,224,214,82],lines:['Longitudinal food','insecurity'],detail:'Longitudinal food insecurity contributes to the UVS, separate from acute food insecurity.'},
 {id:'protection',box:[16,442,280,50],lines:['Protection risks'],detail:'Protection is an Aggregate Trigger Score (ATS) indicator.'},
 {id:'flow',box:[16,498,280,50],lines:['Displacement flows'],detail:'Displacement flow is an ATS indicator and represents movement during the assessed period.'},
 {id:'disease',box:[16,554,280,50],lines:['Disease incidence/outbreaks'],detail:'Disease incidence or outbreaks contribute to the ATS.'},
 {id:'afi',box:[16,610,280,50],lines:['Acute food insecurity'],detail:'Acute food insecurity (IPC AFI) contributes to the ATS. IPC phases also inform methodological restrictions.'},
 {id:'amn',box:[16,667,280,50],lines:['Acute malnutrition'],detail:'Acute malnutrition (IPC AMN) contributes to the ATS. IPC phases also inform methodological restrictions.'},
 {id:'conflict',box:[16,726,280,50],lines:['Conflict'],detail:'Conflict is included among the revised framework ATS indicators.'},
 {id:'climate',box:[16,783,280,50],lines:['Climate shocks'],detail:'Climate shocks contribute to the revised framework ATS. The maximum contribution is 1.0, not 0.54.'},
];
const processes = [
 {id:'uvs-result',box:[363,116,213,99],lines:['Underlying','vulnerability score'],tone:'result',detail:'The three underlying vulnerability indicators are combined into the UVS, ranging from 0 to 2.'},
 {id:'ats-result',box:[365,397,193,106],lines:['Aggregate','trigger score'],tone:'result',detail:'The seven revised trigger indicators form the ATS, ranging from 0 to 8.'},
 {id:'qualitative-overlay',box:[358,545,206,62],lines:['Qualitative','overlay'],tone:'method',detail:'The framework considers a qualitative overlay alongside the trigger indicators.'},
 {id:'method-restrictions',box:[519,262,171,105],lines:['Methodological','restrictions'],tone:'method',detail:'IPC AFI phase 5 (including phase 4 with pockets of phase 5) or IPC AMN phase 5 requires Band A. IPC AFI phase 4 or IPC AMN phase 4 requires at least Band C and a first-level score of at least 6. Dashboard classifications remain source-reported.'},
 {id:'first-level-nss',box:[729,244,147,138],lines:['First-level','needs','severity','score'],tone:'result',detail:'UVS and ATS are aggregated, subject to methodological restrictions, into the first-level NSS on a 0–10 scale.'},
 {id:'context-factors',box:[1154,189,181,64],lines:['Contextual factors'],tone:'input',detail:'NAWG considers contextual factors when interpreting flagged first-level results.'},
 {id:'compounding-shocks',box:[1154,262,185,77],lines:['Compounding','shock occurrence'],tone:'input',detail:'Compounding shocks are considered during NAWG contextual analysis.'},
 {id:'assistance-access',box:[1154,346,185,74],lines:['Access to','assistance (5W)'],tone:'input',detail:'Access to assistance is considered in contextual analysis, with the framework referring to 5W evidence.'},
 {id:'final-result',box:[1620,216,219,111],lines:['Final county band','and needs severity','score'],tone:'result',detail:'The final county band and NSS incorporate the framework process and NAWG contextual review. The dashboard preserves ActivityInfo final values and bands; this diagram never reclassifies observations.'},
];
const ranges=['8–10','7–7.9','6–6.9','4–5.9','2–3.9','0–1.9'];
function activate(event, action) {
 if(event.key==='Enter'||event.key===' '){event.preventDefault();action();}
}
function FlowNode({node,selected,onSelect}) {
 const [x,y,w,h]=node.box, lineHeight=29, firstY=y+h/2-(node.lines.length-1)*lineHeight/2;
 // Keep the reference's box geometry, reducing only unusually wide labels.
 const fontSize=({'disease':18,'uvs-result':20.5,'method-restrictions':19,'context-factors':18,'compounding-shocks':18.5,'assistance-access':20,'final-result':20})[node.id]||22;
 return <g id={'framework-'+node.id} className={'flow-node '+(node.tone||'input')} role="button" tabIndex={0} aria-pressed={selected} aria-label={node.label+(node.max!=null?', maximum '+node.max.toFixed(1):'')+'. Show definition'} onClick={()=>onSelect(node)} onKeyDown={e=>activate(e,()=>onSelect(node))}>
  <rect x={x} y={y} width={w} height={h} rx={node.tone==='result'?18:12}/>
  <text x={x+w/2} y={firstY} textAnchor="middle" dominantBaseline="central" style={{fontSize}}>{node.lines.map((line,index)=><tspan key={line} x={x+w/2} dy={index?lineHeight:0}>{line}</tspan>)}</text>
 </g>;
}
function TextNode({id,x,y,lines,label,detail,selected,onSelect,className=''}) {
 const node={id,label,detail};
 return <g id={'framework-'+id} className={'flow-text-node '+className} role="button" tabIndex={0} aria-pressed={selected} aria-label={label+'. Show definition'} onClick={()=>onSelect(node)} onKeyDown={e=>activate(e,()=>onSelect(node))}>
  <rect x={x-8} y={y-23} width={Math.max(...lines.map(l=>l.length))*12+16} height={lines.length*30+10} rx={5}/>
  <text x={x} y={y}>{lines.map((line,index)=><tspan key={line} x={x} dy={index?30:0}>{line}</tspan>)}</text>
 </g>;
}
export default function FrameworkDiagram({reference=referenceData,className=''}) {
 const [selected,setSelected]=useState(null),[zoom,setZoom]=useState(1), arrowId=useId().replace(/:/g,'')+'-framework-arrow';
 const nodes=useMemo(()=>{
  const byId=Object.fromEntries((reference.indicators||[]).map(i=>[i.id,i]));
  return [...inputs.map(n=>({...n,label:byId[n.id]?.name||n.lines.join(' '),max:byId[n.id]?.max_v2})),...processes.map(n=>({...n,label:n.lines.join(' ')}))];
 },[reference]);
 const bands=reference.bands||[], chosen=id=>selected?.id===id;
 const changeZoom=delta=>setZoom(z=>Math.max(.5,Math.min(2,(z==='fit'?1:z)+delta)));
 return <section className={'framework-diagram '+className} aria-label="NAWG needs severity scoring framework">
  <div className="framework-toolbar"><p>Follow the connections from inputs to final classification. Select a box or label for details.</p><div className="framework-view-controls">
   <button className="icon-button" type="button" aria-label="Zoom out framework" onClick={()=>changeZoom(-.25)} disabled={zoom!== 'fit'&&zoom<=.5}><MagnifyingGlassMinus size={19}/></button>
   <span aria-live="polite">{zoom==='fit'?'Fit':Math.round(zoom*100)+'%'}</span>
   <button className="icon-button" type="button" aria-label="Zoom in framework" onClick={()=>changeZoom(.25)} disabled={zoom!== 'fit'&&zoom>=2}><MagnifyingGlassPlus size={19}/></button>
   <button className="secondary" type="button" onClick={()=>setZoom('fit')} aria-label="Fit framework"><CornersOut size={17}/>Fit</button>
   <button className="icon-button" type="button" aria-label="Restore readable framework size" onClick={()=>setZoom(1)}><ArrowCounterClockwise size={18}/></button>
  </div></div>
  <div className="framework-viewport" role="region" aria-label="Framework flowchart. Scroll horizontally to explore at readable size." tabIndex={0}>
   <svg className="framework-flowchart" viewBox="0 0 2048 868" style={{width:zoom==='fit'?'100%':'max(100%, '+1200*zoom+'px)'}} aria-label="Five-step NAWG framework flowchart">
    <title>NAWG framework: underlying vulnerability and triggers, aggregation and restrictions, discussion flags, contextual analysis, final county classification</title>
    <defs><marker id={arrowId} viewBox="0 0 12 12" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 12 6 L 0 12 z" className="flow-arrowhead"/></marker></defs>
    <g className="flow-connectors" aria-hidden="true">
     <path d="M230 84 H309 V263 H230 M230 169 H363 M309 169 H363"/>
     <path d="M462 215 V397 M462 315 H519 M690 315 H729"/>
     {[467,523,579,635,692,751,808].map(y=><path key={y} d={'M296 '+y+' H322'}/>)}
     <path d="M322 467 V808 M322 576 H358 M462 545 V503"/>
     <path className="flow-discussion-arrow" d="M876 279 L948 235" markerEnd={'url(#'+arrowId+')'}/>
     <path className="flow-discussion-arrow" d="M876 350 L948 394" markerEnd={'url(#'+arrowId+')'}/>
     <path className="flow-discussion-arrow" d="M1351 269 H1604" markerEnd={'url(#'+arrowId+')'}/>
    </g>
    <g className="flow-headings">
     <text x="12" y="32"><tspan fontWeight="750">STEP 1: </tspan>Underlying Vulnerability Score (0–2)</text>
     <text x="12" y="378"><tspan fontWeight="750">STEP 2: </tspan>Aggregate Trigger Score (0–8)</text>
     <text x="671" y="137"><tspan fontWeight="750">STEP 3: </tspan>First-level Needs Severity Score (0–10)<tspan x="671" dy="31">and flagging for NAWG discussion</tspan></text>
     <text x="1155" y="158"><tspan fontWeight="750">STEP 4: </tspan>NAWG contextual analysis</text>
     <text x="1595" y="188"><tspan fontWeight="750">STEP 5: </tspan>Final needs severity classification</text>
    </g>
    <text className="flow-annotation" x="315" y="319">Aggregation</text>
    {nodes.map(node=><FlowNode key={node.id} node={node} selected={chosen(node.id)} onSelect={setSelected}/>)}
    <TextNode id="not-flagged" x={970} y={218} lines={['Not flagged','for discussion']} label="Not flagged for discussion" detail="Unflagged results proceed with the first-level assessment to final classification. The discussion branch below identifies cases for contextual review." selected={chosen('not-flagged')} onSelect={setSelected}/>
    <TextNode id="flagged" x={974} y={396} lines={['Flagged for','discussion']} label="Flagged for discussion" detail="Flagged first-level results are discussed by NAWG members in contextual analysis before final classification." selected={chosen('flagged')} onSelect={setSelected}/>
    <TextNode id="member-inputs" x={900} y={316} lines={['NAWG member inputs']} label="NAWG member inputs" detail="NAWG member inputs help identify first-level results for discussion and contextual review." selected={chosen('member-inputs')} onSelect={setSelected} className="flow-bold"/>
    <TextNode id="expert-judgment" x={1378} y={202} lines={['Expert judgment','and weighting']} label="Expert judgment and weighting" detail="Expert judgment and weighting during NAWG contextual analysis inform the final county result." selected={chosen('expert-judgment')} onSelect={setSelected} className="flow-italic"/>
    <text className="flow-table-title" x="1633" y="365">Score range and needs<tspan x="1633" dy="30">severity classification</tspan></text>
    {bands.map((band,index)=>{
     const node={id:'band-'+band.id,label:'Severity '+band.id+' · '+band.label,detail:'The revised framework shows Band '+band.id+' ('+band.label+') at '+ranges[index]+'. These reference ranges explain the method; final ActivityInfo bands are preserved, not recalculated from these ranges.'};
     return <g key={band.id} id={'framework-'+node.id} className="flow-band" role="button" tabIndex={0} aria-label={node.label+', range '+ranges[index]+'. Show definition'} aria-pressed={chosen(node.id)} onClick={()=>setSelected(node)} onKeyDown={e=>activate(e,()=>setSelected(node))}>
      <rect x={1613} y={414+index*40} width={290} height={39} fill={band.color}/>
      <text x={1624} y={440+index*40} fill={band.id==='A'?'#fff':'#142c40'}>Severity {band.id}<tspan x="1800">{ranges[index]}</tspan></text>
     </g>;
    })}
   </svg>
  </div>
  <aside className={'framework-detail'+(selected?' is-open':'')} aria-live="polite" aria-label="Framework definition">
   {selected?<><div><span className="framework-detail-label">Framework definition</span><button type="button" className="icon-button" onClick={()=>setSelected(null)} aria-label="Close definition"><X size={18}/></button></div><h4>{selected.label}</h4>{selected.max!=null&&<p className="framework-max">Revised maximum contribution: {selected.max.toFixed(1)} points</p>}<p>{selected.detail}</p></>:<p>Select an element to explore its definition. The diagram explains the revised methodology; it does not recalculate ActivityInfo scores or bands.</p>}
  </aside>
 </section>;
}
