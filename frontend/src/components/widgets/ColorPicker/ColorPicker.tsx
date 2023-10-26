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
import { StatefulPopover as UIPopover } from "baseui/popover"
import { ColorPicker as ColorPickerProto } from "autogen/proto"
import { WidgetStateManager, Source } from "lib/WidgetStateManager"
import { ChromePicker, ColorResult } from "react-color"
import { StyledWidgetLabel } from "components/widgets/BaseWidget"
import { StyledColorPicker, StyledColorPreview } from "./styled-components"

export interface Props {
  disabled: boolean
  element: ColorPickerProto
  widgetMgr: WidgetStateManager
  width: number
}

interface State {
  /**
   * The value specified by the user via the UI. If the user didn't touch this
   * widget's UI, the default value is used.
   */
  value: string
}

class ColorPicker extends React.PureComponent<Props, State> {
  public state: State = {
    value: this.initialValue,
  }

  get initialValue(): string {
    // If WidgetStateManager knew a value for this widget, initialize to that.
    // Otherwise, use the default value from the widget protobuf.
    const widgetId = this.props.element.id
    const storedValue = this.props.widgetMgr.getStringValue(widgetId)
    return storedValue !== undefined ? storedValue : this.props.element.default
  }

  public componentDidMount(): void {
    this.setWidgetValue({ fromUi: false })
  }

  private setWidgetValue = (source: Source): void => {
    const widgetId = this.props.element.id
    this.props.widgetMgr.setStringValue(widgetId, this.state.value, source)
  }

  private onChangeComplete = (color: ColorResult): void => {
    this.setState({ value: color.hex })
  }

  private onColorClose = (): void => {
    this.setWidgetValue({ fromUi: true })
  }

  public render = (): React.ReactNode => {
    const { element, width } = this.props
    const { value } = this.state
    const style = { width }
    const previewStyle = {
      backgroundColor: value,
      boxShadow: `${value} 0px 0px 4px`,
    }
    return (
      <StyledColorPicker data-testid="stColorPicker" style={style}>
        <StyledWidgetLabel>{element.label}</StyledWidgetLabel>
        <UIPopover
          onClose={this.onColorClose}
          content={() => (
            <ChromePicker
              color={value}
              onChangeComplete={this.onChangeComplete}
              disableAlpha={true}
            />
          )}
        >
          <StyledColorPreview style={previewStyle}></StyledColorPreview>
        </UIPopover>
      </StyledColorPicker>
    )
  }
}

export default ColorPicker
