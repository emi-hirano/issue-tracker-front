# CLAUDE.md — issue-tracker-front

このファイルは Claude Code がこのリポジトリで作業するときの取扱説明書。
前半「共通の開発方針」は全プロジェクト共通（他リポジトリの CLAUDE.md と同一）。
後半「このプロジェクト固有」がフロントエンド(React)固有の情報。

---

## 共通の開発方針（全プロジェクト共通）

### 仕様(オラクル)を先に置く
- テストやリファクタの前に、対象の「あるべき挙動」の仕様を確認する。
- 仕様は `docs/specs/` に置く。テストの期待値は実装コードではなく仕様を唯一の根拠とする。
- 仕様が無い/曖昧なら、勝手に推測・捏造せず「先に仕様を確定させましょう」と止める。
  実装を見ながら仕様を起こすと「現状追認」に戻るので、そこは別工程。

### テストは仕様ベースで（現状追認にしない）
- 実装をなぞったテスト（コードがこう動く、を写経したもの）は書かない。
  それはバグを"正解"として固定してしまう。
- 手順：まずテストケース表を出す → 人がレビュー（品質ゲート）→ 承認後にコード生成。
- 各期待値には「仕様のどの記述由来か」を添える。根拠が書けない＝実装推測の疑い。
- 詳しい手順は `.claude/skills/spec-based-testing/` を使う。

### リファクタは安全網で挟む
- リファクタ＝振る舞いを変えず構造だけ変える。それを保証するのはテスト。
- 手順：リファクタ前に全緑を確認 → 変更 → 後に全緑を確認。前後2回がセット。
- テストが無い箇所はいきなりリファクタせず、先に仕様ベースで網を張る。
- リファクタ中にテストを実装へ合わせて直さない（赤＝振る舞いが変わった証拠）。
- 詳しい手順は `.claude/skills/safe-refactoring/` を使う。

### バグ修正とリファクタは分ける
- 作業中にバグを見つけたら、リファクタと同じコミットに混ぜない。
- バグ修正 → 正しい挙動をテストで固定 → それからリファクタ、の順。別コミットにする。

### git は手作業
- `commit` / `push` は実行しない。コミットの単位やメッセージは提案するに留め、実行は人が行う。
- 状態確認（`git status` / `git diff` / `git log`）は行ってよい。

### 説明できるものだけ残す
- 自分（開発者）が説明できないコードは残さない。
- README・仕様書には、実際にやったこと・検証したことだけを書く。推測や未検証を断定しない。

---

## このプロジェクト固有（フロントエンド）

### スタック
- React 19 + TypeScript + Vite + React Router
- API は別リポジトリ（issue-tracker-api / Laravel）。本フロントは画面のみ。
- API仕様は issue-tracker-api の `docs/specs/issue.md` を参照。画面仕様は本リポジトリの
  `docs/specs/frontend.md`。

### テスト
- 実行：`npm test`（Vitest。watch モードで起動。`q` で終了）
- スタック：Vitest + React Testing Library + jsdom + MSW
- コンポーネントを描画するテストは拡張子 `.tsx`。`render` + `screen` を使う。
- マッチャ拡張（`toBeInTheDocument` 等）は `src/test/setup.ts` で `@testing-library/jest-dom`
  を読み込んでいる。
- テストの実装規約に迷ったら、まず既存の `src/test/` を見る。

### API モック（MSW）
- API 呼び出しは全画面 `src/utils/api.ts` の `apiFetch` 経由。テストでは本物のAPIを呼ばず、
  MSW が fetch を横取りして偽レスポンスを返す。コンポーネントはモック用に書き換えない。
- ハンドラー定義：`src/test/handlers.ts`。API_BASE は `http://localhost/api`（`apiFetch` の
  デフォルトに一致させること。ズレると横取りできない）。
- サーバー登録は `src/test/setup.ts`。`onUnhandledRequest: 'error'` にしてあるので、
  ハンドラー未定義のパスを叩くとエラーになる（モックし忘れ検知。エラーが出たら handlers に足す）。
- テストごとに `afterEach(server.resetHandlers())` で初期化。特定テストだけ応答を変えたいときは
  そのテスト内で `server.use(...)` して上書きする。

### 環境上の注意（ハマりどころ）
- **Node の localStorage 問題**：この環境の Node はネイティブ localStorage を持つが、
  テスト時に無効化されて `undefined` になり、jsdom の localStorage を潰す。
  `apiFetch` は `localStorage.getItem("token")` を呼ぶため、対策しないとテストが落ちる。
  → `src/test/setup.ts` で `vi.stubGlobal('localStorage', ...)` により自前のモックに差し替え済み。
  新しいテストでトークン関連が絡んでも、この差し替えが効くので追加対応は不要。

### 画面仕様の要点（詳細は docs/specs/frontend.md）
- エラー表示は画面内インライン（赤）に統一。`alert` は使わない。`console.error` 単独も禁止。
  ただし `window.confirm`（削除・Close確認）はネイティブのまま使ってよい。
- 起票者(reporter)はサーバがログインユーザーで確定する。作成・編集フォームに起票者選択UIを
  置かない。`reporter_id` はリクエストに含めない（一覧・詳細での表示は可）。
- データ取得中は `Loading` を表示。送信中はフォームを隠さずボタンを無効化する。
- 一覧の絞り込み（検索・フィルタ・Closed表示）はサーバ側で行う（クライアント側 .filter はしない）。
