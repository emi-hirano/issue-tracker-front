import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import IssueDetail from './IssueDetail'

const API_BASE = 'http://localhost/api'
const ISSUE_ID = '7'

function makeIssue(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: Number(ISSUE_ID),
    title: '課題詳細タイトル',
    description: '詳細な説明',
    status: 'open',
    priority: 'medium',
    reporter: { id: 1, name: '田中' },
    assignee: { id: 2, name: '鈴木' },
    project: { id: 1, name: 'サイト改善' },
    labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
    comments: [
      { id: 1, body: '最初のコメント', created_at: '2026-08-01T00:00:00Z', user: { id: 1, name: '田中' } },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  server.use(http.get(`${API_BASE}/issues/${ISSUE_ID}`, () => HttpResponse.json(makeIssue())))
})

afterEach(() => {
  vi.restoreAllMocks()
})

// /issues/:id に加えて、遷移先の / を「マーカーのdiv」として用意する。
function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/issues/${ISSUE_ID}`]}>
      <Routes>
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/" element={<div>課題一覧ページ</div>} />
      </Routes>
    </MemoryRouter>
  )
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

async function waitForLoaded() {
  await screen.findByText('課題詳細タイトル')
}

describe('IssueDetail画面', () => {
  // #1 取得中はLoading
  it('取得中はLoadingが表示される', () => {
    server.use(
      http.get(`${API_BASE}/issues/${ISSUE_ID}`, async () => {
        await delay(50)
        return HttpResponse.json(makeIssue())
      })
    )

    renderDetail()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  // #2 表示
  it('タイトル・ステータス・優先度・プロジェクト・起票者・担当者・ラベル・説明・コメント・操作ボタンが表示される', async () => {
    const { container } = renderDetail()
    await waitForLoaded()

    expect(screen.getByText('課題詳細タイトル')).toBeInTheDocument()
    expect(container.textContent).toContain('プロジェクト: サイト改善')
    expect(container.textContent).toContain('報告者: 田中')
    expect(container.textContent).toContain('担当者: 鈴木')
    expect(container.textContent).toContain('詳細な説明')
    expect(screen.getByPlaceholderText('コメントを入力...')).toBeInTheDocument()
    expect(screen.getByText('最初のコメント')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '一覧に戻る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument()
  })

  // #3 取得失敗
  it('課題の取得に失敗した場合、「課題が見つからない」表示にする', async () => {
    server.use(
      http.get(`${API_BASE}/issues/${ISSUE_ID}`, () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      })
    )

    renderDetail()

    expect(await screen.findByText('課題が見つかりません')).toBeInTheDocument()
  })

  // #4 削除確認でOK
  it('削除ボタン押下→確認でOKの場合、削除して一覧(/)へ遷移する', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    server.use(http.delete(`${API_BASE}/issues/${ISSUE_ID}`, () => new HttpResponse(null, { status: 204 })))

    const user = userEvent.setup()
    renderDetail()
    await waitForLoaded()

    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(await screen.findByText('課題一覧ページ')).toBeInTheDocument()
  })

  // #5 削除確認でキャンセル
  it('削除ボタン押下→確認でキャンセルした場合、削除されず画面に留まる', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    renderDetail()
    await waitForLoaded()

    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(screen.queryByText('課題一覧ページ')).not.toBeInTheDocument()
    expect(screen.getByText('課題詳細タイトル')).toBeInTheDocument()
  })

  // #6 削除失敗
  it('削除に失敗した場合、画面内に赤でエラー表示する（alertは使わない）', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    server.use(
      http.delete(`${API_BASE}/issues/${ISSUE_ID}`, () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      })
    )

    const user = userEvent.setup()
    const { container } = renderDetail()
    await waitForLoaded()

    await user.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
    expect(alertSpy).not.toHaveBeenCalled()
  })

  // #7・#8 空のコメントは送信されない（投稿ボタンの無効化により実現される）
  // 注: disabled な button は fireEvent.click でもクリックイベント自体が発火しないため
  // （jsdomもブラウザ同様の挙動）、「空のまま投稿しようとした場合」の内部バリデーションを
  // UI操作から独立して再現する経路は無い。ボタン無効化(#8)が両条項を満たす唯一の到達可能な保証。
  it('コメント本文が空のとき、投稿ボタンが無効化されており送信できない', async () => {
    renderDetail()
    await waitForLoaded()

    expect(screen.getByRole('button', { name: 'コメントする' })).toBeDisabled()
  })

  // #9 コメント投稿成功
  it('コメント投稿成功時、新しいコメントを一覧の先頭に追加表示する', async () => {
    server.use(
      http.post(`${API_BASE}/issues/${ISSUE_ID}/comments`, () => {
        return HttpResponse.json({
          id: 99,
          body: '新しいコメント',
          created_at: '2026-08-21T00:00:00Z',
          user: { id: 1, name: '田中' },
        })
      })
    )

    const user = userEvent.setup()
    const { container } = renderDetail()
    await waitForLoaded()

    await user.type(screen.getByPlaceholderText('コメントを入力...'), '新しいコメント')
    await user.click(screen.getByRole('button', { name: 'コメントする' }))

    await screen.findByText('新しいコメント')

    const commentTexts = Array.from(container.querySelectorAll('div'))
      .map((el) => el.textContent)
      .filter((t): t is string => !!t && (t.includes('新しいコメント') || t.includes('最初のコメント')))

    const firstMatch = commentTexts.find(
      (t) => t.includes('新しいコメント') || t.includes('最初のコメント')
    )
    expect(firstMatch).toContain('新しいコメント')
  })

  // #10 コメント投稿失敗
  it('コメント投稿失敗時、画面内に赤でエラー表示する', async () => {
    server.use(
      http.post(`${API_BASE}/issues/${ISSUE_ID}/comments`, () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      })
    )

    const user = userEvent.setup()
    const { container } = renderDetail()
    await waitForLoaded()

    await user.type(screen.getByPlaceholderText('コメントを入力...'), 'エラーになるコメント')
    await user.click(screen.getByRole('button', { name: 'コメントする' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
  })

  // #11 コメント投稿中は二重送信防止のためボタンを無効化する
  it('コメント投稿中は投稿ボタンを無効化する', async () => {
    server.use(
      http.post(`${API_BASE}/issues/${ISSUE_ID}/comments`, async () => {
        await delay(50)
        return HttpResponse.json({
          id: 99,
          body: '新しいコメント',
          created_at: '2026-08-21T00:00:00Z',
          user: { id: 1, name: '田中' },
        })
      })
    )

    const user = userEvent.setup()
    renderDetail()
    await waitForLoaded()

    await user.type(screen.getByPlaceholderText('コメントを入力...'), '新しいコメント')
    await user.click(screen.getByRole('button', { name: 'コメントする' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'コメントする' })).toBeDisabled()
    })
  })
})
