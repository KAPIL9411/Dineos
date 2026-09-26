import 'server-only'
import { NextResponse } from 'next/server'
import type { ApiSuccess, ApiError, ErrorCodeValue } from '@/types/api'

/**
 * Typed success response. Always returns { success: true, data: T }.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Typed error response. Always returns { success: false, error: { code, message } }.
 * Never exposes internal stack traces or raw DB errors to the client.
 */
export function apiError(
  code: ErrorCodeValue,
  message: string,
  status = 400,
  fields?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(fields ? { fields } : {}) },
    },
    { status }
  )
}
