import test from 'node:test';
import assert from 'node:assert/strict';
import {nationalTrendDomain} from '../src/trend-scale.mjs';

test('focused national trend defaults to the specified window',()=>{
  assert.deepEqual(nationalTrendDomain([5.4,6.2,7.4]),[5,7.5]);
});

test('focused domain expands to include filtered observations beyond either end',()=>{
  assert.deepEqual(nationalTrendDomain([4.7,6.1,8.2]),[4.7,8.2]);
  assert.deepEqual(nationalTrendDomain([0,10]),[0,10]);
});

test('missing observations are ignored and an empty selection keeps the default window',()=>{
  assert.deepEqual(nationalTrendDomain([null,undefined,NaN,6.3]),[5,7.5]);
  assert.deepEqual(nationalTrendDomain([null,undefined,NaN]),[5,7.5]);
});

test('full scale is always the complete NSS range',()=>{
  assert.deepEqual(nationalTrendDomain([5.4,6.2,7.4],'full'),[0,10]);
});
