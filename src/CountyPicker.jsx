import React,{useEffect,useMemo,useRef,useState} from 'react';
import {CaretDown,MagnifyingGlass,Check} from '@phosphor-icons/react';
export function CountyPicker({counties,selected,onSelect}) {
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),root=useRef(null),input=useRef(null);
  const county=counties.find(c=>c.key===selected);
  const matches=useMemo(()=>counties.filter(c=>(c.name+' '+c.state).toLowerCase().includes(query.toLowerCase().trim())).sort((a,b)=>a.state.localeCompare(b.state)||a.name.localeCompare(b.name)),[counties,query]);
  const states=[...new Set(matches.map(c=>c.state))];
  useEffect(()=>{if(open){setQuery('');setActive(0);input.current?.focus({preventScroll:true});}},[open]);
  useEffect(()=>{const close=e=>{if(!root.current?.contains(e.target))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
  useEffect(()=>{
    if(!open)return;
    const list=root.current?.querySelector('#county-options'),option=list?.querySelector('[data-highlighted="true"]');
    if(!list||!option)return;
    // Scroll only the county list, never its ancestors or the whole dashboard.
    const listTop=list.getBoundingClientRect().top,optionBox=option.getBoundingClientRect();
    if(optionBox.top<listTop)list.scrollTop+=optionBox.top-listTop;
    else if(optionBox.bottom>listTop+list.clientHeight)list.scrollTop+=optionBox.bottom-listTop-list.clientHeight;
  },[active,open,matches]);
  function choose(key){onSelect(key);setOpen(false);root.current?.querySelector('.county-picker-trigger')?.focus({preventScroll:true});}
  return <div className="county-picker filter-field" ref={root}><span>County / state</span><button className="county-picker-trigger" aria-label="Choose county" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(!open)}><span>{county?.name}<small>{county?.state}</small></span><CaretDown/></button>{open&&<div className="county-picker-popover"><div className="picker-search"><MagnifyingGlass/><input ref={input} role="combobox" aria-label="Search county or state" aria-expanded={open} aria-controls="county-options" aria-activedescendant={matches[active]?'option-'+matches[active].key:undefined} value={query} placeholder="Search county or state…" onChange={e=>{setQuery(e.target.value);setActive(0);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);root.current.querySelector('button').focus({preventScroll:true});}if(e.key==='ArrowDown'){e.preventDefault();setActive(a=>Math.min(a+1,matches.length-1));}if(e.key==='ArrowUp'){e.preventDefault();setActive(a=>Math.max(a-1,0));}if(e.key==='Enter'&&matches[active]){e.preventDefault();choose(matches[active].key);}}}/></div><div id="county-options" role="listbox" aria-label="Counties grouped by state">{states.map(state=><div key={state} role="group" aria-label={state}><h3>{state}</h3>{matches.filter(c=>c.state===state).map(c=><button id={'option-'+c.key} role="option" aria-selected={selected===c.key} data-highlighted={matches[active]?.key===c.key} key={c.key} onClick={()=>choose(c.key)}>{c.name}{selected===c.key&&<Check/>}</button>)}</div>)}{!matches.length&&<p>No county or state matches “{query}”.</p>}</div></div>}</div>;
}
