import test from 'node:test';
import assert from 'node:assert/strict';
import reference from '../data/framework-comparison-reference.json' with {type:'json'};
import { frameworkComparisonForPeriod } from '../src/framework-comparison.mjs';

function makeModel({missing = [], conflicts = [], means = {}} = {}) {
  const counties = Array.from({length:79}, (_, index) => ({key:'county-'+index, name:'County '+index, state:'State'}));
  const cells = new Map();
  for (const cycle of reference.cycles) {
    for (const [period, mean] of [[cycle.cycle, means[cycle.cycle] ?? cycle.published2026Mean], [cycle.priorCycle, means[cycle.priorCycle] ?? cycle.published2025Mean]]) {
      counties.forEach((county, index) => {
        const id = period+'/'+county.key;
        if (missing.includes(id)) return;
        cells.set(id, conflicts.includes(id)
          ? {row:null,score:null,conflict:true}
          : {row:{needs_severity_score_NSS_edited:mean},score:mean,conflict:false});
      });
    }
  }
  return {counties,cells};
}

test('aligned full national ActivityInfo periods expose the source range and retain observed means', () => {
  const result = frameworkComparisonForPeriod(makeModel(), '2026-06', reference);
  const point = result.rows.at(-1);
  assert.equal(point.available, true);
  assert.ok(Math.abs(point.published2026 - reference.cycles.at(-1).published2026Mean) < 1e-12);
  assert.ok(Math.abs(point.published2025 - reference.cycles.at(-1).published2025Mean) < 1e-12);
  assert.deepEqual([point.lower,point.midpoint,point.upper], [
    reference.cycles.at(-1).lowerMean,
    reference.cycles.at(-1).midpointMean,
    reference.cycles.at(-1).upperMean,
  ]);
});

test('study points after the selected period are excluded without interpolation', () => {
  const result = frameworkComparisonForPeriod(makeModel(), '2026-02', reference);
  assert.deepEqual(result.rows.map(point => point.period), ['2026-01','2026-02']);
});

test('full county selection remains national while a subset withholds reference bounds', () => {
  const model = makeModel();
  const national = frameworkComparisonForPeriod(model, '2026-06', reference, {counties:model.counties});
  const subset = frameworkComparisonForPeriod(model, '2026-06', reference, {counties:model.counties.slice(0,78)});
  assert.equal(national.rows.at(-1).available, true);
  assert.equal(subset.rows.at(-1).reason, 'national-scope-required');
  assert.equal(subset.rows.at(-1).lower, null);
});

test('bounds are withheld for filtered, incomplete, conflicting or changed ActivityInfo data', () => {
  const complete = makeModel();
  const missingId = '2026-06/county-78';
  const conflictId = '2025-06/county-0';
  const cases = [
    [complete, {state:'Upper Nile'}, 'national-scope-required'],
    [makeModel({missing:[missingId]}), {}, 'incomplete-or-conflicting-coverage'],
    [makeModel({conflicts:[conflictId]}), {}, 'incomplete-or-conflicting-coverage'],
    [makeModel({means:{'2026-06':reference.cycles.at(-1).published2026Mean + 0.0001}}), {}, 'activityinfo-source-mismatch'],
  ];
  for (const [model, filters, reason] of cases) {
    const point = frameworkComparisonForPeriod(model, '2026-06', reference, filters).rows.at(-1);
    assert.equal(point.available, false);
    assert.equal(point.reason, reason);
    assert.equal(point.lower, null);
    assert.equal(point.upper, null);
    assert.equal(typeof point.published2026, 'number');
  }
});

test('inconsistent sensitivity midpoint is rejected', () => {
  const invalid = structuredClone(reference);
  invalid.cycles[5].midpointMean += 0.01;
  const point = frameworkComparisonForPeriod(makeModel(), '2026-06', invalid).rows.at(-1);
  assert.equal(point.available, false);
  assert.equal(point.reason, 'invalid-reference-range');
  assert.equal(point.lower, null);
  assert.equal(point.upper, null);
});
