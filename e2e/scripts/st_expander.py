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

container = st.beta_container()
container.write("I cannot collapse")

expander = st.beta_expander("Collapse me!", expanded=True)
expander.write("I can collapse")

collapsed = st.beta_expander("Expand me!")
collapsed.write("I am already collapsed")

sidebar = st.sidebar.beta_expander("Expand me!")
sidebar.write("I am in the sidebar")
