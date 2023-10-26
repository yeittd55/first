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

describe("st.set_page_config", () => {
  before(() => {
    cy.visit("http://localhost:3000/");
  });

  it("sets the page favicon", () => {
    cy.get("link[rel='shortcut icon']")
      .invoke("attr", "href")
      .should("eq", "https://twemoji.maxcdn.com/2/72x72/1f988.png");
  });

  it("sets the page title", () => {
    cy.title().should("eq", "Heya, world? · Streamlit");
  });

  it("collapses the sidebar", () => {
    cy.get("[data-testid='stSidebar']").should(
      "have.attr",
      "aria-expanded",
      "false"
    );
  });

  it("sets the page in wide mode", () => {
    cy.get("[data-testid='stReportViewContainer']").should(
      "have.attr",
      "data-layout",
      "wide"
    );
  });
});
