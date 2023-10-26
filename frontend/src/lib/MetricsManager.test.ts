/**
 * @license
 * Copyright 2018-2020 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Disable Typescript checking, since mm.track and identify have private scope
// @ts-nocheck
import { SessionInfo } from "lib/SessionInfo"
import { getMetricsManagerForTest } from "lib/MetricsManagerTestUtils"

jest.mock("lib/utils", () => ({
  isInChildFrame: jest.fn(x => true),
}))

beforeEach(() => {
  SessionInfo.current = new SessionInfo({
    sessionId: "sessionId",
    streamlitVersion: "sv",
    pythonVersion: "pv",
    installationId: "iid",
    installationIdV1: "iid1",
    installationIdV2: "iid2",
    authorEmail: "ae",
    maxCachedMessageAge: 2,
    commandLine: "command line",
    userMapboxToken: "mbx",
  })
})

afterEach(() => {
  SessionInfo.singleton = undefined
  window.analytics = undefined
})

test("does not track while uninitialized", () => {
  const mm = getMetricsManagerForTest()

  mm.enqueue("ev1", { data1: 11 })
  mm.enqueue("ev2", { data2: 12 })
  mm.enqueue("ev3", { data3: 13 })

  expect(mm.track.mock.calls.length).toBe(0)
  expect(mm.identify.mock.calls.length).toBe(0)
})

test("does not track when initialized with gatherUsageStats=false", () => {
  const mm = getMetricsManagerForTest()
  mm.initialize({ gatherUsageStats: false })

  mm.enqueue("ev1", { data1: 11 })
  mm.enqueue("ev2", { data2: 12 })
  mm.enqueue("ev3", { data3: 13 })

  expect(mm.track.mock.calls.length).toBe(0)
  expect(mm.identify.mock.calls.length).toBe(0)
})

test("does not initialize Segment analytics when gatherUsageStats=false", () => {
  const mm = getMetricsManagerForTest()
  expect(window.analytics).toBeUndefined()
  mm.initialize({ gatherUsageStats: false })
  expect(window.analytics).toBeUndefined()
})

test("initializes Segment analytics when gatherUsageStats=true", () => {
  const mm = getMetricsManagerForTest()
  expect(window.analytics).toBeUndefined()
  mm.initialize({ gatherUsageStats: true })
  expect(window.analytics).toBeDefined()
  expect(window.analytics.invoked).toBe(true)
  expect(window.analytics.methods).toHaveLength(20)
  expect(window.analytics.load).toBeDefined()
})

test("enqueues events before initialization", () => {
  const mm = getMetricsManagerForTest()

  mm.enqueue("ev1", { data1: 11 })
  mm.enqueue("ev2", { data2: 12 })
  mm.enqueue("ev3", { data3: 13 })

  expect(mm.track.mock.calls.length).toBe(0)

  mm.initialize({ gatherUsageStats: true })

  expect(mm.track.mock.calls.length).toBe(3)
  expect(mm.identify.mock.calls.length).toBe(1)
  expect(mm.identify.mock.calls[0][0]).toBe(SessionInfo.current.installationId)
  expect(mm.identify.mock.calls[0][1]).toMatchObject({
    authoremail: SessionInfo.current.authorEmail,
  })
})

test("tracks events immediately after initialized", () => {
  const mm = getMetricsManagerForTest()
  mm.initialize({ gatherUsageStats: true })

  expect(mm.track.mock.calls.length).toBe(0)
  mm.enqueue("ev1", { data1: 11 })
  expect(mm.track.mock.calls.length).toBe(1)
  mm.enqueue("ev2", { data2: 12 })
  expect(mm.track.mock.calls.length).toBe(2)
  mm.enqueue("ev3", { data3: 13 })
  expect(mm.track.mock.calls.length).toBe(3)
})

test("tracks host data when in an iFrame", () => {
  window.parent.streamlitShareMetadata = {
    hostedAt: "S4A",
    k: "v",
  }

  const mm = getMetricsManagerForTest()
  mm.initialize({ gatherUsageStats: true })
  mm.enqueue("ev1", { data1: 11 })

  expect(mm.identify.mock.calls[0][1]).toMatchObject({
    hostedAt: "S4A",
  })
  expect(mm.track.mock.calls[0][1]).toMatchObject({
    hostedAt: "S4A",
    data1: 11,
  })
  expect(mm.track.mock.calls[0][1]).not.toMatchObject({
    k: "v",
  })
})

test("tracks installation data", () => {
  const mm = getMetricsManagerForTest()
  mm.initialize({ gatherUsageStats: true })
  mm.enqueue("ev1", { data1: 11 })

  expect(mm.identify.mock.calls[0][1]).toMatchObject({
    machineIdV1: SessionInfo.current.installationIdV1,
    machineIdV2: SessionInfo.current.installationIdV2,
  })
  expect(mm.track.mock.calls[0][1]).toMatchObject({
    machineIdV1: SessionInfo.current.installationIdV1,
    machineIdV2: SessionInfo.current.installationIdV2,
  })
})

test("increments deltas", () => {
  const mm = getMetricsManagerForTest()

  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")

  const counter = mm.getAndResetDeltaCounter()

  expect(counter.foo).toBe(3)
  expect(counter.bar).toBe(2)
  expect(counter.boz).toBeUndefined()
})

test("clears deltas", () => {
  const mm = getMetricsManagerForTest()

  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")

  mm.clearDeltaCounter()
  const counter = mm.getAndResetDeltaCounter()

  expect(Object.keys(counter).length).toBe(0)
})

test("clears deltas automatically on read", () => {
  const mm = getMetricsManagerForTest()

  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")
  mm.incrementDeltaCounter("foo")
  mm.incrementDeltaCounter("bar")

  const counter1 = mm.getAndResetDeltaCounter()
  const counter2 = mm.getAndResetDeltaCounter()

  expect(Object.keys(counter1).length).toBe(2)
  expect(Object.keys(counter2).length).toBe(0)
})
