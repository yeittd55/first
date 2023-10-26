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
import Dropzone, { FileRejection } from "react-dropzone"
import Button, { Kind, Size } from "components/shared/Button"
import { ExtendedFile } from "lib/FileHelper"

import { StyledFileDropzoneSection } from "./styled-components"
import FileDropzoneInstructions from "./FileDropzoneInstructions"

export interface Props {
  disabled: boolean
  onDrop: (
    acceptedFiles: ExtendedFile[],
    rejectedFiles: FileRejection[]
  ) => void
  multiple: boolean
  acceptedExtensions: string[]
  maxSizeBytes: number
}

const FileDropzone = ({
  onDrop,
  multiple,
  acceptedExtensions,
  maxSizeBytes,
  disabled,
}: Props): React.ReactElement => (
  <Dropzone
    onDrop={onDrop}
    multiple={multiple}
    accept={acceptedExtensions.length ? acceptedExtensions : undefined}
    maxSize={maxSizeBytes}
    disabled={disabled}
  >
    {({ getRootProps, getInputProps }) => (
      <StyledFileDropzoneSection
        {...getRootProps()}
        data-testid="stFileUploadDropzone"
        isDisabled={disabled}
      >
        <input {...getInputProps()} />
        <FileDropzoneInstructions
          multiple={multiple}
          acceptedExtensions={acceptedExtensions}
          maxSizeBytes={maxSizeBytes}
        />
        <Button kind={Kind.PRIMARY} disabled={disabled} size={Size.SMALL}>
          Browse files
        </Button>
      </StyledFileDropzoneSection>
    )}
  </Dropzone>
)

export default FileDropzone
