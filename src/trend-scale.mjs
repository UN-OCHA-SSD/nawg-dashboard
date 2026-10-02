const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Return a truthful NSS axis domain for the national trend. */
export function nationalTrendDomain(values, mode = 'focused') {
  if (mode === 'full') return [0, 10];

  const observed = values.filter(value => Number.isFinite(value));
  const minimum = observed.length ? Math.min(...observed) : null;
  const maximum = observed.length ? Math.max(...observed) : null;

  // Keep the familiar focused window, extending it whenever selected data
  // falls outside that window. Clamp only to the valid NSS scale (0–10).
  return [
    minimum == null ? 5 : clamp(Math.min(5, minimum), 0, 10),
    maximum == null ? 7.5 : clamp(Math.max(7.5, maximum), 0, 10),
  ];
}
