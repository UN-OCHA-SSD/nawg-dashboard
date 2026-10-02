import documentation from '../data/framework-documentation.json' with {type:'json'};

export function frameworkPageLabel(pages){
 const values=[...new Set(pages)].sort((a,b)=>a-b),groups=[];
 for(let i=0;i<values.length;i++){
  const start=values[i];let end=start;
  while(values[i+1]===end+1){end=values[++i];}
  groups.push(start===end?String(start):start+'–'+end);
 }
 return (values.length===1?'p. ':'pp. ')+groups.join(', ');
}
export function frameworkDocumentPath(page=1){
 if(!Number.isInteger(page)||page<1||page>documentation.source.pages)throw new Error('Invalid framework page');
 return documentation.source.file+'#page='+page;
}
export function frameworkExplanation(id){return documentation.nodes[id]||null;}
