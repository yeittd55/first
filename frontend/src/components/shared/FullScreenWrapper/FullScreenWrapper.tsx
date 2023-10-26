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

import React, { PureComponent } from "react"
import { withTheme } from "emotion-theming"
import { FullscreenEnter, FullscreenExit } from "@emotion-icons/open-iconic"
import Icon from "components/shared/Icon"
import PageLayoutContext from "components/core/PageLayoutContext"
import { Theme } from "theme"
import {
  StyledFullScreenFrame,
  StyledFullScreenButton,
} from "./styled-components"

export type Size = {
  width: number
  expanded: boolean
  height?: number
}

/*
 * Function responsible for rendering children.
 * This function should implement the following signature:
 * ({ height, width }) => PropTypes.element
 */
interface Props {
  children: (props: Size) => React.ReactNode
  width: number
  height?: number
  theme: Theme
}

interface State {
  expanded: boolean
  fullWidth: number
  fullHeight: number
}

/*
 * A component that draws a button on the top right of the
 * wrapper element. OnClick, change the element container
 * to fixed and cover all screen, updating wrapped element height and width
 */
class FullScreenWrapper extends PureComponent<Props, State> {
  static contextType = PageLayoutContext

  static isFullScreen = false

  public constructor(props: Props) {
    super(props)
    this.state = {
      expanded: false,
      ...this.getWindowDimensions(),
    }
  }

  componentDidMount(): void {
    window.addEventListener("resize", this.updateWindowDimensions)
    document.addEventListener("keydown", this.controlKeys, false)
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.updateWindowDimensions)
    document.removeEventListener("keydown", this.controlKeys, false)
  }

  controlKeys = (event: any): void => {
    const { expanded } = this.state

    if (event.keyCode === 27 && expanded) {
      // Exit fullscreen
      this.zoomOut()
    }
  }

  zoomIn = (): void => {
    document.body.style.overflow = "hidden"
    this.context.setFullScreen(true)
    this.setState({ expanded: true })
  }

  zoomOut = (): void => {
    document.body.style.overflow = "unset"
    this.context.setFullScreen(false)
    this.setState({ expanded: false })
  }

  convertScssRemValueToPixels = (scssValue: string): number => {
    const remValue = parseFloat(scssValue)
    return (
      remValue *
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    )
  }

  getWindowDimensions = (): Pick<State, "fullWidth" | "fullHeight"> => {
    const padding = this.convertScssRemValueToPixels(
      this.props.theme.spacing.md
    )
    const paddingTop = this.convertScssRemValueToPixels(
      this.props.theme.sizes.headerHeight
    )

    return {
      fullWidth: window.innerWidth - padding * 2, // Left and right
      fullHeight: window.innerHeight - (padding + paddingTop), // Bottom and Top
    }
  }

  updateWindowDimensions = (): void => {
    this.setState(this.getWindowDimensions())
  }

  public render(): JSX.Element {
    const { expanded, fullWidth, fullHeight } = this.state
    const { children, width, height } = this.props

    let buttonImage = FullscreenEnter
    let buttonOnClick = this.zoomIn
    let buttonTitle = "View fullscreen"

    if (expanded) {
      buttonImage = FullscreenExit
      buttonOnClick = this.zoomOut
      buttonTitle = "Exit fullscreen"
    }

    return (
      <StyledFullScreenFrame isExpanded={expanded}>
        <StyledFullScreenButton
          onClick={buttonOnClick}
          title={buttonTitle}
          isExpanded={expanded}
        >
          <Icon content={buttonImage} />
        </StyledFullScreenButton>
        {expanded
          ? children({ width: fullWidth, height: fullHeight, expanded })
          : children({ width, height, expanded })}
      </StyledFullScreenFrame>
    )
  }
}

export default withTheme(FullScreenWrapper)
