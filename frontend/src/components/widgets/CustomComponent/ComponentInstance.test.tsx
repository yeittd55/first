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

import {
  ComponentInstance as ComponentInstanceProto,
  SpecialArg,
} from "autogen/proto"
import Alert from "components/elements/Alert"
import ErrorElement from "components/shared/ErrorElement"
import { ReactWrapper } from "enzyme"
import {
  DEFAULT_IFRAME_FEATURE_POLICY,
  DEFAULT_IFRAME_SANDBOX_POLICY,
} from "lib/IFrameUtil"
import { logWarning } from "lib/log"
import { mount } from "lib/test_util"
import { buildHttpUri } from "lib/UriUtil"
import { WidgetStateManager } from "lib/WidgetStateManager"
import React from "react"
import {
  COMPONENT_READY_WARNING_TIME_MS,
  ComponentInstance,
  CUSTOM_COMPONENT_API_VERSION,
  Props,
  State,
} from "./ComponentInstance"
import { ComponentRegistry } from "./ComponentRegistry"
import { ComponentMessageType, StreamlitMessageType } from "./enums"

// Mock log functions.
jest.mock("lib/log")

// We have some timeouts that we want to use fake timers for.
jest.useFakeTimers()

// Mock uri utils.
jest.mock("lib/UriUtil")
const mockedBuildHttpUri = buildHttpUri as jest.Mock
mockedBuildHttpUri.mockImplementation(() => "registry/url")

// Mock our WidgetStateManager
jest.mock("lib/WidgetStateManager")

const MOCK_COMPONENT_URL = "http://a.mock.url"
const MOCK_WIDGET_ID = "mock_widget_id"
const MOCK_COMPONENT_NAME = "mock_component_name"

/**
 * Encapsulates all the plumbing for mocking a component,
 * sending it data, and receiving its messages.
 */
class MockComponent {
  public readonly registry: ComponentRegistry

  public readonly wrapper: ReactWrapper<Props, State, ComponentInstance>

  public readonly instance: ComponentInstance

  /**
   * A mock that will receive ForwardMsgs posted from the ComponentInstance
   * under test to its iframe.
   */
  public readonly receiveForwardMsg: jest.SpyInstance

  public constructor(
    initialJSONArgs: { [name: string]: any } = {},
    initialSpecialArgs: SpecialArg[] = []
  ) {
    const mountNode = document.createElement("div")
    document.body.appendChild(mountNode)

    // mock ComponentRegistry
    this.registry = new ComponentRegistry(() => {
      return {
        host: "streamlit.mock",
        port: 80,
        basePath: "",
      }
    })

    // Mock the registry's registerListener/deregisterListener - we assert
    // that these are called in our tests.
    this.registry.registerListener = jest.fn()
    this.registry.deregisterListener = jest.fn()

    // Create and mount our ComponentInstance. We need to mount it to an
    // existing DOM element - otherwise, iframe contentWindow is not available.
    // @ts-ignore
    this.wrapper = mount(
      <ComponentInstance
        element={createElementProp(initialJSONArgs, initialSpecialArgs)}
        registry={this.registry}
        width={100}
        disabled={false}
        widgetMgr={new WidgetStateManager(jest.fn())}
      />,
      { attachTo: mountNode }
    )

    this.instance = this.wrapper.instance()

    // Ensure we mounted without error.
    expect(this.instance.state.componentError).toBeUndefined()

    // Spy on the ComponentInstance's iframe's postMessage function.
    const unsafeInstance = this.instance as any
    this.receiveForwardMsg = jest.spyOn(
      unsafeInstance.iframeRef.current.contentWindow,
      "postMessage"
    )
  }

  /** The component's WidgetID */
  public get widgetId(): string {
    return this.instance.props.element.id
  }

  /** The component's frameHeight string */
  public get frameHeight(): string | undefined {
    const unsafeInstance = this.instance as any
    if (unsafeInstance.iframeRef.current == null) {
      return undefined
    }

    return unsafeInstance.iframeRef.current.height
  }

  /**
   * Post a mock ComponentMessage from our component iframe to the mocked
   * ComponentInstance.
   */
  public sendBackMsg(type: string, data: any): void {
    // Call the ComponentInstance.onBackMsg private function. This is an
    // event handler that responds to BackMessage events posted from
    // the iframe - but since we're mocking the iframe, we hack around that.
    const unsafeInstance = this.instance as any
    unsafeInstance.onBackMsg(type, data)

    // Synchronize the enzyme wrapper's tree snapshot
    this.wrapper.update()
  }
}

describe("ComponentInstance", () => {
  beforeEach(() => {
    // Clear our class mocks
    const mockWidgetStateManager = WidgetStateManager as any
    mockWidgetStateManager.mockClear()

    const mockLog = logWarning as any
    mockLog.mockClear()
  })

  it("registers a message listener on mount", () => {
    const mc = new MockComponent()
    expect(mc.registry.registerListener).toHaveBeenCalled()
    expect(mc.registry.deregisterListener).not.toHaveBeenCalled()
  })

  it("deregisters its message listener on unmount", () => {
    const mc = new MockComponent()
    mc.wrapper.unmount()
    expect(mc.registry.deregisterListener).toHaveBeenCalled()
  })

  it("renders its iframe correctly", () => {
    // This is not an exhaustive check of rendering props - instead, it's
    // the props whose values are functionally important.
    const mc = new MockComponent()
    const iframe = mc.wrapper.childAt(0)
    expect(iframe.type()).toEqual("iframe")
    expect(iframe.prop("src")).toContain(MOCK_COMPONENT_URL)
    expect(iframe.prop("allow")).toEqual(DEFAULT_IFRAME_FEATURE_POLICY)
    expect(iframe.prop("sandbox")).toEqual(DEFAULT_IFRAME_SANDBOX_POLICY)
  })

  it("sends JSON args to iframe", () => {
    const mc = new MockComponent()

    // We should receive an initial RENDER message with no arguments
    mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
    expect(mc.receiveForwardMsg).toHaveBeenLastCalledWith(
      renderMsg({}, []),
      "*"
    )

    // Simulate passing JSON arguments to the component.
    const jsonArgs = { foo: "string", bar: 5 }
    const element = createElementProp(jsonArgs, [])
    mc.wrapper.setProps({ element })

    expect(mc.instance.state.componentError).toBeUndefined()

    // We should get those JSON arguments in our receiveForwardMsg callback.
    expect(mc.receiveForwardMsg).toHaveBeenLastCalledWith(
      renderMsg(jsonArgs, []),
      "*"
    )
  })

  it("sends bytes args to iframe", () => {
    const mc = new MockComponent()

    // We should receive an initial RENDER message with no arguments
    mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
    expect(mc.receiveForwardMsg).toHaveBeenLastCalledWith(
      renderMsg({}, []),
      "*"
    )

    // Bytes are passed from the backend as "SpecialArgs".
    const key1 = "bytes1"
    const bytes1 = new Uint8Array([0, 1, 2, 3])
    const key2 = "bytes2"
    const bytes2 = new Uint8Array([4, 5, 6, 7])
    const element = createElementProp({}, [
      SpecialArg.create({ key: key1, bytes: bytes1 }),
      SpecialArg.create({ key: key2, bytes: bytes2 }),
    ])
    mc.wrapper.setProps({ element })

    expect(mc.instance.state.componentError).toBeUndefined()

    // The iframe receives bytes in its args dict, alongside JSON.
    // The funny `[key1]: bytes1` syntax is because these are computed
    // property names (and not string literals).
    expect(mc.receiveForwardMsg).toHaveBeenLastCalledWith(
      renderMsg({ [key1]: bytes1, [key2]: bytes2 }, []),
      "*"
    )
  })

  it("sends dataframe args to iframe", () => {
    // TODO for Henrikh
  })

  describe("COMPONENT_READY handler", () => {
    it("posts a RENDER message to the iframe", () => {
      // When the component iframe sends the COMPONENT_READY message,
      // ComponentInstance should respond with a RENDER message with the
      // most recent args.
      const jsonArgs = { foo: "string", bar: 5 }
      const mc = new MockComponent(jsonArgs)
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
      expect(mc.receiveForwardMsg).toHaveBeenCalledWith(
        renderMsg(jsonArgs, []),
        "*"
      )

      const child = mc.wrapper.childAt(0)
      expect(child.type()).toEqual("iframe")
    })

    it("prevents RENDER message until component is ready", () => {
      // If the component gets new arguments, it shouldn't send them along
      // until COMPONENT_READY is sent.
      const mc = new MockComponent()
      expect(mc.receiveForwardMsg).not.toHaveBeenCalled()

      // Not ready...
      const args1 = { foo: "ahoy", bar: "matey" }
      mc.wrapper.setProps({ element: createElementProp(args1) })
      expect(mc.receiveForwardMsg).not.toHaveBeenCalled()

      // Still not ready...
      const args2 = { foo: "shiverme", bar: "timbers" }
      mc.wrapper.setProps({ element: createElementProp(args2) })
      expect(mc.receiveForwardMsg).not.toHaveBeenCalled()

      // NOW we're ready!
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
      expect(mc.receiveForwardMsg).toHaveBeenCalledWith(
        renderMsg(args2, []),
        "*"
      )
    })

    it("can be called multiple times", () => {
      // It's not an error for a component to call READY multiple times.
      // (This can happen during development, when the component's devserver
      // reloads.)
      const jsonArgs = { foo: "string", bar: 5 }
      const mc = new MockComponent(jsonArgs)
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })

      expect(mc.receiveForwardMsg).toHaveBeenCalledTimes(3)
      for (let ii = 1; ii <= 3; ++ii) {
        expect(mc.receiveForwardMsg).toHaveBeenNthCalledWith(
          ii,
          renderMsg(jsonArgs, []),
          "*"
        )
      }
    })

    it("errors on unrecognized API version", () => {
      const badAPIVersion = CUSTOM_COMPONENT_API_VERSION + 1
      const mock = new MockComponent()
      mock.sendBackMsg(ComponentMessageType.COMPONENT_READY, {
        apiVersion: badAPIVersion,
      })

      const child = mock.wrapper.childAt(0)
      expect(child.type()).toEqual(ErrorElement)
      expect(child.prop("message")).toEqual(
        `Unrecognized component API version: '${badAPIVersion}'`
      )
    })

    it("warns if COMPONENT_READY hasn't been received after a timeout", () => {
      // Create a component, but don't send COMPONENT_READY
      const mock = new MockComponent()
      expect(mock.instance.state.readyTimeout).toBe(false)

      // Advance past our warning timeout, and force a re-render.
      jest.advanceTimersByTime(COMPONENT_READY_WARNING_TIME_MS)
      expect(mock.instance.state.readyTimeout).toBe(true)
      mock.wrapper.setProps({}) // (re-render)

      const child = mock.wrapper.childAt(0)
      expect(child.type()).toEqual(Alert)
      expect(child.prop("body")).toContain(
        "The app is attempting to load the component from"
      )

      // Belatedly send the COMPONENT_READY message
      mock.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })

      // Ensure we're now displaying our iframe, and not the warning.
      expect(mock.wrapper.childAt(0).type()).toEqual("iframe")
    })
  })

  describe("SET_COMPONENT_VALUE handler", () => {
    it("handles JSON values", () => {
      const jsonValue = {
        foo: "string",
        bar: 123,
        list: [1, "foo", false],
      }

      const mc = new MockComponent()
      // We must send COMPONENT_READY before SET_COMPONENT_VALUE
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
      mc.sendBackMsg(ComponentMessageType.SET_COMPONENT_VALUE, {
        dataType: "json",
        value: jsonValue,
      })

      // Ensure we didn't create an ErrorElement
      const child = mc.wrapper.childAt(0)
      expect(child.type()).toEqual("iframe")

      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setJsonValue).toHaveBeenCalledWith(
        mc.widgetId,
        jsonValue,
        { fromUi: true }
      )
    })

    it("handles bytes values", () => {
      const mc = new MockComponent()
      mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })

      const bytesValue = new Uint8Array([0, 1, 2])
      mc.sendBackMsg(ComponentMessageType.SET_COMPONENT_VALUE, {
        dataType: "bytes",
        value: bytesValue,
      })

      // Ensure we didn't create an ErrorElement
      const child = mc.wrapper.childAt(0)
      expect(child.type()).toEqual("iframe")

      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setBytesValue).toHaveBeenCalledWith(
        mc.widgetId,
        bytesValue,
        { fromUi: true }
      )
    })

    it("handles dataframe values", () => {
      // TODO by Henrikh
    })

    it("warns if called before COMPONENT_READY", () => {
      const jsonValue = {
        foo: "string",
        bar: 123,
        list: [1, "foo", false],
      }

      const mc = new MockComponent()
      mc.sendBackMsg(ComponentMessageType.SET_COMPONENT_VALUE, {
        dataType: "json",
        value: jsonValue,
      })

      // Ensure we didn't create an ErrorElement
      const child = mc.wrapper.childAt(0)
      expect(child.type()).toEqual("iframe")

      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setJsonValue).not.toHaveBeenCalled()

      expect(logWarning).toHaveBeenCalledWith(
        `Got ${ComponentMessageType.SET_COMPONENT_VALUE} before ${ComponentMessageType.COMPONENT_READY}!`
      )
    })

    describe("SET_FRAME_HEIGHT handler", () => {
      it("updates the frameHeight without re-rendering", () => {
        const mc = new MockComponent()
        mc.sendBackMsg(ComponentMessageType.COMPONENT_READY, { apiVersion: 1 })
        mc.sendBackMsg(ComponentMessageType.SET_FRAME_HEIGHT, {
          height: 100,
        })

        const iframe = mc.wrapper.childAt(0)
        expect(iframe.type()).toEqual("iframe")

        // Updating the frameheight intentionally does *not* cause a re-render
        // (instead, it directly updates the iframeRef) - so we can't check
        // that `child.prop("height") == 100`
        expect(mc.frameHeight).toEqual("100")
        // We check that the instance's height prop has *not* updated -
        // if this expect() call fails, that means that a re-render has
        // occured.
        expect(iframe.prop("height")).toEqual(0)

        // Force a re-render. NOW the iframe element's height should be updated.
        mc.wrapper.setProps({})
        expect(iframe.prop("height")).toEqual(0)
      })

      it("warns if called before COMPONENT_READY", () => {
        const mc = new MockComponent()
        mc.sendBackMsg(ComponentMessageType.SET_FRAME_HEIGHT, {
          height: 100,
        })

        // Ensure we didn't create an ErrorElement
        const iframe = mc.wrapper.childAt(0)
        expect(iframe.type()).toEqual("iframe")

        expect(logWarning).toHaveBeenCalledWith(
          `Got ${ComponentMessageType.SET_FRAME_HEIGHT} before ${ComponentMessageType.COMPONENT_READY}!`
        )

        expect(mc.frameHeight).toEqual("0")
      })
    })
  })
})

function renderMsg(
  args: { [name: string]: any },
  dataframes: any[],
  disabled = false
): any {
  return forwardMsg(StreamlitMessageType.RENDER, {
    args,
    dfs: dataframes,
    disabled,
  })
}

function forwardMsg(type: StreamlitMessageType, data: any): any {
  return { type, ...data }
}

/** Create a ComponentInstance.props.element prop with the given args. */
function createElementProp(
  jsonArgs: { [name: string]: any } = {},
  specialArgs: SpecialArg[] = []
): ComponentInstanceProto {
  return ComponentInstanceProto.create({
    jsonArgs: JSON.stringify(jsonArgs),
    specialArgs,
    componentName: MOCK_COMPONENT_NAME,
    id: MOCK_WIDGET_ID,
    url: MOCK_COMPONENT_URL,
  })
}
