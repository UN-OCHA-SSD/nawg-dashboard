import React,{useEffect,useMemo,useState} from 'react';
import {Play,Pause,CaretLeft,CaretRight} from '@phosphor-icons/react';
import {calendarPeriods,periodLabel} from './data-model.mjs';
export function MonthTimeline({model,period,onPeriod}) {
  const months=useMemo(()=>calendarPeriods(model.periods),[model]);
  const [playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1400);
  const index=Math.max(0,months.indexOf(period));
  useEffect(()=>{
    if(!playing)return;
    if(index>=months.length-1){setPlaying(false);return;}
    const timer=setTimeout(()=>onPeriod(months[index+1]),speed);
    return()=>clearTimeout(timer);
  },[playing,index,months,speed,onPeriod]);
  useEffect(()=>{const pause=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
  function select(i){setPlaying(false);onPeriod(months[i]);}
  function toggle(){if(!playing&&index===months.length-1)onPeriod(months[0]);setPlaying(!playing);}
  return <section className="month-timeline" aria-label="Monthly map timeline">
    <div className="timeline-controls"><button className="timeline-play" aria-label={playing?'Pause timeline':'Play timeline'} aria-pressed={playing} onClick={toggle}>{playing?<Pause weight="fill"/>:<Play weight="fill"/>}</button><button className="icon-button" aria-label="Previous month" disabled={index===0} onClick={()=>select(index-1)}><CaretLeft/></button><div className="timeline-period"><strong>{periodLabel(period)}</strong><span>{!model.coverage[period]?'No reports this month':model.coverage[period].valid<model.counties.length*.8?'Partial reporting':'Monthly view'}</span></div><button className="icon-button" aria-label="Next month" disabled={index===months.length-1} onClick={()=>select(index+1)}><CaretRight/></button><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={2400}>Slow</option><option value={1400}>Normal</option><option value={700}>Fast</option></select></div>
    <div className="timeline-track"><input type="range" min="0" max={months.length-1} value={index} onChange={e=>select(Number(e.target.value))} aria-label="Timeline month" aria-valuetext={periodLabel(period,false)}/><div><span>{periodLabel(months[0])}</span><span>{periodLabel(months.at(-1))}</span></div></div>
  </section>;
}
