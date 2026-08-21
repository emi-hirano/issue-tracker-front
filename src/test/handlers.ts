import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost/api'

// テストで使う、APIの偽レスポンス定義
export const handlers = [
  // ログイン成功
  http.post(`${API_BASE}/login`, () => {
    return HttpResponse.json({ token: 'test-token' })
  }),

  // ラベル一覧
  http.get(`${API_BASE}/labels`, () => {
    return HttpResponse.json([
      { id: 1, name: 'bug', color: '#ff0000' },
      { id: 2, name: 'feature', color: '#00ff00' },
    ])
  }),

  // 課題一覧（ページネーション形式に合わせる）
  http.get(`${API_BASE}/issues`, () => {
    return HttpResponse.json({
      data: [],
      current_page: 1,
      last_page: 1,
    })
  }),
]