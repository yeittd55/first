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

import React, { ReactElement } from "react"
import { Progress as ProgressProto } from "autogen/proto"
import ProgressBar from "components/shared/ProgressBar"

export interface ProgressProps {
  width: number
  element: ProgressProto
}

export const FAST_UPDATE_MS = 50

function Progress({ element, width }: ProgressProps): ReactElement {
  return (
    <div className="stProgress">
      <ProgressBar value={element.value} width={width} />
    </div>
  )
}

export default Progress
