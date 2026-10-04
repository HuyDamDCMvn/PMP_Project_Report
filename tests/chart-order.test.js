import test from "node:test";
import assert from "node:assert/strict";
import { moveItem, orderedKeys } from "../src/chart-order.js";

test("chart moves preserve every key and do not mutate inputs", () => {
  const keys = ["a", "b", "c"];
  assert.deepEqual(moveItem(keys, 0, 2), ["b", "c", "a"]);
  assert.deepEqual(moveItem(keys, 2, 0), ["c", "a", "b"]);
  assert.deepEqual(moveItem(keys, 0, -1), keys);
  assert.deepEqual(keys, ["a", "b", "c"]);
});

test("saved layouts discard removed keys, deduplicate and append new charts", () => {
  assert.deepEqual(orderedKeys(["a", "b", "c"], ["b", "deleted", "b", "a"]), ["b", "a", "c"]);
});
