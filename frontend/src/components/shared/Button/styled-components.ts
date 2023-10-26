import { MouseEvent, ReactNode } from "react"
import styled, { CSSObject } from "@emotion/styled"
import { transparentize } from "color2k"
import { Theme } from "theme"

export enum Kind {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  LINK = "link",
  ICON = "icon",
  MINIMAL = "minimal",
}

export enum Size {
  XSMALL = "xsmall",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

export interface ButtonProps {
  kind: Kind
  size?: Size
  onClick?: (event: MouseEvent<HTMLButtonElement>) => any
  disabled?: boolean
  fluidWidth?: boolean
  children: ReactNode
}

type RequiredButtonProps = Required<ButtonProps>

function getSizeStyle(size: Size, theme: Theme): CSSObject {
  switch (size) {
    case Size.XSMALL:
      return {
        padding: `${theme.spacing.twoXS} ${theme.spacing.sm}`,
        fontSize: theme.fontSizes.smDefault,
      }
    case Size.SMALL:
      return {
        padding: `${theme.spacing.twoXS} ${theme.spacing.md}`,
      }
    case Size.LARGE:
      return {
        padding: `${theme.spacing.md} ${theme.spacing.md}`,
      }
    default:
      return {
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      }
  }
}

export const StyledBaseButton = styled.button<RequiredButtonProps>(
  ({ fluidWidth, size, theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: theme.fontWeights.normal,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radii.md,
    margin: 0,
    lineHeight: theme.lineHeights.base,
    color: "inherit",
    width: fluidWidth ? "100%" : "auto",
    "&:focus": {
      boxShadow: `0 0 0 0.2rem ${transparentize(theme.colors.primary, 0.5)}`,
      outline: "none",
    },
    ...getSizeStyle(size, theme),
  })
)

export const StyledPrimaryButton = styled(StyledBaseButton)<
  RequiredButtonProps
>(({ theme }) => ({
  backgroundColor: theme.colors.white,
  border: `1px solid ${theme.colors.lightGray}`,
  "&:hover": {
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
  },
  "&:active": {
    color: theme.colors.white,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  "&:focus:not(:active)": {
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
  },
  "&:disabled, &:disabled:hover, &:disabled:active": {
    backgroundColor: theme.colors.lightGray,
    borderColor: theme.colors.transparent,
    color: theme.colors.gray,
  },
}))

export const StyledSecondaryButton = styled(StyledBaseButton)<
  RequiredButtonProps
>(({ theme }) => ({
  backgroundColor: theme.colors.transparent,
  border: `1px solid ${theme.colors.transparent}`,
  "&:hover": {
    borderColor: theme.colors.transparent,
    color: theme.colors.primary,
  },
  "&:active": {
    color: theme.colors.primary,
    borderColor: theme.colors.transparent,
    backgroundColor: theme.colors.transparent,
  },
  "&:focus:not(:active)": {
    borderColor: theme.colors.transparent,
    color: theme.colors.primary,
  },
  "&:disabled, &:disabled:hover, &:disabled:active": {
    backgroundColor: theme.colors.lightGray,
    borderColor: theme.colors.transparent,
    color: theme.colors.gray,
  },
}))

export const StyledLinkButton = styled(StyledBaseButton)<RequiredButtonProps>(
  ({ theme }) => ({
    backgroundColor: theme.colors.transparent,
    padding: 0,
    border: "none",
    color: theme.colors.primary,
    "&:hover": {
      textDecoration: "underline",
    },
    "&:active": {
      backgroundColor: theme.colors.transparent,
      color: theme.colors.primary,
      textDecoration: "underline",
    },
    "&:disabled, &:disabled:hover, &:disabled:active": {
      backgroundColor: theme.colors.lightGray,
      borderColor: theme.colors.transparent,
      color: theme.colors.gray,
    },
  })
)

export const StyledMinimalButton = styled(StyledBaseButton)<
  RequiredButtonProps
>(({ theme }) => ({
  backgroundColor: theme.colors.transparent,
  border: "none",
  boxShadow: "none",
  padding: 0,
  "&:hover, &:active, &:focus": {
    color: theme.colors.primary,
  },
}))

export const StyledIconButton = styled(StyledBaseButton)<RequiredButtonProps>(
  ({ size, theme }) => {
    const iconPadding: Record<Size, string> = {
      [Size.XSMALL]: theme.spacing.threeXS,
      [Size.SMALL]: theme.spacing.twoXS,
      [Size.MEDIUM]: theme.spacing.md,
      [Size.LARGE]: theme.spacing.lg,
    }
    return {
      backgroundColor: theme.colors.transparent,
      border: `1px solid ${theme.colors.transparent}`,
      padding: iconPadding[size],

      "&:hover": {
        borderColor: theme.colors.primary,
        color: theme.colors.primary,
      },
      "&:active": {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        color: theme.colors.white,
      },
      "&:focus:not(:active)": {
        borderColor: theme.colors.primary,
        color: theme.colors.primary,
      },
      "&:disabled, &:disabled:hover, &:disabled:active": {
        backgroundColor: theme.colors.lightGray,
        borderColor: theme.colors.transparent,
        color: theme.colors.gray,
      },
    }
  }
)
