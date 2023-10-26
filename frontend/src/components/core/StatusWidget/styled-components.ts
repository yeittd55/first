/**
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

import styled, { CSSObject } from "@emotion/styled"
import { Theme } from "theme"

/*
  "ConnectionStatus" styles are used for displaying
  the status of our connection to the server (connected,
  disconnected, error, etc).
*/

export const StyledConnectionStatus = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.colors.gray,
}))

export interface StyledConnectionStatusLabelProps {
  isMinimized: boolean
}

export const StyledConnectionStatusLabel = styled.label<
  StyledConnectionStatusLabelProps
>(({ isMinimized, theme }) => ({
  fontSize: theme.fontSizes.smDefault,
  color: theme.colors.gray,
  textTransform: "uppercase",
  marginTop: theme.spacing.none,
  marginRight: isMinimized ? theme.spacing.none : theme.spacing.lg,
  marginBottom: theme.spacing.none,
  marginLeft: theme.spacing.sm,
  whiteSpace: "nowrap",
  maxWidth: isMinimized ? "0" : "20rem",
  transition:
    "opacity 500ms 0ms, clip 500ms 0ms, max-width 500ms 0ms, margin 500ms 0ms, visibility 0ms 500ms",
  opacity: isMinimized ? 0 : 1,
  visibility: isMinimized ? "hidden" : "visible",
}))

/*
  "ReportStatus" styles are for report-related statuses:
  whether it's running, if the source file has changed on disk,
  etc.
*/

export const StyledReportStatus = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: theme.radii.md,
  margin: `0 ${theme.spacing.sm} 0 0`,
  paddingLeft: theme.spacing.sm,
  backgroundColor: "#fffd",
  height: "1.6rem",
}))

const minimizedStyles = (theme: Theme): CSSObject => ({
  opacity: 0,
  padding: theme.spacing.none,
  margin: theme.spacing.none,
  maxWidth: 0,
  minWidth: 0,
  border: 0,
})

export interface StyledReportStatusLabelProps {
  isPrompt: boolean
  isMinimized: boolean
}

export const StyledReportStatusLabel = styled.label<
  StyledReportStatusLabelProps
>(({ isPrompt, isMinimized, theme }) => ({
  fontSize: theme.fontSizes.smDefault,
  color: isPrompt ? theme.colors.bodyText : theme.colors.gray,
  textTransform: isPrompt ? "none" : "uppercase",
  margin: `0 0 0 ${theme.spacing.lg}`,
  whiteSpace: "nowrap",
  maxWidth: "20rem",
  height: "1rem",
  borderRadius: isPrompt ? theme.radii.md : undefined,
  transition: `opacity 200ms ease-out 0s,
  clip 200ms ease-out 0s, min-width 200ms ease-out 0s,
  max-width 200ms ease-out 0s, padding 200ms ease-out 0s`, // Hide at end of the transition
  ...(isMinimized ? minimizedStyles(theme) : {}),
}))

export interface StyledReportButtonContainerProps {
  isMinimized: boolean
}

export const StyledReportButtonContainer = styled.span<
  StyledReportButtonContainerProps
>(({ isMinimized, theme }) => ({
  minWidth: "4rem",
  marginLeft: theme.spacing.sm,
  whiteSpace: "nowrap",
  transition: `opacity 200ms ease-out 0s,
  clip 200ms ease-out 0s, min-width 200ms ease-out 0s,
  max-width 200ms ease-out 0s, padding 200ms ease-out 0s`, // Hide at end of the transition
  ...(isMinimized ? minimizedStyles(theme) : {}),
}))

export const StyledReportRunningIcon = styled.img(({ theme }) => ({
  opacity: 0.4,
  width: "1.6rem",
  height: "1.6rem",
  marginRight: `-${theme.spacing.sm}`,
}))

export const StyledStatusWidget = styled.div(({ theme }) => ({
  "&.StatusWidget-appear": {
    opacity: 0,
  },

  "&.StatusWidget-appear-active": {
    opacity: 1,
    transition: "opacity 200ms ease-out",
  },

  "&.StatusWidget-enter": {
    opacity: 0,
  },

  "&.StatusWidget-enter-active": {
    opacity: 1,
    transition: "opacity 200ms ease-out",
  },

  "&.StatusWidget-exit": {
    opacity: 1,
  },

  "&.StatusWidget-exit-active": {
    opacity: 0,
    transition: "opacity 200ms ease-out",
  },
}))

export const StyledShortcutLabel = styled.div(({ theme }) => ({
  "&::first-letter": {
    textDecoration: "underline",
  },
}))
