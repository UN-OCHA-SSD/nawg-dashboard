import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {frameworkDocumentPath,frameworkPageLabel,frameworkExplanation} from '../src/framework-documentation.mjs';
const root=new URL('../',import.meta.url);
const doc=JSON.parse(fs.readFileSync(new URL('data/framework-documentation.json',root)));
const reference=JSON.parse(fs.readFileSync(new URL('data/nawg-reference.json',root)));

test('documentation links to the unchanged supplied PDF already in the publication allowlist',()=>{
 assert.ok(reference.reports.some(r=>r.file===doc.source.file&&r.kind==='framework'));
 assert.equal(doc.source.pages,13);
 const pdf=fs.readFileSync(new URL('public/'+doc.source.file,root));
 assert.equal(createHash('sha256').update(pdf).digest('hex'),doc.source.sha256);
 assert.equal(frameworkDocumentPath(11),doc.source.file+'#page=11');
 for(const p of [0,14,1.5,'11'])assert.throws(()=>frameworkDocumentPath(p));
});
test('all 29 diagram elements have source-backed definitions and valid page references',()=>{
 const ids=['demog','stock','ipclong','protection','flow','disease','afi','amn','conflict','climate','uvs-result','ats-result','qualitative-overlay','method-restrictions','first-level-nss','context-factors','compounding-shocks','assistance-access','final-result','not-flagged','flagged','member-inputs','expert-judgment',...['A','B','C','D','E','F'].map(b=>'band-'+b)];
 assert.deepEqual(Object.keys(doc.nodes).sort(),ids.sort());
 for(const id of ids){const entry=frameworkExplanation(id);assert.ok(entry.paragraphs.length);assert.ok(entry.pages.length);assert.ok(entry.pages.every(p=>Number.isInteger(p)&&p>=1&&p<=13));}
 assert.equal(frameworkExplanation('unknown'),null);
 assert.equal(frameworkPageLabel([4,5]),'pp. 4–5');
 assert.equal(frameworkPageLabel([9,11]),'pp. 9, 11');
 assert.equal(frameworkPageLabel([13]),'p. 13');
});
test('documented revised weights match approved definitions, including climate 1 and AMN 1.5',()=>{
 for(const indicator of reference.indicators)assert.equal(doc.nodes[indicator.id].weight,indicator.max_v2);
 assert.equal(doc.nodes.climate.weight,1);
 assert.equal(doc.nodes.amn.weight,1.5);
 assert.match(doc.nodes.amn.note,/internally inconsistent/);
 assert.match(doc.nodes.amn.note,/source-reported/);
 assert.match(doc.nodes.protection.note,/exactly equal to 1\.36/);
 assert.match(doc.nodes.flow.note,/2,500 and 5,000/);
});
test('review, follow-up and final-score rules are explained without changing observations',()=>{
 assert.ok(doc.nodes['method-restrictions'].bullets.some(s=>s.includes('6.0')));
 assert.ok(doc.nodes['final-result'].bullets.some(s=>s.includes('8.00')));
 assert.ok(doc.nodes['final-result'].bullets.some(s=>s.includes('6.9')));
 assert.match(doc.nodes['final-result'].note,/preserves the final ActivityInfo/);
 assert.equal(doc.guidance.length,4);
 assert.ok(doc.guidance.find(e=>e.id==='follow-up').bullets.some(s=>s.includes('Low information county')));
});
