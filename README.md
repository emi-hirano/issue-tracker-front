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

## スクリーンショット

### 課題一覧
<img width="1440" height="820" alt="スクリーンショット 2026-07-17 9 05 03" src="https://github.com/user-attachments/assets/207cb794-ce6a-4c9e-840f-126d4155c26c" />


### 課題詳細
<img width="2910" height="1846" alt="FireShot Capture 014 - 課題管理システム -  localhost" src="https://github.com/user-attachments/assets/cbfac930-4c4f-4315-9ad5-32af9d1bd369" />


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

- 共通ヘッダーをコンポーネント化し、各画面で再利用した
- ステータス・優先度・ラベルを色付きバッジで表示し、視認性を向上させた

---

## セットアップ

このフロントエンドは、バックエンドAPIが `http://localhost` で起動していることを前提としています。
先に [Backend Repository](https://github.com/emi-hirano/issue-tracker-api) のセットアップを済ませてください。

```bash
git clone <repository-url>

cd issue-tracker-front

npm install

npm run dev
```

ブラウザで以下にアクセスします。

http://localhost:5173

> APIの接続先は `src/utils/api.ts` の `API_BASE` で定義しています。

---

## テストアカウント

ログインして動作を確認できます。

| 項目 | 値 |
|------|------|
| Email | `test@example.com` |
| Password | `password123` |
