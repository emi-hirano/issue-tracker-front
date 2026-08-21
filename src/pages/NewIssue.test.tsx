import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import NewIssue from './NewIssue'

const API_BASE = 'http://localhost/api'

const projects = [
  { id: 1, name: 'サイト改善' },
  { id: 2, name: 'バックエンド刷新' },
]
const users = [
  { id: 1, name: '田中' },
  { id: 2, name: '鈴木' },
]

let lastIssueRequestBody: Record<string, unknown> | null = null

beforeEach(() => {
  lastIssueRequestBody = null
  server.use(
    http.get(`${API_BASE}/projects`, () => HttpResponse.json(projects)),
    http.get(`${API_BASE}/users`, () => HttpResponse.json(users)),
    http.post(`${API_BASE}/issues`, async ({ request }) => {
      lastIssueRequestBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ id: 1 }, { status: 201 })
    })
  )
})

// /issues/new に加えて、遷移先の / を「マーカーのdiv」として用意し、
// 「一覧(/)へ遷移したか」をこのマーカーの表示有無で判定する。
function renderNewIssue() {
  return render(
    <MemoryRouter initialEntries={['/issues/new']}>
      <Routes>
        <Route path="/issues/new" element={<NewIssue />} />
        <Route path="/" element={<div>課題一覧ページ</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// label に htmlFor/id の関連付けが無いフィールド（プロジェクト・報告者・担当者・タイトル・説明・
// ステータス・優先度）を、隣接する label のテキストから取得する（配線のためのセレクタ）。
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
    expect(getFieldControl(container, 'タイトル')).toBeInTheDocument()
  })
}

describe('NewIssue画面', () => {
  // #1 初期表示中はLoading
  it('初期データ取得中はLoadingが表示される', async () => {
    server.use(
      http.get(`${API_BASE}/projects`, async () => {
        await delay(50)
        return HttpResponse.json(projects)
      })
    )

    renderNewIssue()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  // #2 表示（起票者選択UIは無い）
  it('初期データ取得後、必要な入力欄・ボタンが表示され、起票者(報告者)選択UIは表示されない', async () => {
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    expect(getFieldControl(container, 'プロジェクト')).toBeInTheDocument()
    expect(getFieldControl(container, '担当者')).toBeInTheDocument()
    expect(getFieldControl(container, 'タイトル')).toBeInTheDocument()
    expect(getFieldControl(container, '説明')).toBeInTheDocument()
    expect(getFieldControl(container, 'ステータス')).toBeInTheDocument()
    expect(getFieldControl(container, '優先度')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登録する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '一覧に戻る' })).toBeInTheDocument()

    // 仕様(横断2): 起票者(報告者)の選択UIは置かない
    expect(getFieldControl(container, '報告者')).not.toBeInTheDocument()
  })

  // #3 ステータス・優先度の初期値
  it('ステータスの初期値はopen、優先度の初期値はmediumである', async () => {
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    expect(getFieldControl(container, 'ステータス')).toHaveValue('open')
    expect(getFieldControl(container, '優先度')).toHaveValue('medium')
  })

  // #4 ステータス・優先度の選択肢が固定の許可値と一致する
  it('ステータス・優先度の選択肢が固定の許可値のみである', async () => {
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    const statusSelect = getFieldControl(container, 'ステータス') as HTMLSelectElement
    const priority = getFieldControl(container, '優先度') as HTMLSelectElement

    const statusOptions = Array.from(statusSelect.options).map((o) => o.value)
    const priorityOptions = Array.from(priority.options).map((o) => o.value)

    expect(statusOptions).toEqual(['open', 'in_progress', 'resolved', 'closed'])
    expect(priorityOptions).toEqual(['low', 'medium', 'high'])
  })

  // #5 プロジェクト未選択のまま送信
  it('プロジェクト未選択のまま送信すると、送信せずエラー表示する', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
    expect(screen.queryByText('課題一覧ページ')).not.toBeInTheDocument()
  })

  // #6 タイトル未入力のまま送信
  it('タイトル未入力のまま送信すると、送信せずエラー表示する', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
    expect(screen.queryByText('課題一覧ページ')).not.toBeInTheDocument()
  })

  // #7 担当者未割り当てのまま送信成功
  it('担当者を未選択(未割り当て)のまま送信すると、assignee_idがnullで登録成功する', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(await screen.findByText('課題一覧ページ')).toBeInTheDocument()
    expect(lastIssueRequestBody?.assignee_id).toBeNull()
  })

  // #8 必須項目を入力して送信成功
  it('必須項目を入力して送信すると、一覧(/)へ遷移する', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(await screen.findByText('課題一覧ページ')).toBeInTheDocument()
  })

  // #9 reporter_idをリクエストに含めない
  it('送信リクエストにreporter_idを含めない', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(lastIssueRequestBody).not.toBeNull()
    })
    expect(lastIssueRequestBody).not.toHaveProperty('reporter_id')
  })

  // #10 サーバがエラーを返す
  it('登録リクエストがサーバエラーになった場合、画面内に赤でエラー表示する', async () => {
    server.use(
      http.post(`${API_BASE}/issues`, () => {
        return HttpResponse.json({ message: 'Validation Error' }, { status: 422 })
      })
    )

    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
  })

  // #11 送信中はフォームを隠さず登録ボタンを無効化する
  it('送信中はフォームを隠さず、登録ボタンを無効化する', async () => {
    server.use(
      http.post(`${API_BASE}/issues`, async () => {
        await delay(50)
        return HttpResponse.json({ id: 1 }, { status: 201 })
      })
    )

    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      // 仕様(横断3): 送信中もフォームを隠さない（全画面Loadingへの切り替えはしない）
      expect(getFieldControl(container, 'タイトル')).toBeInTheDocument()
      // 仕様: 送信中は登録ボタンを無効化する
      expect(screen.getByRole('button', { name: '登録する' })).toBeDisabled()
    })
  })

  // #12 ラベルを複数選択して送信
  it('ラベルを複数選択して送信すると、label_idsに反映され登録成功する', async () => {
    const user = userEvent.setup()
    const { container } = renderNewIssue()
    await waitForLoaded(container)

    await user.selectOptions(getFieldControl(container, 'プロジェクト') as HTMLElement, 'サイト改善')
    await user.type(getFieldControl(container, 'タイトル') as HTMLElement, 'タイトルあり')
    await user.click(screen.getByRole('checkbox', { name: 'bug' }))
    await user.click(screen.getByRole('checkbox', { name: 'feature' }))
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(await screen.findByText('課題一覧ページ')).toBeInTheDocument()
    expect(lastIssueRequestBody?.label_ids).toEqual(expect.arrayContaining([1, 2]))
  })

  // #13 初期データ取得に失敗
  it('初期データ取得に失敗した場合、画面内に赤でエラー表示する', async () => {
    server.use(
      http.get(`${API_BASE}/projects`, () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      })
    )

    const { container } = renderNewIssue()

    await waitFor(() => {
      expect(findRedText(container)).toBeTruthy()
    })
  })
})
