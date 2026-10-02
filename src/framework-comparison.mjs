import { recordScore } from './data-model.mjs';

export const FRAMEWORK_REFERENCE_TOLERANCE = 1e-8;

function selectedScope(filters, model, expected) {
  if (filters?.state || filters?.county || filters?.states?.length) return true;
  if (!filters?.counties) return false;
  const selected = new Set(filters.counties.map(county => typeof county === 'string' ? county : county.key));
  const national = new Set(model.counties.map(county => county.key));
  return selected.size !== expected || national.size !== expected
    || [...national].some(key => !selected.has(key));
}

function periodStats(model, period) {
  const total = model.counties.length;
  const cells = model.counties.map(county => model.cells.get(period + '/' + county.key));
  const resolved = cells.map(cell => cell?.row ? recordScore(cell.row) : null).filter(Number.isFinite);
  const conflicts = cells.filter(cell => cell?.conflict).length;
  return {
    period,
    total,
    resolved: resolved.length,
    conflicts,
    mean: resolved.length ? resolved.reduce((sum, score) => sum + score, 0) / resolved.length : null,
  };
}

function validRange(cycle) {
  const {lowerMean: lower, midpointMean: midpoint, upperMean: upper} = cycle;
  return [lower, midpoint, upper].every(Number.isFinite)
    && lower >= 0 && upper <= 10 && lower <= midpoint && midpoint <= upper
    && Math.abs(midpoint - (lower + upper) / 2) <= 1e-8;
}

function meanMatches(stats, expected) {
  return Number.isFinite(stats.mean) && Math.abs(stats.mean - expected) <= FRAMEWORK_REFERENCE_TOLERANCE;
}

/** Pair ActivityInfo national means with the supplied monthly framework reference. */
export function frameworkComparisonForPeriod(model, selectedPeriod, reference, filters = {}) {
  const study = reference?.study ?? null;
  const expected = Number(study?.expectedCountyCount);
  const uniqueCountyKeys = new Set(model.counties.map(county => county.key)).size;
  const national = Number.isInteger(expected) && !selectedScope(filters, model, expected)
    && model.counties.length === expected && uniqueCountyKeys === expected;
  const rows = (reference?.cycles ?? [])
    .filter(cycle => cycle.cycle <= selectedPeriod)
    .map(cycle => {
      const current = periodStats(model, cycle.cycle);
      const previous = periodStats(model, cycle.priorCycle);
      let reason = null;
      if (!national) reason = 'national-scope-required';
      else if (current.total !== expected || previous.total !== expected
        || current.resolved !== expected || previous.resolved !== expected
        || current.conflicts || previous.conflicts) reason = 'incomplete-or-conflicting-coverage';
      else if (!meanMatches(current, cycle.published2026Mean)
        || !meanMatches(previous, cycle.published2025Mean)) reason = 'activityinfo-source-mismatch';
      else if (!validRange(cycle)) reason = 'invalid-reference-range';

      return {
        period: cycle.cycle,
        priorPeriod: cycle.priorCycle,
        published2026: current.mean,
        published2025: previous.mean,
        lower: reason === null ? cycle.lowerMean : null,
        midpoint: reason === null ? cycle.midpointMean : null,
        upper: reason === null ? cycle.upperMean : null,
        n: current.resolved,
        nPrior: previous.resolved,
        available: reason === null,
        reason,
      };
    });

  const reason = !national ? 'national-scope-required'
    : !rows.length ? 'no-reference-for-period'
    : rows.every(row => !row.available) ? 'no-validated-reference'
    : null;
  return {study, scope:'national', selectedPeriod, rows, reason};
}
