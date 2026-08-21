import { describe, it, expect } from 'vitest'
import { apiFetch } from '../utils/api'

describe('MSWの疎通確認', () => {
  it('apiFetchがモックされたラベル一覧を返す', async () => {
    const labels = await apiFetch('/labels')
    expect(labels).toHaveLength(2)
    expect(labels[0].name).toBe('bug')
  })
})