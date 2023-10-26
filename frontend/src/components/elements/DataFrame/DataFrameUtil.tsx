import {
  DataFrameCellType,
  dataFrameGet,
  dataFrameGetDimensions,
} from "lib/dataFrameProto"
import { toFormattedString } from "lib/format"
import { logWarning } from "lib/log"
import React, { ReactElement, ComponentType } from "react"
import { Map as ImmutableMap } from "immutable"
import {
  StyledDataFrameRowHeaderCell,
  StyledDataFrameDataCell,
  StyledDataFrameColHeaderCell,
  StyledDataFrameCornerCell,
} from "./styled-components"

/**
 * Size of the optional sort icon displayed in column headers
 */
const SORT_ICON_WIDTH_PX = 10

/**
 * Minimum size of a dataframe cell.
 */
export const MIN_CELL_WIDTH_PX = 25

/**
 * Maximum size of a dataframe cell.
 */
const MAX_CELL_WIDTH_PX = 200

/**
 * Maximum size of a dataframe cell in a 1-column dataframe.
 */
const MAX_LONELY_CELL_WIDTH_PX = 400

export interface CellContents {
  Component: ComponentType
  styles: Record<string, unknown>
  contents: string
}

export interface CellContentsGetter {
  (columnIndex: number, rowIndex: number): CellContents
}
export interface CellContentsGetterProps {
  element: ImmutableMap<string, any>
  headerRows: number
  sortedDataRowIndices?: number[]
}
export interface CellRendererInput {
  columnIndex: number
  key: string
  rowIndex: number
  style: React.CSSProperties
}

export interface CellRenderer {
  (input: CellRendererInput): ReactElement
}

interface Dimensions {
  rowHeight: number
  headerHeight: number
  border: number
  height: number
  elementWidth: number
  columnWidth: ({ index }: { index: number }) => number
  headerWidth: number
}

interface ComputedWidths {
  elementWidth: number
  columnWidth: ({ index }: { index: number }) => number
  headerWidth: number
}

const DEFAULT_HEIGHT = 300

/**
 * Returns rendering dimensions for a DataFrame
 */
export const getDimensions = (
  height: number | undefined,
  width: number,
  element: ImmutableMap<string, any>,
  cellContentsGetter: CellContentsGetter
): Dimensions => {
  const {
    headerRows,
    headerCols,
    dataRows,
    cols,
    rows,
  } = dataFrameGetDimensions(element)

  // Rendering constants.
  const rowHeight = 25
  const headerHeight = rowHeight * headerRows
  const border = 2

  let { elementWidth, columnWidth, headerWidth } = getWidths(
    cols,
    rows,
    headerCols,
    headerRows,
    width - border,
    cellContentsGetter
  )

  // Add space for the "empty" text when the table is empty.
  const EMPTY_WIDTH = 60 // px
  if (dataRows === 0 && elementWidth < EMPTY_WIDTH) {
    elementWidth = EMPTY_WIDTH
    headerWidth = EMPTY_WIDTH
    let totalWidth = 0
    for (let i = 0; i < cols; i++) {
      totalWidth += columnWidth({ index: i })
    }
    if (totalWidth < EMPTY_WIDTH) {
      columnWidth = () => EMPTY_WIDTH / cols
    }
  }

  return {
    rowHeight,
    headerHeight,
    border,
    height: Math.min(rows * rowHeight, height || DEFAULT_HEIGHT),
    elementWidth,
    columnWidth,
    headerWidth,
  }
}

const typeToStyledComponent: Record<DataFrameCellType, ComponentType> = {
  corner: StyledDataFrameCornerCell,
  "col-header": StyledDataFrameColHeaderCell,
  "row-header": StyledDataFrameRowHeaderCell,
  data: StyledDataFrameDataCell,
}

/**
 * Returns a function which can access individual cell data in a DataFrame.
 *
 * The returned function has the form:
 *
 * cellContentsGetter(columnIndex: int, rowIndex: int) -> {
 *    classes: str - a css class string
 *    styles: {property1: value1, ...} - css styles to apply to the cell
 *    contents: str - the cell's formatted display string
 * }
 *
 * element              - a DataFrame
 * headerRows           - the number of frozen rows
 * headerCols           - the number of frozen columns
 * sortedDataRowIndices - (optional) an array containing an ordering for row indices
 */
export function getCellContentsGetter({
  element,
  headerRows,
  sortedDataRowIndices,
}: CellContentsGetterProps): CellContentsGetter {
  return (columnIndex: number, rowIndex: number): CellContents => {
    if (sortedDataRowIndices != null && rowIndex >= headerRows) {
      // If we have a sortedDataRowIndices Array, it contains a mapping of row indices for
      // all *data* (non-header) rows.
      const sortIdx = rowIndex - headerRows
      if (sortIdx >= 0 && sortIdx < sortedDataRowIndices.length) {
        rowIndex = sortedDataRowIndices[sortIdx]
        rowIndex += headerRows
      } else {
        logWarning(
          `Bad sortedDataRowIndices (` +
            `rowIndex=${rowIndex}, ` +
            `headerRows=${headerRows}, ` +
            `sortedDataRowIndices.length=${sortedDataRowIndices.length}`
        )
      }
    }

    const { contents, styles, type } = dataFrameGet(
      element,
      columnIndex,
      rowIndex
    )

    // All table elements have class 'dataframe'.
    const Component = typeToStyledComponent[type]

    // Format floating point numbers nicely.
    const fsContents = toFormattedString(contents)

    // Put it all together
    return { Component, styles, contents: fsContents }
  }
}

/**
 * Computes various dimensions for the table.
 *
 * First of all we create an array containing all the calculated column widths,
 * if the difference between the total of columns and the container width is negative
 * we put a width limit, if not, we divide the remaining space by each exceeding width
 */
export function getWidths(
  cols: number,
  rows: number,
  headerCols: number,
  headerRows: number,
  containerWidth: number,
  cellContentsGetter: CellContentsGetter
): ComputedWidths {
  const minWidth = MIN_CELL_WIDTH_PX
  const maxWidth =
    cols > 2 // 2 because 1 column is the index.
      ? MAX_CELL_WIDTH_PX
      : MAX_LONELY_CELL_WIDTH_PX

  // Calculate column width based on character count alone.
  const calculateColumnWidth = ({ index }: { index: number }): number => {
    const colIndex = index
    const fontSize = 10
    const charWidth = (fontSize * 8) / 10
    const padding = 14 + SORT_ICON_WIDTH_PX // 14 for whitespace; an extra 10 for the optional sort arrow icon

    // Set the colWidth to the maximum width of a column.
    const maxRows = 100
    let colWidth = minWidth
    for (let i = 0; i < Math.min(rows, maxRows); i++) {
      let rowIndex = -1
      if (i < headerRows) {
        // Always measure all the header rows.
        rowIndex = i
      } else if (rows > maxRows) {
        // If there are a lot of rows, then pick some at random.
        rowIndex = Math.floor(Math.random() * rows)
      } else {
        // Otherwise, just measure every row.
        rowIndex = i
      }
      const { contents } = cellContentsGetter(colIndex, rowIndex)
      const nChars = contents ? contents.length : 0
      const cellWidth = nChars * charWidth + padding

      if (cellWidth > colWidth) {
        colWidth = cellWidth
      }
    }
    return colWidth
  }

  let distributedTable: Array<number> = []
  const tableColumnWidth: Array<number> = Array.from(Array(cols), (_, index) =>
    calculateColumnWidth({ index })
  )
  const totalTableWidth = tableColumnWidth.reduce((a, b) => a + b, 0)
  const remainingSpace = containerWidth - totalTableWidth
  const getColumnsThatExceedMaxWidth = (
    columns: Array<number>
  ): Array<number> => columns.filter(width => width > maxWidth)

  if (remainingSpace < 0) {
    distributedTable = tableColumnWidth.map(width =>
      width > maxWidth ? maxWidth : width
    )
  } else {
    const columnsThatExceed = getColumnsThatExceedMaxWidth(tableColumnWidth)
    const remainingSpaceByColumn = remainingSpace / columnsThatExceed.length

    distributedTable = tableColumnWidth.map((width, id) => {
      if (id in columnsThatExceed.keys()) {
        return width + remainingSpaceByColumn
      }

      return width
    })
  }

  let distributedTableTotal = distributedTable.reduce((a, b) => a + b, 0)
  if (
    distributedTableTotal > containerWidth * (2 / 3) &&
    distributedTableTotal < containerWidth
  ) {
    const remainingSpace = (containerWidth - distributedTableTotal) / cols
    distributedTable = distributedTable.map(width => width + remainingSpace)
    distributedTableTotal = distributedTable.reduce((a, b) => a + b, 0)
  }

  const elementWidth = Math.min(distributedTableTotal, containerWidth)
  const columnWidth = ({ index }: { index: number }): number =>
    distributedTable[index]

  const headerWidth = distributedTable
    .slice(0, headerCols)
    .reduce((prev, curr) => prev + curr)

  return {
    elementWidth,
    columnWidth,
    headerWidth,
  }
}
