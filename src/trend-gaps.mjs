// Calendar-ordered input, with unavailable months retained as null scores.
// Return observed endpoints only: these guides never impute monthly values.
export function trendGapSegments(data) {
  const segments = [];
  let previous = -1;
  data.forEach((point, index) => {
    if (!Number.isFinite(point.score)) return;
    if (previous >= 0 && index > previous + 1) {
      segments.push([
        {x: data[previous].period, y: data[previous].score},
        {x: point.period, y: point.score},
      ]);
    }
    previous = index;
  });
  return segments;
}
