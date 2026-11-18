import { HttpResponse } from 'msw'
import { apiError } from './http-utils'

export class MockError extends Error {
  status: number
  code: string
  fields?: Record<string, string>
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof MockError) {
    return HttpResponse.json(apiError(e.code, e.message, e.fields), { status: e.status })
  }
  throw e
}

export async function readJson(req: Request): Promise<unknown> {
  try { return await req.json() } catch { return {} }
}
