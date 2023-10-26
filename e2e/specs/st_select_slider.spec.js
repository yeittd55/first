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

describe("st.select_slider", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("shows labels", () => {
    cy.get(".stSlider label").should("have.text", "Label 1");
  });

  it("has correct values", () => {
    cy.get(".stMarkdown").should("have.text", "Value 1: ('orange', 'blue')");
  });

  it("has correct aria-valuetext", () => {
    cy.get('.stSlider [role="slider"]')
      .first()
      .should("have.attr", "aria-valuetext", "orange");

    cy.get('.stSlider [role="slider"]')
      .eq(1)
      .should("have.attr", "aria-valuetext", "blue");
  });

  it("increments the value on right arrow key press", () => {
    cy.get('.stSlider [role="slider"]')
      .first()
      .click()
      .type("{rightarrow}", { force: true });

    cy.get(".stMarkdown")
      .first()
      .should("have.text", "Value 1: ('yellow', 'blue')");

    cy.get('.stSlider [role="slider"]')
      .first()
      .should("have.attr", "aria-valuetext", "yellow");

    cy.get('.stSlider [role="slider"]')
      .eq(1)
      .should("have.attr", "aria-valuetext", "blue");
  });

  it("decrements the value on left arrow key press", () => {
    cy.get('.stSlider [role="slider"]')
      .first()
      .click()
      .type("{leftarrow}", { force: true });

    cy.get(".stMarkdown")
      .first()
      .should("have.text", "Value 1: ('red', 'blue')");

    cy.get('.stSlider [role="slider"]')
      .first()
      .should("have.attr", "aria-valuetext", "red");

    cy.get('.stSlider [role="slider"]')
      .eq(1)
      .should("have.attr", "aria-valuetext", "blue");
  });

  it("maintains its state on rerun", () => {
    cy.get('.stSlider [role="slider"]')
      .first()
      .click()
      .type("{leftarrow}", { force: true });

    // Rerun the script.
    cy.get(".stApp [data-testid='stDecoration']").trigger("keypress", {
      keyCode: 82, // "r"
      which: 82 // "r"
    });

    cy.get(".stMarkdown")
      .first()
      .should("have.text", "Value 1: ('red', 'blue')");
  });
});
