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
    created_at: string;
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

// ステータスに応じた色（背景・文字）を返す
function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "open":
      return { bg: "#DBEAFE", text: "#1E40AF" }; // 青系パステル
    case "in_progress":
      return { bg: "#FEF3C7", text: "#92400E" }; // オレンジ系パステル
    case "resolved":
      return { bg: "#D1FAE5", text: "#065F46" }; // 緑系パステル
    case "closed":
      return { bg: "#E5E7EB", text: "#374151" }; // グレー系パステル
    default:
      return { bg: "#E5E7EB", text: "#374151" };
  }
}

// 優先度に応じた色（背景・文字）を返す
function priorityColor(priority: string): { bg: string; text: string } {
  switch (priority) {
    case "high":
      return { bg: "#FEE2E2", text: "#B91C1C" }; // 赤系パステル（highは赤）
    case "medium":
      return { bg: "#FEF3C7", text: "#92400E" }; // オレンジ系パステル
    case "low":
      return { bg: "#F3F4F6", text: "#6B7280" }; // 薄グレー
    default:
      return { bg: "#F3F4F6", text: "#6B7280" };
  }
}

// UTCの日時文字列を「2026/7/7 10:15」形式（日本時間）に変換する
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IssueDetail() {
  // URLの :id 部分を受け取る（例: /issues/1 なら id = "1"）
  const { id } = useParams();
  const navigate = useNavigate();

  // 課題1件を入れる箱（最初はまだ無いのでnull）
  const [issue, setIssue] = useState<Issue | null>(null);

  const [notFound, setNotFound] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");

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

  // コメントを投稿する
  const handleCommentSubmit = () => {
    setCommentError("");
    const token = localStorage.getItem("token");

    fetch(`http://localhost/api/issues/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: commentBody }), // 本文だけ送る（投稿者はサーバーが決める）
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("コメントの投稿に失敗しました（ログインが必要です）");
        }
        return res.json();
      })
      .then((newComment) => {
        // 投稿成功：一覧に新しいコメントを追加して、入力欄を空にする
        setIssue({
          ...issue!,
          // comments: [...issue!.comments, newComment],
          comments: [newComment, ...issue!.comments],
        });
        setCommentBody("");
      })
      .catch((err) => {
        setCommentError(err.message);
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
      <div style={{ display: "flex", gap: "6px" }}>
      <span
        style={{
          backgroundColor: statusColor(issue.status).bg,
          color: statusColor(issue.status).text,
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        {issue.status}
      </span>
      <span
        style={{
          backgroundColor: priorityColor(issue.priority).bg,
          color: priorityColor(issue.priority).text,
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        {issue.priority}
      </span>
    </div>
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

      {/* コメント投稿フォーム */}
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="コメントを入力..."
          style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "60px" }}
        />
        {commentError && (
          <div style={{ color: "red", marginBottom: "8px" }}>{commentError}</div>
        )}
        <button onClick={handleCommentSubmit} style={{ marginTop: "8px" }}>
          コメントする
        </button>
      </div>
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
              <span style={{ fontWeight: "normal", fontSize: "12px", color: "#888", marginLeft: "8px" }}>
                {formatDate(comment.created_at)}
              </span>
          </div>
          <div>{comment.body}</div>
        </div>
        
      ))}
    </div>
  );
}

export default IssueDetail;