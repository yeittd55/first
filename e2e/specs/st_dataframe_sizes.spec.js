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

describe("Dataframes and Tables snapshots", () => {
  before(() => {
    // Increasing timeout since we're waiting for
    // dataframes and tables to be rendered.
    Cypress.config("defaultCommandTimeout", 30000);

    cy.visit("http://localhost:3000/");

    // Make the ribbon decoration line disappear
    cy.get("[data-testid='stDecoration']").invoke("css", "display", "none");

    // HACK: Add `overflow: auto` to all tables to prevent Cypress
    // from throwing [RangeError: The value of "offset" is out of range.]
    cy.get("[data-testid='stTable']").each($element => {
      cy.wrap($element).invoke("css", "overflow", "auto");
    });
  });

  it("show a tooltip for each cell", () => {
    // Each cell's title should be equal to its text content.
    // (We just check the first dataframe, rather than every single one.)
    cy.get(".stDataFrame")
      .first()
      .within(() => {
        cy.get("[data-testid='StyledDataFrameDataCell']").each($element => {
          expect($element.text()).to.eq($element.attr("title"));
        });
      });
  });

  it("have consistent st.dataframe visuals", () => {
    cy.get(".stDataFrame").each(($element, index) => {
      return cy.wrap($element).matchImageSnapshot("dataframe-visuals" + index);
    });
  });

  it("have consistent st.table visuals", () => {
    cy.get("[data-testid='stTable']").each(($element, index) => {
      return cy.wrap($element).matchImageSnapshot("table-visuals" + index);
    });
  });
});
