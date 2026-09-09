// Add confirmed product URLs here. Null means no link has been supplied.
// These are month slots, not claims that reports have already been published.
export const monthlyPublications=Array.from({length:12},(_,i)=>({
  period:'2026-'+String(i+1).padStart(2,'0'),pdfUrl:null,reliefWebUrl:null,
}));
