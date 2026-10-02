import React from 'react';
import {ArrowSquareOut,DownloadSimple,FilePdf} from '@phosphor-icons/react';
import documentation from '../data/framework-documentation.json';
import {assetUrl} from './deployment.mjs';
import {frameworkDocumentPath,frameworkPageLabel,frameworkExplanation} from './framework-documentation.mjs';
import './framework-explanation.css';

export function FrameworkSourceLink({pages,className=''}){
 return <a className={'text-button framework-source-link '+className} href={assetUrl(frameworkDocumentPath(pages[0]))} target="_blank" rel="noreferrer">Framework PDF · {frameworkPageLabel(pages)}<ArrowSquareOut size={15}/></a>;
}
function ExplanationBody({entry}){
 return <>{entry.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}{entry.bullets&&<ul>{entry.bullets.map(bullet=><li key={bullet}>{bullet}</li>)}</ul>}</>;
}
export function FrameworkExplanation({node}){
 const entry=frameworkExplanation(node.id);
 if(!entry)return <p>{node.detail}</p>;
 const scores=entry.scoring==='percentile'?documentation.percentileScores:entry.scores;
 return <div className="framework-explanation"><ExplanationBody entry={entry}/>{scores&&<details className="framework-scoring"><summary>Base scores and thresholds</summary><p>These are the documented base scores, not additional dashboard observations.{entry.weight!=null?' Multiply the base score by the revised weight of '+entry.weight.toFixed(1)+' to obtain its weighted contribution.':''}</p><div className="table-scroll"><table><thead><tr><th>Classification</th><th>Indicator threshold</th><th>Base score</th></tr></thead><tbody>{scores.map(([level,threshold,score])=><tr key={level}><td>{level}</td><td>{threshold}</td><td>{score}</td></tr>)}</tbody></table></div></details>}{entry.note&&<p className="framework-document-note">{entry.note}</p>}<FrameworkSourceLink pages={entry.pages}/></div>;
}
export function FrameworkGuidance(){
 return <section className="framework-guidance" aria-label="Framework guidance"><div className="framework-document-actions"><a className="secondary" href={assetUrl(documentation.source.file)} target="_blank" rel="noreferrer"><FilePdf size={18}/>Read the full framework · {documentation.source.pages} pages<ArrowSquareOut size={16}/></a><a className="text-button" href={assetUrl(documentation.source.file)} download="NAWG_Framework.pdf"><DownloadSimple size={17}/>Download PDF</a></div><p className="small-note">Explanations are based on the supplied NAWG_Framework.pdf. Each diagram element links to its relevant source pages. The PDF is a methodology reference, not an input to dashboard calculations.</p><div className="framework-guidance-list">{documentation.guidance.map(entry=><details className="framework-guidance-item" key={entry.id} id={'framework-guidance-'+entry.id}><summary>{entry.title}</summary><div><ExplanationBody entry={entry}/><FrameworkSourceLink pages={entry.pages}/></div></details>)}</div></section>;
}
