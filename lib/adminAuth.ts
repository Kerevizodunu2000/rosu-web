// SPDX-License-Identifier: GPL-3.0-or-later
import { constantTimeEqual } from './crypto'
export function passwordOk(input: string, expected: string): boolean {
  return !!expected && constantTimeEqual(input, expected)
}
