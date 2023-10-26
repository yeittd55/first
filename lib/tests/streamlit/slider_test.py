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

"""slider unit test."""

import pytest
from parameterized import parameterized

import streamlit as st
from streamlit.errors import StreamlitAPIException
from streamlit.js_number import JSNumber
from tests import testutil

from datetime import date
from datetime import datetime
from datetime import time
from datetime import timedelta
from datetime import timezone


class SliderTest(testutil.DeltaGeneratorTestCase):
    """Test ability to marshall slider protos."""

    def test_just_label(self):
        """Test that it can be called with no value."""
        st.slider("the label")

        c = self.get_delta_from_queue().new_element.slider
        self.assertEqual(c.label, "the label")
        self.assertEqual(c.default, [0])

    PST = timezone(timedelta(hours=-8), "PST")
    AWARE_DT = datetime(2020, 1, 1, tzinfo=PST)
    AWARE_DT_END = datetime(2020, 1, 5, tzinfo=PST)
    AWARE_TIME = time(12, 00, tzinfo=PST)
    AWARE_TIME_END = time(21, 00, tzinfo=PST)
    # datetimes are serialized in proto as micros since epoch
    AWARE_DT_MICROS = 1577865600000000
    AWARE_DT_END_MICROS = 1578211200000000
    AWARE_TIME_MICROS = 946756800000000
    AWARE_TIME_END_MICROS = 946789200000000

    @parameterized.expand(
        [
            (1, [1], 1),  # int
            ((0, 1), [0, 1], (0, 1)),  # int tuple
            ([0, 1], [0, 1], (0, 1)),  # int list
            (0.5, [0.5], 0.5),  # float
            ((0.2, 0.5), [0.2, 0.5], (0.2, 0.5)),  # float tuple
            ([0.2, 0.5], [0.2, 0.5], (0.2, 0.5)),  # float list
            (AWARE_DT, [AWARE_DT_MICROS], AWARE_DT),  # datetime
            (
                (AWARE_DT, AWARE_DT_END),  # datetime tuple
                [AWARE_DT_MICROS, AWARE_DT_END_MICROS],
                (AWARE_DT, AWARE_DT_END),
            ),
            (
                [AWARE_DT, AWARE_DT_END],  # datetime list
                [AWARE_DT_MICROS, AWARE_DT_END_MICROS],
                (AWARE_DT, AWARE_DT_END),
            ),
            (AWARE_TIME, [AWARE_TIME_MICROS], AWARE_TIME),  # datetime
            (
                (AWARE_TIME, AWARE_TIME_END),  # datetime tuple
                [AWARE_TIME_MICROS, AWARE_TIME_END_MICROS],
                (AWARE_TIME, AWARE_TIME_END),
            ),
            (
                [AWARE_TIME, AWARE_TIME_END],  # datetime list
                [AWARE_TIME_MICROS, AWARE_TIME_END_MICROS],
                (AWARE_TIME, AWARE_TIME_END),
            ),
        ]
    )
    def test_value_types(self, value, proto_value, return_value):
        """Test that it supports different types of values."""
        ret = st.slider("the label", value=value)

        self.assertEqual(ret, return_value)

        c = self.get_delta_from_queue().new_element.slider
        self.assertEqual(c.label, "the label")
        self.assertEqual(c.default, proto_value)

    NAIVE_DT = datetime(2020, 2, 1)
    NAIVE_DT_END = datetime(2020, 2, 4)
    NAIVE_TIME = time(6, 20, 34)
    NAIVE_TIME_END = time(20, 6, 43)
    DATE_START = date(2020, 4, 5)
    DATE_END = date(2020, 6, 6)

    @parameterized.expand(
        [
            (NAIVE_DT, NAIVE_DT),  # naive datetime
            ((NAIVE_DT, NAIVE_DT_END), (NAIVE_DT, NAIVE_DT_END)),
            ([NAIVE_DT, NAIVE_DT_END], (NAIVE_DT, NAIVE_DT_END)),
            (NAIVE_TIME, NAIVE_TIME),  # naive time
            ((NAIVE_TIME, NAIVE_TIME_END), (NAIVE_TIME, NAIVE_TIME_END)),
            ([NAIVE_TIME, NAIVE_TIME_END], (NAIVE_TIME, NAIVE_TIME_END)),
            (DATE_START, DATE_START),  # date (always naive)
            ((DATE_START, DATE_END), (DATE_START, DATE_END)),
            ([DATE_START, DATE_END], (DATE_START, DATE_END)),
        ]
    )
    def test_naive_timelikes(self, value, return_value):
        """Ignore proto values (they change based on testing machine's timezone)"""
        ret = st.slider("the label", value=value)
        c = self.get_delta_from_queue().new_element.slider

        self.assertEqual(ret, return_value)
        self.assertEqual(c.label, "the label")

    def test_value_greater_than_min(self):
        ret = st.slider("Slider label", 10, 100, 0)
        c = self.get_delta_from_queue().new_element.slider

        self.assertEqual(ret, 0)
        self.assertEqual(c.min, 0)

    def test_value_smaller_than_max(self):
        ret = st.slider("Slider label", 10, 100, 101)
        c = self.get_delta_from_queue().new_element.slider

        self.assertEqual(ret, 101)
        self.assertEqual(c.max, 101)

    def test_max_min(self):
        ret = st.slider("Slider label", 101, 100, 101)
        c = self.get_delta_from_queue().new_element.slider

        self.assertEqual(ret, 101),
        self.assertEqual(c.min, 100)
        self.assertEqual(c.max, 101)

    def test_value_out_of_bounds(self):
        # Max int
        with pytest.raises(StreamlitAPIException) as exc:
            max_value = JSNumber.MAX_SAFE_INTEGER + 1
            st.slider("Label", max_value=max_value)
        self.assertEqual(
            "`max_value` (%s) must be <= (1 << 53) - 1" % str(max_value), str(exc.value)
        )

        # Min int
        with pytest.raises(StreamlitAPIException) as exc:
            min_value = JSNumber.MIN_SAFE_INTEGER - 1
            st.slider("Label", min_value=min_value)
        self.assertEqual(
            "`min_value` (%s) must be >= -((1 << 53) - 1)" % str(min_value),
            str(exc.value),
        )

        # Max float
        with pytest.raises(StreamlitAPIException) as exc:
            max_value = 2e308
            st.slider("Label", value=0.5, max_value=max_value)
        self.assertEqual(
            "`max_value` (%s) must be <= 1.797e+308" % str(max_value), str(exc.value)
        )

        # Min float
        with pytest.raises(StreamlitAPIException) as exc:
            min_value = -2e308
            st.slider("Label", value=0.5, min_value=min_value)
        self.assertEqual(
            "`min_value` (%s) must be >= -1.797e+308" % str(min_value), str(exc.value)
        )

    def test_step_zero(self):
        with pytest.raises(StreamlitAPIException) as exc:
            st.slider("Label", min_value=0, max_value=10, step=0)
        self.assertEqual(
            "Slider components cannot be passed a `step` of 0.", str(exc.value)
        )
