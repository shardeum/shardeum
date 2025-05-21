import { getExternalApiMiddleware } from '../../../../src/middleware/externalApiMiddleware'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { Request, Response } from 'express'

describe('externalApiMiddleware - pattern matching', () => {
  const originalServiceMode = ShardeumFlags.startInServiceMode
  const originalAllowed = [...ShardeumFlags.allowedEndpointsInServiceMode]

  afterEach(() => {
    ShardeumFlags.startInServiceMode = originalServiceMode
    ShardeumFlags.allowedEndpointsInServiceMode = [...originalAllowed]
    jest.clearAllMocks()
  })

  test('should treat regex metacharacters literally', () => {
    ShardeumFlags.startInServiceMode = true
    ShardeumFlags.allowedEndpointsInServiceMode = ['GET /files/file[123].json']
    const middleware = getExternalApiMiddleware()

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    const next = jest.fn()
    const req = { path: '/files/file[123].json', method: 'GET' } as Request
    middleware(req, res as Response, next)
    expect(next).toHaveBeenCalled()
    expect((res.status as jest.Mock).mock.calls.length).toBe(0)

    const disallowedRes: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const disallowedNext = jest.fn()
    const disallowedReq = { path: '/files/file1.json', method: 'GET' } as Request
    middleware(disallowedReq, disallowedRes as Response, disallowedNext)
    expect(disallowedNext).not.toHaveBeenCalled()
    expect(disallowedRes.status).toHaveBeenCalledWith(403)
  })

  test('should match wildcard patterns with special characters', () => {
    ShardeumFlags.startInServiceMode = true
    ShardeumFlags.allowedEndpointsInServiceMode = ['GET /path/test$1/*']
    const middleware = getExternalApiMiddleware()

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()
    const req = { path: '/path/test$1/foo', method: 'GET' } as Request
    middleware(req, res as Response, next)
    expect(next).toHaveBeenCalled()
    expect((res.status as jest.Mock).mock.calls.length).toBe(0)

    const res2: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next2 = jest.fn()
    const req2 = { path: '/path/test$2/foo', method: 'GET' } as Request
    middleware(req2, res2 as Response, next2)
    expect(next2).not.toHaveBeenCalled()
    expect(res2.status).toHaveBeenCalledWith(403)
  })
})
