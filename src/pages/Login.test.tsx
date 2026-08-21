import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../test/setup'
import Login from './Login'

// Login.tsx は apiFetch を経由せず直接 fetch している（VITE_API_URL 未設定時のデフォルト）ため、
// handlers.ts と同じベースURLを使う。
const API_BASE = 'http://localhost/api'

// /login に加えて、遷移先の / を「マーカーのdiv」として用意し、
// 「一覧(/)へ遷移したか」をこのマーカーの表示有無で判定する。
function renderLogin() {
  const view = render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>課題一覧ページ</div>} />
      </Routes>
    </MemoryRouter>
  )

  // label に htmlFor/id の関連付けが無く getByLabelText では拾えないため、
  // type 属性で入力欄を取得する（配線のためのセレクタで、挙動の期待値ではない）。
  const getEmailInput = () =>
    view.container.querySelector('input[type="email"]') as HTMLInputElement
  const getPasswordInput = () =>
    view.container.querySelector('input[type="password"]') as HTMLInputElement

  return { ...view, getEmailInput, getPasswordInput }
}

describe('Login画面', () => {
  // #1 初期表示
  it('メールアドレス欄・パスワード欄・ログインボタンが表示される', () => {
    const { getEmailInput, getPasswordInput } = renderLogin()

    expect(getEmailInput()).toBeInTheDocument()
    expect(getPasswordInput()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  // #2 正しいemail/passwordでログイン成功
  it('ログイン成功時、トークンを保存し一覧(/)へ遷移する', async () => {
    const user = userEvent.setup()
    const { getEmailInput, getPasswordInput } = renderLogin()

    await user.type(getEmailInput(), 'user@example.com')
    await user.type(getPasswordInput(), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    // 仕様: 成功時は課題一覧(/)へ遷移する
    expect(await screen.findByText('課題一覧ページ')).toBeInTheDocument()
    // 仕様: 成功時は認証トークンを保存する
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  // #3 ログイン失敗(401)
  it('認証失敗(401)時、「ログインに失敗しました」を赤で表示する', async () => {
    server.use(
      http.post(`${API_BASE}/login`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      })
    )

    const user = userEvent.setup()
    const { getEmailInput, getPasswordInput } = renderLogin()

    await user.type(getEmailInput(), 'user@example.com')
    await user.type(getPasswordInput(), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    const errorMessage = await screen.findByText('ログインに失敗しました')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  // #4 通信エラー
  it('通信エラー時も、401時と同じ「ログインに失敗しました」を表示する', async () => {
    server.use(
      http.post(`${API_BASE}/login`, () => {
        return HttpResponse.error()
      })
    )

    const user = userEvent.setup()
    const { getEmailInput, getPasswordInput } = renderLogin()

    await user.type(getEmailInput(), 'user@example.com')
    await user.type(getPasswordInput(), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    // 仕様: 認証失敗(401)と通信エラーはメッセージで区別しない（一律同じ文言）
    expect(await screen.findByText('ログインに失敗しました')).toBeInTheDocument()
  })

  // #5 メールアドレスが空のまま送信
  it('メールアドレスが空のまま送信すると、送信せず「入力してください」を表示する', async () => {
    const user = userEvent.setup()
    const { getPasswordInput } = renderLogin()

    await user.type(getPasswordInput(), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText('入力してください')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  // #6 パスワードが空のまま送信
  it('パスワードが空のまま送信すると、送信せず「入力してください」を表示する', async () => {
    const user = userEvent.setup()
    const { getEmailInput } = renderLogin()

    await user.type(getEmailInput(), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText('入力してください')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  // #7 メール・パスワード両方空のまま送信
  it('メール・パスワード両方空のまま送信すると、送信せず「入力してください」を表示する', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText('入力してください')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  // #8 送信中は二重送信防止のためログインボタンを無効化する
  it('送信中はログインボタンを無効化する', async () => {
    server.use(
      http.post(`${API_BASE}/login`, async () => {
        await delay(50)
        return HttpResponse.json({ token: 'test-token' })
      })
    )

    const user = userEvent.setup()
    const { getEmailInput, getPasswordInput } = renderLogin()

    await user.type(getEmailInput(), 'user@example.com')
    await user.type(getPasswordInput(), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    // レスポンス待ちの間（delay 50ms 内）はボタンが無効化されているはず
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeDisabled()
    })
  })

  // #9 トークンがある状態で/loginへアクセスすると一覧へ自動リダイレクト
  it('ログイン済み(トークンあり)で/loginへアクセスすると、一覧(/)へ自動リダイレクトする', () => {
    localStorage.setItem('token', 'existing-token')

    renderLogin()

    expect(screen.getByText('課題一覧ページ')).toBeInTheDocument()
  })

  // #10 トークンが無い状態で/loginへアクセスするとフォーム表示のまま
  it('未ログイン(トークンなし)で/loginへアクセスすると、ログインフォームが表示されたままになる', () => {
    renderLogin()

    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.queryByText('課題一覧ページ')).not.toBeInTheDocument()
  })
})
