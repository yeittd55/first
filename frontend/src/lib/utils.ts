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

import { Alert as AlertProto, Element } from "autogen/proto"
import _ from "lodash"
import url from "url"
import xxhash from "xxhashjs"

/**
 * Wraps a function to allow it to be called, at most, once per interval
 * (specified in milliseconds). If the wrapper function is called N times
 * within that interval, only the Nth call will go through. The function
 * will only be called after the full interval has elapsed since the last
 * call.
 */
export function debounce(delay: number, fn: any): any {
  let timerId: any

  return (...args: any[]) => {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn(...args)
      timerId = null
    }, delay)
  }
}

/**
 * Returns true if the URL parameters indicated that we're embedded in an
 * iframe.
 */
export function isEmbeddedInIFrame(): boolean {
  return url.parse(window.location.href, true).query.embed === "true"
}

/**
 * Returns true if the frameElement and parent parameters indicate that we're in an
 * iframe.
 */
export function isInChildFrame(): boolean {
  return window.parent !== window && !!window.frameElement
}

/** Return an Alert Element protobuf with the given text. */
export function makeElementWithInfoText(text: string): Element {
  return new Element({
    alert: {
      body: text,
      format: AlertProto.Format.INFO,
    },
  })
}

/**
 * A helper function to hash a string using xxHash32 algorithm.
 * Seed used: 0xDEADBEEF
 */
export function hashString(s: string): string {
  return xxhash.h32(s, 0xdeadbeef).toString(16)
}

/**
 * Coerces a possibly-null value into a non-null value, throwing an error
 * if the value is null or undefined.
 */
export function requireNonNull<T>(obj: T | null | undefined): T {
  if (obj == null) {
    throw new Error("value is null")
  }
  return obj
}

/**
 * A type predicate that is true if the given value is not undefined.
 */
export function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

/**
 * A type predicate that is true if the given value is neither undefined
 * nor null.
 */
export function notNull<T>(value: T | null | undefined): value is T {
  return value != null
}

/**
 * A promise that would be resolved after certain time
 * @param ms number
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Tests if the app is running from a Mac
 */
export function isFromMac(): boolean {
  return /Mac/i.test(navigator.platform)
}

/**
 * Tests if the app is running from a Windows
 */
export function isFromWindows(): boolean {
  return /^Win/i.test(navigator.platform)
}

/**
 * Returns cookie value
 */
export function getCookie(name: string): string | undefined {
  const r = document.cookie.match(`\\b${name}=([^;]*)\\b`)
  return r ? r[1] : undefined
}

/**
 * Sets cookie value
 */
export function setCookie(
  name: string,
  value?: string,
  expiration?: Date
): void {
  const expirationDate = value ? expiration : new Date()
  const expirationStr: string = expirationDate
    ? `expires=${expirationDate.toUTCString()};`
    : ""
  document.cookie = `${name}=${value};${expirationStr}path=/`
}

/** Return an Element's widget ID if it's a widget, and undefined otherwise. */
export function getElementWidgetID(element: Element): string | undefined {
  return _.get(element as any, [requireNonNull(element.type), "id"])
}
