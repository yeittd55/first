# Copyright 2018-2020 Streamlit Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import streamlit as st

CAT_IMAGE = "https://images.unsplash.com/photo-1552933529-e359b2477252?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=950&q=80"

if st.button("Layout should not shift when this is pressed"):
    st.write("Pressed!")

# Same-width columns
c1, c2, c3 = st.beta_columns(3)
c1.image(CAT_IMAGE, use_column_width=True)
c2.image(CAT_IMAGE, use_column_width=True)
c3.image(CAT_IMAGE, use_column_width=True)


# Variable-width columns
for c in st.beta_columns((1, 2, 4, 8)):
    c.image(CAT_IMAGE, use_column_width=True)
