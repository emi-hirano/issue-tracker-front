import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import MyIssues from './MyIssues'

const API_BASE = 'http://localhost/api'

function makeIssues() {
  return [
    {
      id: 1,
      title: '課題A',
      status: 'open',
      priority: 'high',
      created_at: '2026-08-01T00:00:00Z',
      reporter: { name: '田中' },
      labels: [{ id: 1, name: 'bug', color: '#ffffff' }],
    },
    {
      id: 2,
      title: '課題B',
      status: 'closed',
      priority: 'low',
      created_at: '2026-08-02T00:00:00Z',
      reporter: { name: '鈴木' },
      labels: [{ id: 2, name: 'feature', color: '#000000' }],
    },
  ]
}

beforeEach(() => {
  server.use(http.get(`${API_BASE}/my-issues`, () => HttpResponse.json({ data: makeIssues() })))
})

function IssueDetailMarker() {
  const { id } = useParams()
  return <div>課題詳細ページ:{id}</div>
}

function renderMyIssues() {
  return render(
    <MemoryRouter initialEntries={['/my-issues']}>
      <Routes>
        <Route path="/my-issues" element={<MyIssues />} />
        <Route path="/issues/:id" element={<IssueDetailMarker />} />
      </Routes>
    </MemoryRouter>
  )
}

// ステータス/優先度/ラベルのバッジ(span)をテキストで取得する。
function getBadge(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll('span')).find((el) => el.textContent === text)
}

// 画面内の「赤いテキスト」を探す（横断ルール1のエラー表示を検出するための配線）。
function findRedText(container: HTMLElement) {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>('div, p, span'))
  return candidates.find((el) => {
    if (el.children.length > 0) return false
    if (!el.textContent?.trim()) return false
    return getComputedStyle(el).color === 'rgb(255, 0, 0)'
  })
}

describe('MyIssues画面', () => {
  // #1 取得中はLoading
  it('取得中はLoadingが表示される', () => {
    server.use(
      http.get(`${API_BASE}/my-issues`, async () => {
        await delay(50)
        return HttpResponse.json({ data: makeIssues() })
      })
    )

    renderMyIssues()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  // #2 表示
  it('アサインされた課題がある場合、カード一覧が表示される', async () => {
    const { container } = renderMyIssues()
    await screen.findByText('課題A')

    expect(getBadge(container, 'open')).toBeInTheDocument()
    expect(getBadge(container, 'high')).toBeInTheDocument()
    expect(container.textContent).toContain('田中')
    expect(getBadge(container, 'bug')).toBeInTheDocument()
  })

  // #3 アサインされた課題が無い場合
  it('アサインされた課題が無い場合、「自分にアサインされた課題はありません。」と表示する', async () => {
    server.use(http.get(`${API_BASE}/my-issues`, () => HttpResponse.json({ data: [] })))

    renderMyIssues()

    expect(await screen.findByText('自分にアサインされた課題はありません。')).toBeInTheDocument()
  })

  // #4 カードクリックで詳細へ遷移
  it('カードクリックで詳細(/issues/:id)へ遷移する', async () => {
    const user = userEvent.setup()
    renderMyIssues()
    await screen.findByText('課題A')

    await user.click(screen.getByText('課題A'))

    expect(await screen.findByText('課題詳細ページ:1')).toBeInTheDocument()
  })

  // #5 取得に失敗した場合
  it('取得に失敗した場合、赤でエラー表示する', async () => {
    server.use(
      http.get(`${API_BASE}/my-issues`, () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      })
    )

    const { container } = renderMyIssues()

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
    expect(findRedText(container)).toBeTruthy()
  })

  // #6 成功時の説明文は表示しない
  it('取得成功時、説明文（「〜を表示しています」）は表示されない', async () => {
    renderMyIssues()
    await screen.findByText('課題A')

    expect(screen.queryByText(/を表示しています/)).not.toBeInTheDocument()
  })

  // #7 Closedの課題は視覚的に弱くする（IssueListの体裁を引き継ぐ）
  it('Closedの課題カードは打ち消し線が付く', async () => {
    renderMyIssues()
    await screen.findByText('課題A')

    expect(getComputedStyle(screen.getByText('課題B')).textDecoration).toContain('line-through')
  })

  // #8 ラベルの文字色切り替え（IssueListの体裁を引き継ぐ）
  it('明るい背景色のラベルは黒文字、暗い背景色のラベルは白文字で表示される', async () => {
    const { container } = renderMyIssues()
    await screen.findByText('課題A')

    expect(getComputedStyle(getBadge(container, 'bug') as Element).color).toBe('rgb(0, 0, 0)')
    expect(getComputedStyle(getBadge(container, 'feature') as Element).color).toBe(
      'rgb(255, 255, 255)'
    )
  })
})
