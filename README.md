# Issue Tracker Frontend

Issue Tracker のフロントエンドアプリケーションです。

React + TypeScript を使用してSPA（Single Page Application）を構築し、Laravel REST API と連携して課題管理を行います。

**Backend Repository**
- https://github.com/emi-hirano/issue-tracker-api

---

## 概要

React + TypeScript を使用してフロントエンドを実装しました。

課題一覧・詳細・新規作成・編集・削除に加え、ログイン機能、コメント機能、複数条件検索、My Issues（自分にアサインされた課題一覧）などを実装しています。

---

## 開発方針

このプロジェクトでは、生成AI（ChatGPT・Claude）を積極的に活用して開発を行いました。

AIをコード生成ツールとして利用するだけではなく、設計の相談、実装方針の比較、デバッグ、リファクタリングなどにも活用しています。

生成されたコードはそのまま利用するのではなく、内容を理解・検証し、自分で説明できるコードのみを採用することを開発方針としました。

また、使いやすいUIを意識し、実際に操作しながら改善を繰り返して完成度を高めました。

---

## 使用技術

| 項目 | 技術 |
|------|------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router |
| HTTP Client | Fetch API |
| Authentication | Laravel Sanctum |
| API | REST API |

---

## 主な機能

- ログイン
- 課題一覧表示
- 課題詳細表示
- 課題の新規作成
- 課題の編集
- 課題の削除
- コメントの投稿・削除
- タイトル・ステータス・優先度・ラベルによる複合検索
- ページネーション
- My Issues（自分にアサインされた課題一覧）
- 共通ヘッダー
- ログアウト
- Enterキーによるログイン

---

## 工夫した点

- React Router を利用した画面遷移
- 共通ヘッダーをコンポーネント化し、画面全体で再利用
- NavLink を利用し、現在表示中のページを視覚的に分かりやすく表示
- タイトル・ステータス・優先度・ラベルによる複合検索を実装
- ページネーションを導入し、大量データでも見やすく表示
- ステータス・優先度・ラベルを色付きバッジで表示し、視認性を向上
- Enterキーでもログインできるようにし、操作性を改善
- My Issues を追加し、ログインユーザーが担当する課題へ素早くアクセスできるように改善

---

## セットアップ

```bash
git clone <repository-url>

cd issue-tracker-front

npm install

npm run dev
```

フロントエンド

```
http://localhost:5173
```

---

## 今後の改善予定

- レスポンシブデザインへの対応
- 権限に応じた画面制御
- UI/UXの改善
- 共通コンポーネントの整理
- AIを活用した課題タイトル提案・要約機能