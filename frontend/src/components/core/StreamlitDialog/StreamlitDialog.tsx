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

import copy from "copy-to-clipboard"
import React, { ReactElement, ReactNode } from "react"
import ProgressBar from "components/shared/ProgressBar"
import { Kind } from "components/shared/Button"
import Modal, {
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
} from "components/shared/Modal"
import { GlobalHotKeys } from "react-hotkeys"

import {
  ScriptChangedDialog,
  Props as ScriptChangedDialogProps,
} from "components/core/StreamlitDialog/ScriptChangedDialog"
import { IException } from "autogen/proto"
import { SessionInfo } from "lib/SessionInfo"
import { STREAMLIT_HOME_URL } from "urls"
import { Props as SettingsDialogProps, SettingsDialog } from "./SettingsDialog"

import {
  StyledUploadFirstLine,
  StyledRerunHeader,
  StyledCommandLine,
  StyledUploadUrl,
} from "./styled-components"

type PlainEventHandler = () => void

interface SettingsProps extends SettingsDialogProps {
  type: DialogType.SETTINGS
}

interface ScriptChangedProps extends ScriptChangedDialogProps {
  type: DialogType.SCRIPT_CHANGED
}

export type DialogProps =
  | AboutProps
  | ClearCacheProps
  | RerunScriptProps
  | SettingsProps
  | ScriptChangedProps
  | ScriptCompileErrorProps
  | UploadProgressProps
  | UploadedProps
  | WarningProps

export enum DialogType {
  ABOUT = "about",
  CLEAR_CACHE = "clearCache",
  RERUN_SCRIPT = "rerunScript",
  SETTINGS = "settings",
  SCRIPT_CHANGED = "scriptChanged",
  SCRIPT_COMPILE_ERROR = "scriptCompileError",
  UPLOAD_PROGRESS = "uploadProgress",
  UPLOADED = "uploaded",
  WARNING = "warning",
}

export function StreamlitDialog(dialogProps: DialogProps): ReactNode {
  switch (dialogProps.type) {
    case DialogType.ABOUT:
      return aboutDialog(dialogProps)
    case DialogType.CLEAR_CACHE:
      return clearCacheDialog(dialogProps)
    case DialogType.RERUN_SCRIPT:
      return rerunScriptDialog(dialogProps)
    case DialogType.SETTINGS:
      return settingsDialog(dialogProps)
    case DialogType.SCRIPT_CHANGED:
      return <ScriptChangedDialog {...dialogProps} />
    case DialogType.SCRIPT_COMPILE_ERROR:
      return scriptCompileErrorDialog(dialogProps)
    case DialogType.UPLOAD_PROGRESS:
      return uploadProgressDialog(dialogProps)
    case DialogType.UPLOADED:
      return uploadedDialog(dialogProps)
    case DialogType.WARNING:
      return warningDialog(dialogProps)
    case undefined:
      return noDialog(dialogProps)
    default:
      return typeNotRecognizedDialog(dialogProps)
  }
}

interface AboutProps {
  type: DialogType.ABOUT

  /** Callback to close the dialog */
  onClose: PlainEventHandler
}

/** About Dialog */
function aboutDialog(props: AboutProps): ReactElement {
  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalHeader>About</ModalHeader>
      <ModalBody>
        <div>
          Streamlit v{SessionInfo.current.streamlitVersion}
          <br />
          <a href={STREAMLIT_HOME_URL}>{STREAMLIT_HOME_URL}</a>
          <br />
          Copyright 2020 Streamlit Inc. All rights reserved.
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={Kind.PRIMARY} onClick={props.onClose}>
          Close
        </ModalButton>
      </ModalFooter>
    </Modal>
  )
}

interface ClearCacheProps {
  type: DialogType.CLEAR_CACHE
  /** callback to send the clear_cache request to the Proxy */
  confirmCallback: () => void

  /** callback to close the dialog */
  onClose: PlainEventHandler

  /** callback to run the default action */
  defaultAction: () => void
}

/**
 * Dialog shown when the user wants to clear the cache.
 *
 * confirmCallback - callback to send the clear_cache request to the Proxy
 * onClose         - callback to close the dialog
 */
function clearCacheDialog(props: ClearCacheProps): ReactElement {
  const keyHandlers = {
    enter: () => props.defaultAction(),
  }

  return (
    <GlobalHotKeys handlers={keyHandlers}>
      <Modal isOpen onClose={props.onClose}>
        <ModalHeader>Clear Cache</ModalHeader>
        <ModalBody>
          <div>
            Are you sure you want to clear the <code>@st.cache</code> function
            cache?
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalButton kind={Kind.SECONDARY} onClick={props.onClose}>
            Cancel
          </ModalButton>
          <ModalButton kind={Kind.PRIMARY} onClick={props.confirmCallback}>
            Clear cache
          </ModalButton>
        </ModalFooter>
      </Modal>
    </GlobalHotKeys>
  )
}

interface RerunScriptProps {
  type: DialogType.RERUN_SCRIPT

  /** Callback to get the script's command line */
  getCommandLine: () => string | string[]

  /** Callback to set the script's command line */
  setCommandLine: (value: string) => void

  /** Callback to rerun the script */
  rerunCallback: () => void

  /** Callback to close the dialog */
  onClose: PlainEventHandler

  /** Callback to run the default action */
  defaultAction: () => void
}

/**
 * Dialog shown when the user wants to rerun a script.
 */
function rerunScriptDialog(props: RerunScriptProps): ReactElement {
  const keyHandlers = {
    enter: () => props.defaultAction(),
  }

  return (
    <GlobalHotKeys handlers={keyHandlers}>
      <Modal isOpen onClose={props.onClose}>
        <ModalBody>
          <StyledRerunHeader>Command line:</StyledRerunHeader>
          <div>
            <StyledCommandLine
              autoFocus
              className="command-line"
              value={props.getCommandLine()}
              onChange={event => props.setCommandLine(event.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalButton kind={Kind.SECONDARY} onClick={props.onClose}>
            Cancel
          </ModalButton>
          <ModalButton
            kind={Kind.PRIMARY}
            onClick={() => props.rerunCallback()}
          >
            Rerun
          </ModalButton>
        </ModalFooter>
      </Modal>
    </GlobalHotKeys>
  )
}

interface ScriptCompileErrorProps {
  type: DialogType.SCRIPT_COMPILE_ERROR
  exception: IException | null | undefined
  onClose: PlainEventHandler
}

function scriptCompileErrorDialog(
  props: ScriptCompileErrorProps
): ReactElement {
  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalHeader>Script execution error</ModalHeader>
      <ModalBody>
        <div>
          <pre>
            <code>
              {props.exception ? props.exception.message : "No message"}
            </code>
          </pre>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={Kind.PRIMARY} onClick={props.onClose}>
          Close
        </ModalButton>
      </ModalFooter>
    </Modal>
  )
}

/**
 * Shows the settings dialog.
 */
function settingsDialog(props: SettingsProps): ReactElement {
  return <SettingsDialog {...props} />
}

interface UploadProgressProps {
  type: DialogType.UPLOAD_PROGRESS
  progress?: number
  onClose: PlainEventHandler
}

/**
 * Shows the progress of an upload in progress.
 */
function uploadProgressDialog(props: UploadProgressProps): ReactElement {
  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalBody>
        <StyledUploadFirstLine>Saving app snapshot...</StyledUploadFirstLine>
        <div>
          <ProgressBar value={props.progress || 0} />
        </div>
      </ModalBody>
    </Modal>
  )
}

interface UploadedProps {
  type: DialogType.UPLOADED
  url: string
  onClose: PlainEventHandler
}

/**
 * Shows the URL after something has been uploaded.
 */
function uploadedDialog(props: UploadedProps): ReactElement {
  const handleClick: () => void = () => {
    copy(props.url)
    props.onClose()
  }

  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalBody>
        <div className="streamlit-upload-first-line">
          App snapshot saved to:
        </div>
        {/* We make this an id instead of a class to enable clipboard copy */}
        <StyledUploadUrl id="streamlit-upload-url">
          <a href={props.url} target="_blank" rel="noopener noreferrer">
            {props.url}
          </a>
        </StyledUploadUrl>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={Kind.SECONDARY} onClick={handleClick}>
          Copy to clipboard
        </ModalButton>
        <ModalButton
          kind={Kind.SECONDARY}
          onClick={() => {
            window.open(props.url, "_blank")
            props.onClose()
          }}
        >
          Open
        </ModalButton>
        <ModalButton kind={Kind.PRIMARY} onClick={props.onClose}>
          Done
        </ModalButton>
      </ModalFooter>
    </Modal>
  )
}

interface WarningProps {
  type: DialogType.WARNING
  title: string
  msg: ReactNode
  onClose: PlainEventHandler
}

/**
 * Prints out a warning
 */
function warningDialog(props: WarningProps): ReactElement {
  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalHeader>{props.title}</ModalHeader>
      <ModalBody>{props.msg}</ModalBody>
      <ModalFooter>
        <ModalButton kind={Kind.PRIMARY} onClick={props.onClose}>
          Done
        </ModalButton>
      </ModalFooter>
    </Modal>
  )
}

/**
 * Returns an empty dictionary, indicating that no object is to be displayed.
 */
function noDialog({ onClose }: { onClose: PlainEventHandler }): ReactElement {
  return <Modal isOpen={false} onClose={onClose} />
}

interface NotRecognizedProps {
  type: string
  onClose: PlainEventHandler
}

/**
 * If the dialog type is not recognized, display this dialog.
 */
function typeNotRecognizedDialog(props: NotRecognizedProps): ReactElement {
  return (
    <Modal isOpen onClose={props.onClose}>
      <ModalBody>{`Dialog type "${props.type}" not recognized.`}</ModalBody>
    </Modal>
  )
}
