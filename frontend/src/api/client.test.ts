import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiClient, buildQuery } from './client'

describe('buildQuery', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildQuery({})).toBe('')
  })

  it('skips undefined and empty-string values', () => {
    expect(buildQuery({ q: undefined, director: '' })).toBe('')
  })

  it('serializes a single scalar param', () => {
    expect(buildQuery({ page: 2 })).toBe('?page=2')
  })

  it('repeats the key for each item in an array param', () => {
    expect(buildQuery({ genre_ids: ['a', 'b'] })).toBe('?genre_ids=a&genre_ids=b')
  })

  it('omits an empty array entirely', () => {
    expect(buildQuery({ genre_ids: [] })).toBe('')
  })

  it('combines multiple params with &', () => {
    const result = buildQuery({ q: 'matrix', page: 1 })

    expect(result).toBe('?q=matrix&page=1')
  })
})

function jsonResponse(
  body: unknown,
  init: { status?: number; ok?: boolean; statusText?: string } = {},
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? '',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('apiClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends a GET request with JSON headers and no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    const result = await apiClient.get('/movies/m1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/movies/m1'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    )
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('method')
    expect(result).toEqual({ id: 1 })
  })

  it('sends a POST request with a JSON-stringified body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 2 }))

    const result = await apiClient.post('/movies', { titulo: 'Duna' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ titulo: 'Duna' }) }),
    )
    expect(result).toEqual({ id: 2 })
  })

  it('sends a PUT request with a JSON-stringified body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 3 }))

    await apiClient.put('/movies/m1', { titulo: 'Duna 2' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ titulo: 'Duna 2' }) }),
    )
  })

  it('sends a DELETE request and returns undefined for a 204 response without parsing the body', async () => {
    const json = vi.fn()
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content', json })

    const result = await apiClient.delete('/movies/m1')

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }))
    expect(result).toBeUndefined()
    expect(json).not.toHaveBeenCalled()
  })

  it('rejects with an ApiError carrying the status and the string detail from the body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Filme não encontrado' }, { ok: false, status: 404 }))

    await expect(apiClient.get('/movies/nope')).rejects.toBeInstanceOf(ApiError)
    await expect(apiClient.get('/movies/nope')).rejects.toMatchObject({
      status: 404,
      message: 'Filme não encontrado',
    })
  })

  it('joins Pydantic-style validation errors from an array detail', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { detail: [{ msg: 'campo obrigatório' }, { msg: 'valor inválido' }] },
        { ok: false, status: 422 },
      ),
    )

    await expect(apiClient.post('/movies', {})).rejects.toMatchObject({
      status: 422,
      message: 'campo obrigatório; valor inválido',
    })
  })

  it('skips validation items without a message when joining the array detail', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ msg: 'campo obrigatório' }, {}] }, { ok: false, status: 422 }),
    )

    await expect(apiClient.post('/movies', {})).rejects.toMatchObject({ message: 'campo obrigatório' })
  })

  it('falls back to statusText when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('not json')),
    })

    await expect(apiClient.get('/movies')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })
})
