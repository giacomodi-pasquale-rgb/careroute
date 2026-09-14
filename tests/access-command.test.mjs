import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticAccessEvents, summarizeAccess, estimateOpportunity } from '../access-command.js';

test('command center summary reconciles searches', () => {
  const s=summarizeAccess(syntheticAccessEvents);
  assert.equal(s.successful+s.unsuccessful,s.searches);
  assert.ok(s.completionRate>0 && s.completionRate<1);
});

test('opportunity scenario cannot recover more than affected searches', () => {
  const o=estimateOpportunity(syntheticAccessEvents,'service',.35);
  assert.ok(o.recovered<=o.affected);
  assert.ok(o.newCompletionRate<1);
});
