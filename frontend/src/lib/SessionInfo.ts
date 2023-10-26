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
import { Config, EnvironmentInfo, Initialize, UserInfo } from "autogen/proto"

export interface Args {
  sessionId: string
  streamlitVersion: string
  pythonVersion: string
  installationId: string
  installationIdV1: string
  installationIdV2: string
  authorEmail: string
  maxCachedMessageAge: number
  commandLine: string
  userMapboxToken: string
}

export class SessionInfo {
  // Fields that don't change during the lifetime of a session (i.e. a browser tab).
  public readonly sessionId: string

  public readonly streamlitVersion: string

  public readonly pythonVersion: string

  public readonly installationId: string

  public readonly installationIdV1: string

  public readonly installationIdV2: string

  public readonly authorEmail: string

  public readonly maxCachedMessageAge: number

  public readonly commandLine: string

  /**
   * The user-supplied mapbox token. By default, this will be the empty string,
   * which indicates that we should fetch Streamlit's mapbox token and use
   * that instead. Do not use this value directly; use `MapboxToken.get()`
   * instead.
   */
  public readonly userMapboxToken: string

  /**
   * Singleton SessionInfo object. The reasons we're using a singleton here
   * instead of just exporting a module-level instance are:
   * - So we can easily override it in tests.
   * - So we throw a loud error when some code tries to use it before it's
   *   initialized.
   */
  private static singleton?: SessionInfo

  public static get current(): SessionInfo {
    if (!SessionInfo.singleton) {
      throw new Error("Tried to use SessionInfo before it was initialized")
    }
    return SessionInfo.singleton
  }

  public static set current(sm: SessionInfo) {
    SessionInfo.singleton = sm
  }

  public static isSet(): boolean {
    return SessionInfo.singleton != null
  }

  public static get isHello(): boolean {
    return this.current.commandLine === "streamlit hello"
  }

  public static clearSession(): void {
    SessionInfo.singleton = undefined
  }

  /** Create a SessionInfo from the relevant bits of an initialize message. */
  public static fromInitializeMessage(initialize: Initialize): SessionInfo {
    const environmentInfo = initialize.environmentInfo as EnvironmentInfo
    const userInfo = initialize.userInfo as UserInfo
    const config = initialize.config as Config

    return new SessionInfo({
      sessionId: initialize.sessionId,
      streamlitVersion: environmentInfo.streamlitVersion,
      pythonVersion: environmentInfo.pythonVersion,
      installationId: userInfo.installationId,
      installationIdV1: userInfo.installationIdV1,
      installationIdV2: userInfo.installationIdV2,
      authorEmail: userInfo.email,
      maxCachedMessageAge: config.maxCachedMessageAge,
      commandLine: initialize.commandLine,
      userMapboxToken: config.mapboxToken,
    })
  }

  public constructor({
    sessionId,
    streamlitVersion,
    pythonVersion,
    installationId,
    installationIdV1,
    installationIdV2,
    authorEmail,
    maxCachedMessageAge,
    commandLine,
    userMapboxToken,
  }: Args) {
    if (
      sessionId == null ||
      streamlitVersion == null ||
      pythonVersion == null ||
      installationId == null ||
      installationIdV1 == null ||
      installationIdV2 == null ||
      authorEmail == null ||
      maxCachedMessageAge == null ||
      commandLine == null ||
      userMapboxToken == null
    ) {
      throw new Error("SessionInfo arguments must be non-null")
    }

    this.sessionId = sessionId
    this.streamlitVersion = streamlitVersion
    this.pythonVersion = pythonVersion
    this.installationId = installationId
    this.installationIdV1 = installationIdV1
    this.installationIdV2 = installationIdV2
    this.authorEmail = authorEmail
    this.maxCachedMessageAge = maxCachedMessageAge
    this.commandLine = commandLine
    this.userMapboxToken = userMapboxToken
  }
}
