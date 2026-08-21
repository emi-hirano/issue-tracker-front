import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import IssueList from './IssueList'
import { formatDate } from '../utils/format'

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

let lastIssuesRequestUrl: URL | null = null
let issuesRequestCount = 0

beforeEach(() => {
  lastIssuesRequestUrl = null
  issuesRequestCount = 0
  server.use(
    http.get(`${API_BASE}/issues`, ({ request }) => {
      lastIssuesRequestUrl = new URL(request.url)
      issuesRequestCount += 1
      return HttpResponse.json({ data: makeIssues(), current_page: 1, last_page: 1 })
    })
  )
})

function IssueDetailMarker() {
  const { id } = useParams()
  return <div>課題詳細ページ:{id}</div>
}

// / に加えて、遷移先の /issues/new と /issues/:id を「マーカー」として用意する。
function renderIssueList() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<IssueList />} />
        <Route path="/issues/new" element={<div>課題新規登録ページ</div>} />
        <Route path="/issues/:id" element={<IssueDetailMarker />} />
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

// ステータス/優先度/ラベルのバッジ(span)をテキストで取得する（フィルタのoptionと区別するため）。
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

async function waitForLoaded(container: HTMLElement) {
  await waitFor(() => {
    expect(getFieldControl(container, 'タイトル:')).toBeInTheDocument()
  })
}

describe('IssueList画面', () => {
  // #1 取得中はLoading
  it('取得中はLoadingが表示される', () => {
    server.use(
      http.get(`${API_BASE}/issues`, async () => {
        await delay(50)
        return HttpResponse.json({ data: [], current_page: 1, last_page: 1 })
      })
    )

    renderIssueList()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  // #2 取得完了後の表示
  it('検索エリア・Closed表示切替・新規登録ボタン・ページネーションが表示される', async () => {
    const { container } = renderIssueList()
    await waitForLoaded(container)

    expect(getFieldControl(container, 'タイトル:')).toBeInTheDocument()
    expect(getFieldControl(container, 'ステータス:')).toBeInTheDocument()
    expect(getFieldControl(container, '優先度:')).toBeInTheDocument()
    expect(getFieldControl(container, 'ラベル:')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Closedを表示' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument()
  })

  // #3 カードの表示内容
  it('カードにタイトル・ステータス・優先度・起票者・起票日・ラベルが表示される', async () => {
    const { container } = renderIssueList()
    await waitForLoaded(container)

    const [issueA] = makeIssues()
    expect(screen.getByText('課題A')).toBeInTheDocument()
    expect(getBadge(container, 'open')).toBeInTheDocument()
    expect(getBadge(container, 'high')).toBeInTheDocument()
    expect(container.textContent).toContain('田中')
    expect(container.textContent).toContain(formatDate(issueA.created_at))
    expect(getBadge(container, 'bug')).toBeInTheDocument()
  })

  // #4 明るい背景色のラベルは黒文字
  it('明るい背景色(#ffffff)のラベルは黒文字で表示される', async () => {
    const { container } = renderIssueList()
    await waitForLoaded(container)

    const badge = getBadge(container, 'bug')
    expect(badge).toBeTruthy()
    expect(getComputedStyle(badge as Element).color).toBe('rgb(0, 0, 0)')
  })

  // #5 暗い背景色のラベルは白文字
  it('暗い背景色(#000000)のラベルは白文字で表示される', async () => {
    const { container } = renderIssueList()
    await waitForLoaded(container)

    const badge = getBadge(container, 'feature')
    expect(badge).toBeTruthy()
    expect(getComputedStyle(badge as Element).color).toBe('rgb(255, 255, 255)')
  })

  // #6 Closedの課題は視覚的に弱くする
  it('Closedの課題カードは打ち消し線が付く', async () => {
    renderIssueList()
    await waitFor(() => {
      expect(screen.getByText('課題B')).toBeInTheDocument()
    })

    expect(getComputedStyle(screen.getByText('課題B')).textDecoration).toContain('line-through')
  })

  // #7 キーワード入力のみ（検索ボタン未押下）
  it('キーワードを入力しただけでは再取得されない', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    const countAfterLoad = issuesRequestCount
    await user.type(getFieldControl(container, 'タイトル:') as HTMLElement, 'テスト')

    expect(issuesRequestCount).toBe(countAfterLoad)
  })

  // #8 検索ボタン押下で条件を確定して再取得する
  it('検索ボタン押下で、指定した条件が反映されて再取得される', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    await user.type(getFieldControl(container, 'タイトル:') as HTMLElement, 'テスト')
    await user.selectOptions(getFieldControl(container, 'ステータス:') as HTMLElement, 'open')
    await user.selectOptions(getFieldControl(container, '優先度:') as HTMLElement, 'high')
    await user.selectOptions(getFieldControl(container, 'ラベル:') as HTMLElement, 'bug')
    await user.click(screen.getByRole('button', { name: '検索' }))

    await waitFor(() => {
      expect(lastIssuesRequestUrl?.searchParams.get('keyword')).toBe('テスト')
    })
    expect(lastIssuesRequestUrl?.searchParams.get('status')).toBe('open')
    expect(lastIssuesRequestUrl?.searchParams.get('priority')).toBe('high')
    expect(lastIssuesRequestUrl?.searchParams.get('label_id')).toBe('1')
  })

  // #9 キーワードはEnterでも確定できる
  it('キーワード入力後Enterキーで、キーワードが確定され再取得される', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    await user.type(getFieldControl(container, 'タイトル:') as HTMLElement, 'テスト{Enter}')

    await waitFor(() => {
      expect(lastIssuesRequestUrl?.searchParams.get('keyword')).toBe('テスト')
    })
  })

  // #10 クリアで全ての検索条件をリセットする
  it('検索条件を設定後、クリアで全ての検索条件がリセットされ再取得される', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    await user.type(getFieldControl(container, 'タイトル:') as HTMLElement, 'テスト')
    await user.selectOptions(getFieldControl(container, 'ステータス:') as HTMLElement, 'open')
    await user.click(screen.getByRole('button', { name: '検索' }))
    await waitFor(() => {
      expect(lastIssuesRequestUrl?.searchParams.get('keyword')).toBe('テスト')
    })

    await user.click(screen.getByRole('button', { name: 'クリア' }))

    await waitFor(() => {
      expect(lastIssuesRequestUrl?.searchParams.get('keyword')).toBeNull()
    })
    expect(lastIssuesRequestUrl?.searchParams.get('status')).toBeNull()
    expect(lastIssuesRequestUrl?.searchParams.get('priority')).toBeNull()
    expect(lastIssuesRequestUrl?.searchParams.get('label_id')).toBeNull()
  })

  // #11 カードクリックで詳細へ遷移
  it('カードクリックで詳細(/issues/:id)へ遷移する', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    await user.click(screen.getByText('課題A'))

    expect(await screen.findByText('課題詳細ページ:1')).toBeInTheDocument()
  })

  // #12 一覧取得に失敗
  it('一覧取得に失敗した場合、赤でエラー表示し、ローディングを解除する', async () => {
    server.use(
      http.get(`${API_BASE}/issues`, () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      })
    )

    const { container } = renderIssueList()

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
    expect(findRedText(container)).toBeTruthy()
  })

  // #13 Closed表示切替はクライアント側で絞り込まない（サーバ側の絞り込みに委ねる）
  it('サーバがclosedな課題を含めて返す場合、Closed表示をOFFにしてもクライアント側で除外しない', async () => {
    const user = userEvent.setup()
    const { container } = renderIssueList()
    await waitForLoaded(container)

    expect(screen.getByText('課題B')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Closedを表示' }))

    expect(screen.getByText('課題B')).toBeInTheDocument()
  })
})
