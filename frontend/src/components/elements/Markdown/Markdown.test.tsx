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
import { shallow } from "lib/test_util"
import { Markdown as MarkdownProto } from "autogen/proto"
import Markdown, { MarkdownProps } from "./Markdown"

const getProps = (
  elementProps: Partial<MarkdownProps> = {}
): MarkdownProps => ({
  element: MarkdownProto.create({
    body:
      "Emphasis, aka italics, with *asterisks* or _underscores_." +
      "Combined emphasis with **asterisks and _underscores_**." +
      "[I'm an inline-style link with title](https://www.https://streamlit.io/ Streamlit)",
    allowHtml: false,
    ...elementProps,
  }),
  width: 100,
})

describe("Markdown element", () => {
  it("renders markdown as expected", () => {
    const props = getProps()
    const wrap = shallow(<Markdown {...props} />)
    const elem = wrap.get(0)
    expect(elem.props.className.includes("stMarkdown")).toBeTruthy()
    expect(elem.props.style.width).toBe(100)
  })
  /* MAYBE ADD TESTS?
  a) unit tests with different Markdown formatted text
  b) allow_html property
  */
})
