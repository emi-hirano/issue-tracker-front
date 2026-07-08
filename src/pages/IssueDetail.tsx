import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// 課題詳細の形（showが返すリレーション込みの構造）
type Issue = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  reporter: { id: number; name: string } | null;
  assignee: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  labels: { id: number; name: string; color: string }[];
  comments: {
    id: number;
    body: string;
    user: { id: number; name: string } | null;
  }[];
};

// ラベルの文字色を背景の明るさで切り替える（一覧と同じ関数）
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

function IssueDetail() {
  // URLの :id 部分を受け取る（例: /issues/1 なら id = "1"）
  const { id } = useParams();
  const navigate = useNavigate();

  // 課題1件を入れる箱（最初はまだ無いのでnull）
  const [issue, setIssue] = useState<Issue | null>(null);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`http://localhost/api/issues/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("見つかりません");
        }
        return res.json();
      })
      .then((data) => setIssue(data))
      .catch(() => setNotFound(true)); // 失敗したら「見つからない」状態にする
  }, [id]);

    // 「削除する」ボタンの処理
    const handleDelete = () => {
    // 誤操作防止：確認ダイアログを出す
    if (!window.confirm("この課題を削除しますか？")) {
      return; // キャンセルされたら何もしない
    }

    const token = localStorage.getItem("token");

    fetch(`http://localhost/api/issues/${id}`, {
      method: "DELETE", // 削除なのでDELETE
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // トークンで認証
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("削除に失敗しました");
        }
        // 削除成功したら一覧へ戻る
        navigate("/");
      })
      .catch((err) => {
        alert(err.message); // 失敗したらメッセージ表示
      });
  };
    
  // 存在しない課題のとき
  if (notFound) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 16px" }}>
        <button onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1>課題が見つかりません</h1>
        <p>指定された課題は存在しないか、削除された可能性があります。</p>
      </div>
    );
  }

  // まだ読み込み中のとき
  if (!issue) {
    return <div style={{ padding: "16px" }}>読み込み中...</div>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "64px 16px 16px" }}>

      {/* 操作ボタンを上部に横並び */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={() => navigate("/")}>一覧に戻る</button>
        <button onClick={() => navigate(`/issues/${issue.id}/edit`)}>編集する</button>
        <button onClick={handleDelete} style={{ color: "red" }}>削除する</button>
      </div>

      {/* タイトルは単独で1行使う（長くても折り返せる） */}
      <h1>{issue.title}</h1>

      {/* 基本情報 */}
      <p>ステータス: {issue.status} / 優先度: {issue.priority}</p>
      <p>プロジェクト: {issue.project?.name ?? "未設定"}</p>
      <p>報告者: {issue.reporter?.name ?? "未割り当て"}</p>
      <p>担当者: {issue.assignee?.name ?? "未割り当て"}</p>

      {/* ラベル */}
      <div style={{ marginBottom: "16px" }}>
        {issue.labels.map((label) => (
          <span
            key={label.id}
            style={{
              backgroundColor: label.color,
              color: isLightColor(label.color) ? "#000" : "#fff",
              padding: "2px 8px",
              borderRadius: "4px",
              marginRight: "4px",
              fontSize: "12px",
            }}
          >
            {label.name}
          </span>
        ))}
      </div>

      {/* 説明 */}
      <h2>説明</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {issue.description ?? "（説明なし）"}
      </p>

      {/* コメント一覧 */}
      <h2>コメント（{issue.comments.length}件）</h2>
      {issue.comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            border: "1px solid #eee",
            borderRadius: "6px",
            padding: "8px 12px",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {comment.user?.name ?? "不明"}
          </div>
          <div>{comment.body}</div>
        </div>
      ))}
    </div>
  );
}

export default IssueDetail;