#!/usr/bin/env python

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

import os
import pathlib
import shutil
import signal
import subprocess
import sys
from contextlib import contextmanager
from os.path import dirname, abspath, basename, splitext, join
from tempfile import TemporaryFile
from typing import List

import click

ROOT_DIR = dirname(dirname(abspath(__file__)))  # streamlit root directory
FRONTEND_DIR = join(ROOT_DIR, "frontend")
COMPONENT_TEMPLATE_DIRS = [
    join(ROOT_DIR, "component-template/template/my_component"),
    join(ROOT_DIR, "component-template/template-reactless/my_component"),
]

CREDENTIALS_FILE = os.path.expanduser("~/.streamlit/credentials.toml")


class QuitException(BaseException):
    pass


class AsyncSubprocess:
    """A context manager. Wraps subprocess.Popen to capture output safely."""

    def __init__(self, args, cwd=None):
        self.args = args
        self.cwd = cwd
        self._proc = None
        self._stdout_file = None

    def terminate(self):
        """Terminate the process and return its stdout/stderr in a string."""
        # Terminate the process
        if self._proc is not None:
            self._proc.terminate()
            self._proc.wait()
            self._proc = None

        # Read the stdout file and close it
        stdout = None
        if self._stdout_file is not None:
            self._stdout_file.seek(0)
            stdout = self._stdout_file.read()
            self._stdout_file.close()
            self._stdout_file = None

        return stdout

    def __enter__(self):
        # Start the process and capture its stdout/stderr output to a temp
        # file. We do this instead of using subprocess.PIPE (which causes the
        # Popen object to capture the output to its own internal buffer),
        # because large amounts of output can cause it to deadlock.
        self._stdout_file = TemporaryFile("w+")
        self._proc = subprocess.Popen(
            self.args,
            cwd=self.cwd,
            stdout=self._stdout_file,
            stderr=subprocess.STDOUT,
            text=True,
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._proc is not None:
            self._proc.terminate()
            self._proc = None
        if self._stdout_file is not None:
            self._stdout_file.close()
            self._stdout_file = None


class Context:
    def __init__(self):
        # Whether to prompt to continue on failure or run all
        self.always_continue = False
        # True if Cypress will record videos of our results.
        self.record_results = False
        # True if we're automatically updating snapshots.
        self.update_snapshots = False
        # Parent folder of the specs and scripts.
        # 'e2e' for tests we expect to pass or 'e2e_flaky' for tests with
        # known issues.
        self.tests_dir_name = "e2e"
        # Set to True if any test fails.
        self.any_failed = False

    @property
    def tests_dir(self) -> str:
        return join(ROOT_DIR, self.tests_dir_name)

    @property
    def cypress_flags(self) -> List[str]:
        """Flags to pass to Cypress"""
        flags = ["--config", f"integrationFolder={self.tests_dir}/specs"]
        if self.record_results:
            flags.append("--record")
        if self.update_snapshots:
            flags.extend(["--env", "updateSnapshots=true"])
        return flags


def remove_if_exists(path):
    """Remove the given folder or file if it exists"""
    if os.path.isfile(path):
        os.remove(path)
    elif os.path.isdir(path):
        shutil.rmtree(path)


@contextmanager
def move_aside_file(path):
    """Move a file aside if it exists; restore it on completion"""
    moved = False
    if os.path.exists(path):
        os.rename(path, f"{path}.bak")
        moved = True

    try:
        yield None
    finally:
        if moved:
            os.rename(f"{path}.bak", path)


def create_credentials_toml(contents):
    """Writes ~/.streamlit/credentials.toml"""
    os.makedirs(dirname(CREDENTIALS_FILE), exist_ok=True)
    with open(CREDENTIALS_FILE, "w") as f:
        f.write(contents)


def kill_streamlits():
    """Kill any active `streamlit run` processes"""
    result = subprocess.run(
        "pgrep -f 'streamlit run'",
        shell=True,
        universal_newlines=True,
        capture_output=True,
    )

    if result.returncode == 0:
        for pid in result.stdout.split():
            try:
                os.kill(int(pid), signal.SIGTERM)
            except Exception as e:
                print("Failed to kill Streamlit instance", e)


def generate_mochawesome_report():
    """Generate the test report. This should be called right before exit."""
    subprocess.run(
        "npx -q mochawesome-merge --reportDir cypress/mochawesome > mochawesome.json",
        cwd=FRONTEND_DIR,
        shell=True,
    )

    subprocess.run(
        "npx -q mochawesome-report-generator mochawesome.json",
        cwd=FRONTEND_DIR,
        shell=True,
    )


def run_test(
    ctx: Context,
    specpath: str,
    streamlit_command: List[str],
    no_credentials: bool = False,
) -> bool:
    """Run a single e2e test.

     An e2e test consists of a Streamlit script that produces a result, and
     a Cypress test file that asserts that result is as expected.

    Parameters
    ----------
    ctx : Context
        The Context object that contains our global testing parameters.
    specpath : str
        The path of the Cypress spec file to run.
    streamlit_command : list of str
        The Streamlit command to run (passed directly to subprocess.Popen()).
    no_credentials : bool
        Any existing ~/.streamlit/credentials.toml file will be moved aside
        for the test, and by default a bare-bones placeholder credentials file
        will be created in its place. But if `no_credentials` is True, the test
        will be run without a credentials file.

    Returns
    -------
    bool
        True if the test succeeded.

    """
    SUCCESS = "SUCCESS"
    RETRY = "RETRY"
    SKIP = "SKIP"
    QUIT = "QUIT"

    result = None

    # Move existing credentials file aside, and create a new one if the
    # tests call for it.
    with move_aside_file(CREDENTIALS_FILE):
        if not no_credentials:
            create_credentials_toml('[general]\nemail="test@streamlit.io"')

        # Loop until the test succeeds or is skipped.
        while result not in (SUCCESS, SKIP, QUIT):
            cypress_command = ["yarn", "cy:run", "--spec", specpath]
            cypress_command.extend(ctx.cypress_flags)

            click.echo(
                f"{click.style('Running test:', fg='yellow', bold=True)}"
                f"\n{click.style(' '.join(streamlit_command), fg='yellow')}"
                f"\n{click.style(' '.join(cypress_command), fg='yellow')}"
            )

            # Start the streamlit command
            with AsyncSubprocess(streamlit_command, cwd=FRONTEND_DIR) as streamlit_proc:
                # Run the Cypress spec to completion.
                cypress_result = subprocess.run(
                    cypress_command,
                    cwd=FRONTEND_DIR,
                    capture_output=True,
                    text=True,
                )

                # Terminate the streamlit command and get its output
                streamlit_stdout = streamlit_proc.terminate()

            if cypress_result.returncode == 0:
                result = SUCCESS
                click.echo(click.style("Success!\n", fg="green", bold=True))
            else:
                # The test failed. Print the output of the Streamlit command
                # and the Cypress command.
                click.echo(
                    f"{click.style('Failure!', fg='red', bold=True)}"
                    f"\n\n{click.style('Streamlit output:', fg='yellow', bold=True)}"
                    f"\n{streamlit_stdout}"
                    f"\n\n{click.style('Cypress output:', fg='yellow', bold=True)}"
                    f"\n{cypress_result.stdout}"
                    f"\n"
                )

                if ctx.always_continue:
                    result = SKIP
                else:
                    # Prompt the user for what to do next.
                    user_input = click.prompt(
                        "[R]etry, [U]pdate snapshots, [S]kip, or [Q]uit?",
                        default="r",
                    )
                    key = user_input[0].lower()
                    if key == "s":
                        result = SKIP
                    elif key == "q":
                        result = QUIT
                    elif key == "r":
                        result = RETRY
                    elif key == "u":
                        ctx.update_snapshots = True
                        result = RETRY
                    else:
                        # Retry if key not recognized
                        result = RETRY

    if result != SUCCESS:
        ctx.any_failed = True

    if result == QUIT:
        raise QuitException()

    return result == SUCCESS


def run_component_template_e2e_test(ctx: Context, template_dir: str) -> bool:
    """Build a component template and run its e2e tests."""
    frontend_dir = join(template_dir, "frontend")

    # Install the template's npm dependencies into its node_modules.
    subprocess.run(
        ["yarn", "install"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        check=True,
    )

    # Start the template's dev server.
    with AsyncSubprocess(["yarn", "start"], cwd=frontend_dir) as webpack_proc:
        # Run the test!
        script_path = join(template_dir, "__init__.py")
        spec_path = join(ROOT_DIR, "e2e/specs/component_template.spec.js")
        success = run_test(ctx, spec_path, ["streamlit", "run", script_path])

        webpack_stdout = webpack_proc.terminate()

    if not success:
        click.echo(
            f"{click.style('webpack output:', fg='yellow', bold=True)}"
            f"\n{webpack_stdout}"
            f"\n"
        )

    return success


@click.command()
@click.option(
    "-a", "--always-continue", is_flag=True, help="Continue running on test failure."
)
@click.option(
    "-r",
    "--record-results",
    is_flag=True,
    help="Upload video results to the Cypress dashboard. "
    "See https://docs.cypress.io/guides/dashboard/introduction.html for more details.",
)
@click.option(
    "-u",
    "--update-snapshots",
    is_flag=True,
    help="Automatically update snapshots for failing tests.",
)
@click.option(
    "-f",
    "--flaky-tests",
    is_flag=True,
    help="Run tests in 'e2e_flaky' instead of 'e2e'.",
)
@click.option(
    "-t",
    "--test",
    help="Run a specific test, e.g. '--test st_markdown'",
    type=str,
)
def run_e2e_tests(
    always_continue: bool,
    record_results: bool,
    update_snapshots: bool,
    flaky_tests: bool,
    test: str,
):
    """Run e2e tests. If any fail, exit with non-zero status."""
    kill_streamlits()

    # Clear reports from previous runs
    remove_if_exists("frontend/cypress/mochawesome")
    remove_if_exists("frontend/mochawesome-report")
    remove_if_exists("frontend/mochawesome.json")

    ctx = Context()
    ctx.always_continue = always_continue
    ctx.record_results = record_results
    ctx.update_snapshots = update_snapshots
    ctx.tests_dir_name = "e2e_flaky" if flaky_tests else "e2e"

    try:
        # First, test "streamlit hello" in different combinations. We skip
        # `no_credentials=True` for the `--server.headless=false` test, because
        # it'll give a credentials prompt.
        if (not flaky_tests) and (not test):
            hello_spec = join(ROOT_DIR, "e2e/specs/st_hello.spec.js")
            run_test(
                ctx,
                hello_spec,
                ["streamlit", "hello", "--server.headless=true"],
                no_credentials=False,
            )
            run_test(ctx, hello_spec, ["streamlit", "hello", "--server.headless=false"])
            run_test(ctx, hello_spec, ["streamlit", "hello", "--server.headless=true"])

            # Next, run our component_template tests.
            for template_dir in COMPONENT_TEMPLATE_DIRS:
                run_component_template_e2e_test(ctx, template_dir)

        # Test core streamlit elements
        p = pathlib.Path(join(ROOT_DIR, ctx.tests_dir_name, "scripts")).resolve()
        paths = [p / f"{test}.py"] if test else sorted(p.glob("*.py"))
        for test_path in paths:
            test_name, _ = splitext(basename(test_path.as_posix()))
            specpath = join(ctx.tests_dir, "specs", f"{test_name}.spec.js")
            run_test(ctx, specpath, ["streamlit", "run", test_path.as_posix()])
    except QuitException:
        # Swallow the exception we raise if the user chooses to exit early.
        pass
    finally:
        generate_mochawesome_report()

    if ctx.any_failed:
        sys.exit(1)


if __name__ == "__main__":
    run_e2e_tests()
