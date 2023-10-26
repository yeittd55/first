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

import withPagination, { PaginationProps } from "hocs/withPagination"
import { ExtendedFile } from "lib/FileHelper"
import UploadedFile from "./UploadedFile"
import {
  StyledUploadedFiles,
  StyledUploadedFilesList,
  StyledUploadedFilesListItem,
} from "./styled-components"

export interface Props {
  items: ExtendedFile[]
  onDelete: (id: string) => void
}

const UploadedFileList = ({ items, onDelete }: Props): ReactElement => {
  return (
    <StyledUploadedFilesList>
      {items.map(file => (
        <StyledUploadedFilesListItem key={file.id}>
          <UploadedFile
            file={file}
            progress={file.progress}
            onDelete={onDelete}
          />
        </StyledUploadedFilesListItem>
      ))}
    </StyledUploadedFilesList>
  )
}

export const PaginatedFiles = withPagination(UploadedFileList)

const UploadedFiles = (props: Props & PaginationProps): ReactElement => (
  <StyledUploadedFiles>
    <PaginatedFiles {...props} />
  </StyledUploadedFiles>
)
export default UploadedFiles
