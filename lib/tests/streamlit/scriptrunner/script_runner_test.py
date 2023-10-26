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

"""Tests ScriptRunner functionality"""
from typing import List
import os
import sys
import time
import unittest

from parameterized import parameterized
from tornado.testing import AsyncTestCase

from streamlit.media_file_manager import media_file_manager
from streamlit.proto.ClientState_pb2 import ClientState
from streamlit.proto.WidgetStates_pb2 import WidgetStates
from streamlit.report import Report
from streamlit.report_queue import ReportQueue
from streamlit.script_request_queue import RerunData
from streamlit.script_request_queue import ScriptRequest
from streamlit.script_request_queue import ScriptRequestQueue
from streamlit.script_runner import ScriptRunner
from streamlit.script_runner import ScriptRunnerEvent

text_utf = "complete! 👨‍🎤"
text_no_encoding = text_utf
text_latin = "complete! ð\x9f\x91¨â\x80\x8dð\x9f\x8e¤"


def _create_widget(id, states):
    """
    Returns
    -------
    streamlit.proto.WidgetStates_pb2.WidgetState

    """
    states.widgets.add().id = id
    return states.widgets[-1]


class ScriptRunnerTest(AsyncTestCase):
    def setUp(self):
        super(ScriptRunnerTest, self).setUp()

    def tearDown(self):
        super(ScriptRunnerTest, self).tearDown()

    def test_startup_shutdown(self):
        """Test that we can create and shut down a ScriptRunner."""
        scriptrunner = TestScriptRunner("good_script.py")
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(scriptrunner, [ScriptRunnerEvent.SHUTDOWN])
        self._assert_text_deltas(scriptrunner, [])

    @parameterized.expand(
        [
            ("good_script.py", text_utf),
            # These files are .txt to avoid being broken by "make headers".
            ("good_script_no_encoding.py.txt", text_no_encoding),
            ("good_script_latin_encoding.py.txt", text_latin),
        ]
    )
    def test_run_script(self, filename, text):
        """Tests that we can run a script to completion."""
        scriptrunner = TestScriptRunner(filename)
        scriptrunner.enqueue_rerun()
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, [text])
        # The following check is a requirement for the CodeHasher to
        # work correctly. The CodeHasher is scoped to
        # files contained in the directory of __main__.__file__, which we
        # assume is the main script directory.
        self.assertEqual(
            scriptrunner._report.script_path,
            sys.modules["__main__"].__file__,
            (" ScriptRunner should set the __main__.__file__" "attribute correctly"),
        )

    def test_compile_error(self):
        """Tests that we get an exception event when a script can't compile."""
        scriptrunner = TestScriptRunner("compile_error.py.txt")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_COMPILE_ERROR,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, [])

    def test_missing_script(self):
        """Tests that we get an exception event when a script doesn't exist."""
        scriptrunner = TestScriptRunner("i_do_not_exist.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_COMPILE_ERROR,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, [])

    def test_runtime_error(self):
        """Tests that we correctly handle scripts with runtime errors."""
        scriptrunner = TestScriptRunner("runtime_error.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )

        # We'll get two deltas: one for st.empty(), and one for the exception
        # that gets thrown afterwards.
        self._assert_text_deltas(scriptrunner, ["first"])
        self._assert_num_deltas(scriptrunner, 2)

    def test_stop_script(self):
        """Tests that we can stop a script while it's running."""
        scriptrunner = TestScriptRunner("infinite_loop.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()

        time.sleep(0.1)
        scriptrunner.enqueue_rerun()
        time.sleep(0.1)
        scriptrunner.enqueue_stop()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, ["loop_forever"])

    def test_shutdown(self):
        """Test that we can shutdown while a script is running."""
        scriptrunner = TestScriptRunner("infinite_loop.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()

        time.sleep(0.1)
        scriptrunner.enqueue_shutdown()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, ["loop_forever"])

    def test_widgets(self):
        """Tests that widget values behave as expected."""
        scriptrunner = TestScriptRunner("widgets_script.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()

        # Default widget values
        require_widgets_deltas([scriptrunner])
        self._assert_text_deltas(
            scriptrunner, ["False", "ahoy!", "0", "False", "loop_forever"]
        )

        # Update widgets
        states = WidgetStates()
        w1_id = scriptrunner.get_widget_id("checkbox", "checkbox")
        _create_widget(w1_id, states).bool_value = True
        w2_id = scriptrunner.get_widget_id("text_area", "text_area")
        _create_widget(w2_id, states).string_value = "matey!"
        w3_id = scriptrunner.get_widget_id("radio", "radio")
        _create_widget(w3_id, states).int_value = 2
        w4_id = scriptrunner.get_widget_id("button", "button")
        _create_widget(w4_id, states).trigger_value = True

        # Explicitly clear deltas before re-running, to prevent a race
        # condition. (The ScriptRunner will clear the deltas when it
        # starts the re-run, but if that doesn't happen before
        # require_widgets_deltas() starts polling the ScriptRunner's deltas,
        # it will see stale deltas from the last run.)
        scriptrunner.clear_deltas()
        scriptrunner.enqueue_rerun(widget_states=states)

        require_widgets_deltas([scriptrunner])
        self._assert_text_deltas(
            scriptrunner, ["True", "matey!", "2", "True", "loop_forever"]
        )

        # Rerun with previous values. Our button should be reset;
        # everything else should be the same.
        scriptrunner.clear_deltas()
        scriptrunner.enqueue_rerun()

        require_widgets_deltas([scriptrunner])
        self._assert_text_deltas(
            scriptrunner, ["True", "matey!", "2", "False", "loop_forever"]
        )

        scriptrunner.enqueue_shutdown()
        scriptrunner.join()
        self._assert_no_exceptions(scriptrunner)

    def test_coalesce_rerun(self):
        """Tests that multiple pending rerun requests get coalesced."""
        scriptrunner = TestScriptRunner("good_script.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.enqueue_rerun()
        scriptrunner.enqueue_rerun()
        scriptrunner.start()
        scriptrunner.join()

        self._assert_no_exceptions(scriptrunner)
        self._assert_events(
            scriptrunner,
            [
                ScriptRunnerEvent.SCRIPT_STARTED,
                ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                ScriptRunnerEvent.SHUTDOWN,
            ],
        )
        self._assert_text_deltas(scriptrunner, [text_utf])

    # TODO re-enable after flakyness is fixed
    def off_test_multiple_scriptrunners(self):
        """Tests that multiple scriptrunners can run simultaneously."""
        # This scriptrunner will run before the other 3. It's used to retrieve
        # the widget id before initializing deltas on other runners.
        scriptrunner = TestScriptRunner("widgets_script.py")
        scriptrunner.enqueue_rerun()
        scriptrunner.start()

        # Get the widget ID of a radio button and shut down the first runner.
        require_widgets_deltas([scriptrunner])
        radio_widget_id = scriptrunner.get_widget_id("radio", "radio")
        scriptrunner.enqueue_shutdown()
        scriptrunner.join()
        self._assert_no_exceptions(scriptrunner)

        # Build several runners. Each will set a different int value for
        # its radio button.
        runners = []
        for ii in range(3):
            runner = TestScriptRunner("widgets_script.py")
            runners.append(runner)

            states = WidgetStates()
            _create_widget(radio_widget_id, states).int_value = ii
            runner.enqueue_rerun(widget_state=states)

        # Start the runners and wait a beat.
        for runner in runners:
            runner.start()

        require_widgets_deltas(runners)

        # Ensure that each runner's radio value is as expected.
        for ii, runner in enumerate(runners):
            self._assert_text_deltas(
                runner, ["False", "ahoy!", "%s" % ii, "False", "loop_forever"]
            )
            runner.enqueue_shutdown()

        time.sleep(0.1)

        # Shut 'em all down!
        for runner in runners:
            runner.join()

        for runner in runners:
            self._assert_no_exceptions(runner)
            self._assert_events(
                runner,
                [
                    ScriptRunnerEvent.SCRIPT_STARTED,
                    ScriptRunnerEvent.SCRIPT_STOPPED_WITH_SUCCESS,
                    ScriptRunnerEvent.SHUTDOWN,
                ],
            )

    def test_rerun_caching(self):
        """Test that st.caches are maintained across script runs."""

        # Run st_cache_script.
        runner = TestScriptRunner("st_cache_script.py")
        runner.enqueue_rerun()
        runner.start()
        runner.join()

        # The script has 4 cached functions, each of which writes out
        # the same text.
        self._assert_text_deltas(
            runner,
            [
                "cached function called",
                "cached function called",
                "cached function called",
                "cached function called",
            ],
        )

        # Re-run the script on a second runner.
        runner = TestScriptRunner("st_cache_script.py")
        runner.enqueue_rerun()
        runner.start()
        runner.join()

        # The cached functions should not have been called on this second run
        self._assert_text_deltas(runner, [])

    def _assert_no_exceptions(self, scriptrunner):
        """Asserts that no uncaught exceptions were thrown in the
        scriptrunner's run thread.

        Parameters
        ----------
        scriptrunner : TestScriptRunner

        """
        self.assertEqual([], scriptrunner.script_thread_exceptions)

    def _assert_events(self, scriptrunner, events):
        """Asserts the ScriptRunnerEvents emitted by a TestScriptRunner are
        what we expect.

        Parameters
        ----------
        scriptrunner : TestScriptRunner
        events : list

        """
        self.assertEqual(events, scriptrunner.events)

    def _assert_num_deltas(self, scriptrunner, num_deltas):
        """Asserts that the given number of delta ForwardMsgs were enqueued
        during script execution.

        Parameters
        ----------
        scriptrunner : TestScriptRunner
        num_deltas : int

        """
        self.assertEqual(num_deltas, len(scriptrunner.deltas()))

    def _assert_text_deltas(self, scriptrunner, text_deltas):
        """Asserts that the scriptrunner's ReportQueue contains text deltas
        with the given contents.

        Parameters
        ----------
        scriptrunner : TestScriptRunner
        text_deltas : List[str]

        """
        self.assertEqual(text_deltas, scriptrunner.text_deltas())


class TestScriptRunner(ScriptRunner):
    """Subclasses ScriptRunner to provide some testing features."""

    def __init__(self, script_name):
        """Initializes the ScriptRunner for the given script_name"""
        # DeltaGenerator deltas will be enqueued into self.report_queue.
        self.report_queue = ReportQueue()

        def enqueue_fn(msg):
            self.report_queue.enqueue(msg)
            self.maybe_handle_execution_control_request()

        self.script_request_queue = ScriptRequestQueue()
        script_path = os.path.join(os.path.dirname(__file__), "test_data", script_name)

        super(TestScriptRunner, self).__init__(
            session_id="test session id",
            report=Report(script_path, "test command line"),
            enqueue_forward_msg=enqueue_fn,
            client_state=ClientState(),
            request_queue=self.script_request_queue,
        )

        # Accumulates uncaught exceptions thrown by our run thread.
        self.script_thread_exceptions = []

        # Accumulates all ScriptRunnerEvents emitted by us.
        self.events = []

        def record_event(event, **kwargs):
            self.events.append(event)

        self.on_event.connect(record_event, weak=False)

    def enqueue_rerun(self, argv=None, widget_states=None):
        self.script_request_queue.enqueue(
            ScriptRequest.RERUN, RerunData(widget_states=widget_states)
        )

    def enqueue_stop(self):
        self.script_request_queue.enqueue(ScriptRequest.STOP)

    def enqueue_shutdown(self):
        self.script_request_queue.enqueue(ScriptRequest.SHUTDOWN)

    def _process_request_queue(self):
        try:
            super(TestScriptRunner, self)._process_request_queue()
        except BaseException as e:
            self.script_thread_exceptions.append(e)

    def _run_script(self, rerun_data):
        self.report_queue.clear()
        super(TestScriptRunner, self)._run_script(rerun_data)

    def join(self):
        """Joins the run thread, if it was started"""
        if self._script_thread is not None:
            self._script_thread.join()

    def clear_deltas(self):
        """Clear all delta messages from our ReportQueue"""
        self.report_queue.clear()

    def deltas(self):
        """Return the delta messages in our ReportQueue"""
        return [msg.delta for msg in self.report_queue._queue if msg.HasField("delta")]

    def text_deltas(self) -> List[str]:
        """Return the string contents of text deltas in our ReportQueue"""
        return [
            delta.new_element.text.body
            for delta in self.deltas()
            if delta.HasField("new_element") and delta.new_element.HasField("text")
        ]

    def get_widget_id(self, widget_type, label):
        """Returns the id of the widget with the specified type and label"""
        for delta in self.deltas():
            new_element = getattr(delta, "new_element", None)
            widget = getattr(new_element, widget_type, None)
            widget_label = getattr(widget, "label", None)
            if widget_label == label:
                return widget.id
        return None


def require_widgets_deltas(
    runners: List[TestScriptRunner], timeout: float = 15
) -> None:
    """Wait for the given ScriptRunners to each produce the appropriate
    number of deltas for widgets_script.py before a timeout. If the timeout
    is reached, the runners will all be shutdown and an error will be thrown.
    """
    # widgets_script.py has 8 deltas, then a 1-delta loop. If 9
    # have been emitted, we can proceed with the test..
    NUM_DELTAS = 9

    t0 = time.time()
    num_complete = 0
    while time.time() - t0 < timeout:
        time.sleep(0.1)
        num_complete = sum(
            1 for runner in runners if len(runner.deltas()) >= NUM_DELTAS
        )
        if num_complete == len(runners):
            return

    # If we get here, at least 1 runner hasn't yet completed before our
    # timeout. Create an error string for debugging.
    err_string = "require_widgets_deltas() timed out after {}s ({}/{} runners complete)".format(
        timeout, num_complete, len(runners)
    )
    for runner in runners:
        if len(runner.deltas()) < NUM_DELTAS:
            err_string += "\n- incomplete deltas: {}".format(runner.text_deltas())

    # Shutdown all runners before throwing an error, so that the script
    # doesn't hang forever.
    for runner in runners:
        runner.enqueue_shutdown()
    for runner in runners:
        runner.join()

    raise RuntimeError(err_string)
