import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastCatchUp, linearRegressionSlope } from '../src/domain.js';

test('CFM regression slope anchors at current actual and caps at Plan', () => {
  const slope = linearRegressionSlope([1418,1591,1792,1920].map((value,i) => ({week:36+i,value})));
  assert.equal(slope,170.7);
  const f = forecastCatchUp(2000,2295,slope,40);
  assert.equal(f.week,42);
  assert.deepEqual(f.points.map(p=>p.value),[2000,2170.7,2295]);
  assert.equal(linearRegressionSlope([]),null);
  assert.equal(linearRegressionSlope([{week:1,value:0},{week:2,value:0}]),0);
  assert.equal(linearRegressionSlope([{week:1,value:2},{week:2,value:1}]),-1);
  assert.equal(forecastCatchUp(1,3,-1,40).state,'rate_unavailable');
});
test('empty, unavailable and reached forecast states are distinct',()=>{
  assert.equal(forecastCatchUp(0,0,0,40).state,'no_applicable_plan');
  assert.equal(forecastCatchUp(null,2,1,40).state,'actual_unavailable');
  assert.equal(forecastCatchUp(2,2,0,40).state,'reached');
  assert.equal(forecastCatchUp(0,2,0,40).state,'rate_unavailable');
  assert.equal(forecastCatchUp(1,3,1,40).week,42);
});
