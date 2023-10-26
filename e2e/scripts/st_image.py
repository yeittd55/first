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
import numpy as np

st.set_option("deprecation.showImageFormat", True)
img = np.repeat(0, 10000).reshape(100, 100)
st.image(img, caption="Black Square with deprecated format", format="JPEG", width=100)

st.set_option("deprecation.showImageFormat", False)
st.image(img, caption="Black Square with deprecated format", format="JPEG", width=100)

st.image(img, caption="Black Square as JPEG", output_format="JPEG", width=100)

st.image(img, caption="Black Square as PNG", output_format="PNG", width=100)

st.image(img, caption="Black Square with no output format specified", width=100)

transparent_img = np.zeros((100, 100, 4), dtype=np.uint8)
st.image(transparent_img, caption="Transparent Black Square", width=100)
