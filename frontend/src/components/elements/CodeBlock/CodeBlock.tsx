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

import Prism, { Grammar } from "prismjs"
import React, { ReactElement } from "react"
import { logWarning } from "lib/log"

// Prism language definition files.
// These must come after the prismjs import because they modify Prism.languages
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-css"
import "prismjs/components/prism-c"
import CopyButton from "./CopyButton"
import {
  StyledPre,
  StyledCodeBlock,
  StyledCopyButtonContainer,
} from "./styled-components"

export interface CodeBlockProps {
  width: number
  language?: string
  value: string
}

/**
 * Renders a code block with syntax highlighting, via Prismjs
 */
export default function CodeBlock({
  width,
  language,
  value,
}: CodeBlockProps): ReactElement {
  if (language == null) {
    return (
      <StyledCodeBlock className="stCodeBlock">
        <StyledCopyButtonContainer>
          <CopyButton text={value} />
        </StyledCopyButtonContainer>
        <StyledPre>
          <code>{value}</code>
        </StyledPre>
      </StyledCodeBlock>
    )
  }

  // Language definition keys are lowercase
  let lang: Grammar = Prism.languages[language.toLowerCase()]
  let languageClassName = `language-${language}`

  if (lang === undefined) {
    logWarning(`No syntax highlighting for ${language}; defaulting to Python`)
    lang = Prism.languages.python
    languageClassName = "language-python"
  }

  const safeHtml = value ? Prism.highlight(value, lang, "") : ""

  return (
    <StyledCodeBlock className="stCodeBlock">
      <StyledCopyButtonContainer>
        <CopyButton text={value} />
      </StyledCopyButtonContainer>
      <StyledPre>
        <code
          className={languageClassName}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </StyledPre>
    </StyledCodeBlock>
  )
}
