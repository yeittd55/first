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

import React, { ComponentType } from "react"
import { shallow } from "lib/test_util"
import { StatelessAccordion } from "baseui/accordion"
import withExpandable, { Props } from "./withExpandable"

const testComponent: ComponentType = () => <div>test</div>

const getProps = (props?: Partial<Props>): Props =>
  Object({
    label: "hi",
    expandable: true,
    expanded: true,
    ...props,
  })

describe("withExpandable HOC", () => {
  it("renders without crashing", () => {
    const props = getProps()
    const WithHoc = withExpandable(testComponent)
    // @ts-ignore
    const wrapper = shallow(<WithHoc {...props} />)
    expect(wrapper.find(StatelessAccordion).exists()).toBe(true)
  })

  it("should render a expanded component", () => {
    const props = getProps()
    const WithHoc = withExpandable(testComponent)
    // @ts-ignore
    const wrapper = shallow(<WithHoc {...props} />)
    const accordion = wrapper.find(StatelessAccordion)

    expect(accordion.prop("expanded").length).toBe(1)
  })

  it("should render a collapsed component", () => {
    const props = getProps({
      expanded: false,
    })
    const WithHoc = withExpandable(testComponent)
    // @ts-ignore
    const wrapper = shallow(<WithHoc {...props} />)
    const accordion = wrapper.find(StatelessAccordion)

    expect(accordion.prop("expanded").length).toBe(0)
  })

  it("should become stale", () => {
    const props = getProps({
      isStale: true,
    })
    const WithHoc = withExpandable(testComponent)
    // @ts-ignore
    const wrapper = shallow(<WithHoc {...props} />)
    const accordion = wrapper.find(StatelessAccordion)
    const overrides = accordion.prop("overrides")

    // @ts-ignore
    expect(overrides.Header.props.className).toContain("stale-element")
  })
})
