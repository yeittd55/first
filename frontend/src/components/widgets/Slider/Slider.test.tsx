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

import React from "react"
import { Slider as UISlider } from "baseui/slider"
import TimezoneMock from "timezone-mock"

import { Slider as SliderProto } from "autogen/proto"
import { mount } from "lib/test_util"
import { WidgetStateManager } from "lib/WidgetStateManager"
import { mainTheme } from "theme"
import Slider, { Props } from "./Slider"

jest.mock("lib/WidgetStateManager")

const sendBackMsg = jest.fn()
const getProps = (elementProps: Partial<SliderProto> = {}): Props => ({
  element: SliderProto.create({
    id: "1",
    label: "Label",
    format: "%d",
    default: [5],
    min: 0,
    max: 10,
    step: 1,
    options: [],
    ...elementProps,
  }),
  width: 0,
  disabled: false,
  widgetMgr: new WidgetStateManager(sendBackMsg),
  theme: mainTheme,
})

describe("Slider widget", () => {
  jest.useFakeTimers()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  it("should show a label", () => {
    const props = getProps()
    const wrapper = mount(<Slider {...props} />)

    expect(wrapper.find("StyledWidgetLabel").text()).toBe("Label")
  })

  it("should send the value to the backend when did mount", async () => {
    const props = getProps()

    const wrapper = mount(<Slider {...props} />)

    // We need to do this as we are using a debounce when the widget value is set
    jest.runAllTimers()
    wrapper.update()

    expect(props.widgetMgr.setDoubleArrayValue).toHaveBeenCalledWith(
      props.element.id,
      [5],
      { fromUi: false }
    )

    wrapper.unmount()
  })

  describe("Overrides", () => {
    const props = getProps()
    const wrapper = mount(<Slider {...props} />)

    it("should render tick bar with min and max", () => {
      expect(
        wrapper.find("StyledTickBarItem[data-testid='stTickBarMin']").text()
      ).toBe("0")
      expect(
        wrapper.find("StyledTickBarItem[data-testid='stTickBarMax']").text()
      ).toBe("10")
    })
  })

  describe("Single value", () => {
    it("renders without crashing", () => {
      const props = getProps()
      const wrapper = mount(<Slider {...props} />)

      expect(wrapper).toBeDefined()
    })

    it("should have a correct value", () => {
      const props = getProps()
      const wrapper = mount(<Slider {...props} />)
      const UISliderWrapper = wrapper.find(UISlider)
      const propValue = UISliderWrapper.prop("value")

      expect(propValue).toStrictEqual(props.element.default)
      expect(propValue[0]).toBeGreaterThanOrEqual(props.element.min)
      expect(propValue[0]).toBeLessThan(props.element.max)
    })

    it("should handle value changes", async () => {
      const props = getProps()
      const wrapper = mount(<Slider {...props} />)
      // @ts-ignore
      wrapper.find(UISlider).prop("onChange")({
        value: [10],
      })

      // We need to do this as we are using a debounce when the widget value is set
      jest.runAllTimers()
      wrapper.update()

      expect(props.widgetMgr.setDoubleArrayValue).toHaveBeenCalledWith(
        props.element.id,
        [10],
        { fromUi: true }
      )

      expect(wrapper.find(UISlider).prop("value")).toStrictEqual([10])
    })
  })

  describe("Range value", () => {
    it("renders without crashing", () => {
      const props = getProps({
        default: [1, 9],
      })
      const wrapper = mount(<Slider {...props} />)

      expect(wrapper).toBeDefined()
    })

    it("should have a correct value", () => {
      const props = getProps({
        default: [1, 9],
      })
      const wrapper = mount(<Slider {...props} />)
      const UISliderWrapper = wrapper.find(UISlider)
      const propValue = UISliderWrapper.prop("value")

      expect(propValue).toStrictEqual(props.element.default)

      propValue.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(props.element.min)
        expect(value).toBeLessThan(props.element.max)
      })
    })

    describe("value should be within bounds", () => {
      const props = getProps({
        default: [1, 9],
      })
      const wrapper = mount(<Slider {...props} />)

      it("start > end", () => {
        // @ts-ignore
        wrapper.find(UISlider).prop("onChange")({
          value: [11, 10],
        })
        wrapper.update()

        expect(wrapper.find(UISlider).prop("value")).toStrictEqual([10, 10])
      })

      it("start < min", () => {
        // @ts-ignore
        wrapper.find(UISlider).prop("onChange")({
          value: [-1, 10],
        })
        wrapper.update()

        expect(wrapper.find(UISlider).prop("value")).toStrictEqual([0, 10])
      })

      it("start > max", () => {
        // @ts-ignore
        wrapper.find(UISlider).prop("onChange")({
          value: [11],
        })
        wrapper.update()

        expect(wrapper.find(UISlider).prop("value")).toStrictEqual([10])
      })

      it("end < min", () => {
        // @ts-ignore
        wrapper.find(UISlider).prop("onChange")({
          value: [1, -1],
        })
        wrapper.update()

        expect(wrapper.find(UISlider).prop("value")).toStrictEqual([0, 0])
      })

      it("end > max", () => {
        // @ts-ignore
        wrapper.find(UISlider).prop("onChange")({
          value: [1, 11],
        })
        wrapper.update()

        expect(wrapper.find(UISlider).prop("value")).toStrictEqual([1, 10])
      })
    })

    it("should handle value changes", async () => {
      const props = getProps({
        default: [1, 9],
      })
      const wrapper = mount(<Slider {...props} />)

      // @ts-ignore
      wrapper.find(UISlider).prop("onChange")({
        value: [1, 10],
      })

      // We need to do this as we are using a debounce when the widget value is set
      jest.runAllTimers()
      wrapper.update()

      expect(props.widgetMgr.setDoubleArrayValue).toHaveBeenCalledWith(
        props.element.id,
        [1, 10],
        {
          fromUi: true,
        }
      )
      expect(wrapper.find(UISlider).prop("value")).toStrictEqual([1, 10])
    })
  })

  describe("Datetime slider", () => {
    TimezoneMock.register("UTC")

    it("should be in UTC", () => {
      // We use a less idiomiatic Jest call, since getTimezoneOffset can return
      // -0, and Object.is(-0, 0) is false: https://stackoverflow.com/a/59343755
      expect(new Date().getTimezoneOffset() === 0).toBeTruthy()
    })

    const DAYS_IN_MICROS = 24 * 60 * 60 * 1000 * 1000
    const WEEK_IN_MICROS = 7 * DAYS_IN_MICROS

    const props = getProps({
      // The default value should be divisible by step.
      // Otherwise, we get a warning from `react-range`.
      default: [0],
      min: 0,
      max: 4 * WEEK_IN_MICROS,
      step: DAYS_IN_MICROS,
      format: "YYYY-MM-DD",
      dataType: SliderProto.DataType.DATETIME,
    })
    const wrapper = mount(<Slider {...props} />)

    it("should format min and max as dates", () => {
      expect(
        wrapper.find("StyledTickBarItem[data-testid='stTickBarMin']").text()
      ).toBe("1970-01-01")
      expect(
        wrapper.find("StyledTickBarItem[data-testid='stTickBarMax']").text()
      ).toBe("1970-01-29")
    })
  })

  describe("Options prop", () => {
    it("renders without crashing", () => {
      const props = getProps({
        default: [1],
        min: 0,
        max: 6,
        format: "%s",
        options: [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "indigo",
          "violet",
        ],
      })
      const wrapper = mount(<Slider {...props} />)

      expect(wrapper).toBeDefined()
    })

    it("sets aria-valuetext correctly", () => {
      const props = getProps({
        default: [1],
        min: 0,
        max: 6,
        format: "%s",
        options: [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "indigo",
          "violet",
        ],
      })
      const wrapper = mount(<Slider {...props} />)
      const sliderDOMNodes = wrapper.find("div[role='slider']")
      sliderDOMNodes.forEach(node => {
        expect(node.getDOMNode().getAttribute("aria-valuetext")).toEqual(
          "orange"
        )
      })
    })

    it("updates aria-valuetext correctly", () => {
      const originalProps = {
        default: [1],
        min: 0,
        max: 6,
        format: "%s",
        options: [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "indigo",
          "violet",
        ],
      }
      const props = getProps(originalProps)
      const wrapper = mount(<Slider {...props} />)
      // @ts-ignore
      wrapper.find(UISlider).prop("onChange")({
        value: [4],
      })
      const sliderDOMNodes = wrapper.find("div[role='slider']")
      sliderDOMNodes.forEach(node => {
        expect(node.getDOMNode().getAttribute("aria-valuetext")).toEqual(
          "blue"
        )
      })
    })

    it("sets aria-valuetext correctly for a range", () => {
      const props = getProps({
        default: [1, 4],
        min: 0,
        max: 6,
        format: "%s",
        options: [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "indigo",
          "violet",
        ],
      })
      const wrapper = mount(<Slider {...props} />)
      const sliderDOMNodes = wrapper.find("div[role='slider']")
      const ariaTexts = sliderDOMNodes.map(node =>
        node.getDOMNode().getAttribute("aria-valuetext")
      )

      expect(ariaTexts).toEqual(["orange", "blue"])
    })
  })
})
