import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import EditIssue from './EditIssue'

const API_BASE = 'http://localhost/api'
const ISSUE_ID = '42'

const projects = [
  { id: 1, name: 'サイト改善' },
  { id: 2, name: 'バックエンド刷新' },
]
const users = [
  { id: 1, name: '田中' },
  { id: 2, name: '鈴木' },
]

function makeIssue(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: Number(ISSUE_ID),
    project_id: 1,
    reporter: { id: 1, name: '田中' },
    assignee: { id: 2, name: '鈴木' },
    title: '既存のタイトル',
    description: '既存の説明',
    status: 'open',
    priority: 'medium',
    labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
    ...overrides,
  }
}

let lastPutBody: Record<string, unknown> | null = null

beforeEach(() => {
  lastPutBody = null
  server.use(
    http.get(`${API_BASE}/projects`, () => HttpResponse.json(projects)),
    http.get(`${API_BASE}/users`, () => HttpResponse.json(users)),
    http.get(`${API_BASE}/issues/${ISSUE_ID}`, () => HttpResponse.json(makeIssue())),
    http.put(`${API_BASE}/issues/${ISSUE_ID}`, async ({ request }) => {
      lastPutBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeIssue())
    })
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

// /issues/:id/edit に加えて、遷移先の /issues/:id と / を「マーカーのdiv」として用意する。
function renderEditIssue() {
  return render(
    <MemoryRouter initialEntries={[`/issues/${ISSUE_ID}/edit`]}>
      <Routes>
        <Route path="/issues/:id/edit" element={<EditIssue />} />
        <Route path="/issues/:id" element={<div>課題詳細ページ</div>} />
        <Route path="/" element={<div>課題一覧ページ</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// label に htmlFor/id の関連付けが無いフィールドを、隣接する label のテキストから取得する（配線）。
function getFieldControl(container: HTMLElement, labelText: string) {
  const labels = Array.from(container.querySelectorAll('label'))
  const label = labels.find((el) => el.textContent === labelText)
  return (label?.nextElementSibling ?? null) as HTMLElement | null
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

async function waitForLoaded(container: HTMLElement) {
  await waitFor(() => {
    expect(getFieldControl(container, 'タイトル')).toHaveValue('既存のタイトル')
  })
}

describe('EditIssue画面', () => {
  // #1 既存データ取得中はLoading
  it('既存データ取得中はLoadingが表示される', () => {
    server.use(
      http.get(`${API_BASE}/projects`, async () => {
        await delay(50)
        return HttpResponse.json(projects)
      })
    )

    renderEditIssue()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  // #2 既存データがフォームに初期表示される
  it('既存データ取得後、フォーム各項目に初期値が反映される', async () => {
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    expect(getFieldControl(container, 'プロジェクト')).toHaveValue('1')
    expect(getFieldControl(container, '説明')).toHaveValue('既存の説明')
    expect(getFieldControl(container, 'ステータス')).toHaveValue('open')
    expect(getFieldControl(container, '優先度')).toHaveValue('medium')
    expect(getFieldControl(container, '担当者')).toHaveValue('2')
    expect(screen.getByRole('checkbox', { name: 'bug' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'feature' })).not.toBeChecked()
  })

  // #3 起票者選択UIは無い
  it('起票者(報告者)選択UIは表示されない', async () => {
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    expect(getFieldControl(container, '報告者')).not.toBeInTheDocument()
  })

  // #4 プロジェクト未選択のまま更新
  it('プロジェクトを未選択にして更新すると、送信せずエラー表示する', async () => {
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, '')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
    expect(screen.queryByText('課題詳細ページ')).not.toBeInTheDocument()
  })

  // #5 タイトル未入力のまま更新
  it('タイトルを空にして更新すると、送信せずエラー表示する', async () => {
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.clear(getFieldControl(container, 'タイトル') as HTMLElement)
    await user.click(screen.getByRole('button', { name: '更新する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
    expect(screen.queryByText('課題詳細ページ')).not.toBeInTheDocument()
  })

  // #6 必須項目を保持したまま更新成功
  it('必須項目を保持したまま更新すると、課題詳細(/issues/:id)へ遷移する', async () => {
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(await screen.findByText('課題詳細ページ')).toBeInTheDocument()
  })

  // #7 reporter_idをリクエストに含めない
  it('更新リクエストにreporter_idを含めない', async () => {
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.click(screen.getByRole('button', { name: '更新する' }))

    await waitFor(() => {
      expect(lastPutBody).not.toBeNull()
    })
    expect(lastPutBody).not.toHaveProperty('reporter_id')
  })

  // #8 既存データの取得に失敗
  it('既存データの取得に失敗した場合、「課題が見つからない」表示にする（空フォームは表示しない）', async () => {
    server.use(
      http.get(`${API_BASE}/issues/${ISSUE_ID}`, () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      })
    )

    const { container } = renderEditIssue()

    expect(await screen.findByText('課題が見つかりません')).toBeInTheDocument()
    expect(getFieldControl(container, 'タイトル')).not.toBeInTheDocument()
  })

  // #9 closed以外からclosedへの変更はconfirmで確認し、OKなら更新される
  it('ステータスをclosed以外からclosedに変更して更新すると、確認ダイアログが出て、OKなら更新される', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'ステータス') as HTMLElement, 'closed')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(await screen.findByText('課題詳細ページ')).toBeInTheDocument()
  })

  // #10 closed以外からclosedへの変更でキャンセルした場合は更新しない
  it('ステータスをclosed以外からclosedに変更して更新し、確認をキャンセルすると更新しない', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'ステータス') as HTMLElement, 'closed')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(screen.queryByText('課題詳細ページ')).not.toBeInTheDocument()
    expect(lastPutBody).toBeNull()
  })

  // #11 closed以外からclosed以外への変更はconfirmを出さない
  it('ステータスをclosed以外からclosed以外に変更して更新する場合、確認ダイアログを出さない', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'ステータス') as HTMLElement, 'in_progress')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(await screen.findByText('課題詳細ページ')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  // #12 更新がサーバエラーになった場合
  it('更新リクエストがサーバエラーになった場合、画面内に赤でエラー表示する', async () => {
    server.use(
      http.put(`${API_BASE}/issues/${ISSUE_ID}`, () => {
        return HttpResponse.json({ message: 'Validation Error' }, { status: 422 })
      })
    )

    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.click(screen.getByRole('button', { name: '更新する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
  })

  // #13 送信中はフォームを隠さず更新ボタンを無効化する
  it('送信中はフォームを隠さず、更新ボタンを無効化する', async () => {
    server.use(
      http.put(`${API_BASE}/issues/${ISSUE_ID}`, async () => {
        await delay(50)
        return HttpResponse.json(makeIssue())
      })
    )

    const user = userEvent.setup()
    const { container } = renderEditIssue()
    await waitForLoaded(container)

    await user.click(screen.getByRole('button', { name: '更新する' }))

    await waitFor(() => {
      // 仕様(横断3引継ぎ): 送信中もフォームを隠さない（全画面Loadingへの切り替えはしない）
      expect(getFieldControl(container, 'タイトル')).toBeInTheDocument()
      // 仕様: 送信中は更新ボタンを無効化する
      expect(screen.getByRole('button', { name: '更新する' })).toBeDisabled()
    })
  })
})
