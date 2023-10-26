import styled, { CSSObject } from "@emotion/styled"
import { Theme } from "theme"

export interface StyledFileDropzone {
  isDisabled: boolean
}

export const StyledFileDropzoneSection = styled.section<StyledFileDropzone>(
  ({ isDisabled, theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing.lg,
    backgroundColor: theme.inSidebar
      ? theme.colors.white
      : theme.colors.lightestGray,
    borderRadius: theme.radii.md,
    ":focus": {
      outline: "none",
      boxShadow: `0 0 0 1px ${theme.colors.primary}`,
    },
    color: isDisabled ? theme.colors.gray : theme.colors.bodyText,
  })
)

export const StyledFileDropzoneInstructions = styled.div(({ theme }) => ({
  marginRight: "auto",
  alignItems: "center",
  display: "flex",
}))

export const StyledFileDropzoneInstructionsFileUploaderIcon = styled.span(
  ({ theme }) => ({
    color: theme.colors.secondary,
    marginRight: theme.spacing.lg,
  })
)

export const StyledFileDropzoneInstructionsStyledSpan = styled.span(
  ({ theme }) => ({
    marginBottom: theme.spacing.twoXS,
  })
)

export const StyledFileDropzoneInstructionsColumn = styled.div({
  display: "flex",
  flexDirection: "column",
})

export const StyledUploadedFiles = styled.div(({ theme }) => ({
  left: 0,
  right: 0,
  lineHeight: theme.lineHeights.tight,
  paddingTop: theme.spacing.md,
  paddingLeft: theme.spacing.lg,
  paddingRight: theme.spacing.lg,
}))

export const StyledUploadedFilesList = styled.ul(({ theme }) => ({
  listStyleType: "none",
}))

export const StyledUploadedFilesListItem = styled.li(({ theme }) => ({
  margin: theme.spacing.none,
  padding: theme.spacing.none,
}))

export const StyledUploadedFileData = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  flex: 1,
  paddingLeft: theme.spacing.lg,
  overflow: "hidden",
}))

export const StyledUploadedFileName = styled.div(({ theme }) => ({
  marginRight: theme.spacing.sm,
  marginBottom: theme.spacing.twoXS,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}))

export const StyledUploadedFile = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing.twoXS,
}))

export const StyledErrorMessage = styled.span(({ theme }) => ({
  marginRight: theme.spacing.twoXS,
}))

export const StyledFileIcon = styled.div(({ theme }) => ({
  display: "flex",
  padding: theme.spacing.twoXS,
  color: theme.colors.secondary,
}))

export const StyledFileError = styled.small(({ theme }) => ({
  color: theme.colors.danger,
  fontSize: theme.fontSizes.smDefault,
  height: theme.fontSizes.smDefault,
  lineHeight: theme.fontSizes.smDefault,
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
}))

export const StyledFileErrorIcon = styled.span({})

const compactFileUploader = (theme: Theme): CSSObject => ({
  [StyledFileDropzoneSection as any]: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  [StyledFileDropzoneInstructions as any]: {
    marginBottom: theme.spacing.lg,
  },
  [StyledFileDropzoneInstructionsFileUploaderIcon as any]: {
    display: "none",
  },
  [StyledUploadedFiles as any]: {
    paddingRight: theme.spacing.lg,
  },
  [StyledUploadedFile as any]: {
    maxWidth: "inherit",
    flex: 1,
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  [StyledUploadedFileName as any]: {
    width: theme.sizes.full,
  },
  [StyledUploadedFileData as any]: {
    flexDirection: "column",
  },
  [StyledFileError as any]: {
    height: "auto",
    whiteSpace: "initial",
  },
  [StyledFileErrorIcon as any]: {
    display: "none",
  },
  [StyledUploadedFilesListItem as any]: {
    margin: theme.spacing.none,
    padding: theme.spacing.none,
  },
})

export const StyledFileUploader = styled.div(({ theme }) => {
  if (theme.inSidebar) {
    return compactFileUploader(theme)
  }

  return {
    [`@media (max-width: ${theme.breakpoints.sm})`]: compactFileUploader(
      theme
    ),
  }
})
