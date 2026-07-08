import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 課題1件の形（APIから返るJSONの構造に合わせて定義）
type Issue = {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  // 報告者。DBはNOT NULLだが、念のためnull許容で防御
  reporter: {
    id: number;
    name: string;
  } | null;
  // ラベルは複数付くので配列
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
};

// 背景色が明るいか暗いかを判定する（ラベルの文字色を黒/白で切り替えるため）
// 6桁のカラーコード（#rrggbb）を前提とする
function isLightColor(hex: string): boolean {
  // #を飛ばして、赤・緑・青を16進数→数値に変換
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // 人間の目の感度に合わせた重み付けで明るさを算出
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // 128（中間）より明るければ true
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

function IssueList() {
  // 課題一覧を入れておく箱（最初は空配列）
  const [issues, setIssues] = useState<Issue[]>([]);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // "all"なら条件なし、それ以外は ?status=xxx を付ける
    const url =
      statusFilter === "all"
        ? "http://localhost/api/issues"
        : `http://localhost/api/issues?status=${statusFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setIssues(data));
  }, [statusFilter]); // statusFilterが変わったら再取得

  // statusFilterに応じて表示する課題を絞る
  const filteredIssues =
    statusFilter === "all"
      ? issues // "all"なら全部
      : issues.filter((issue) => issue.status === statusFilter); // それ以外は一致するものだけ

  return (
    // <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 16px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ margin: 0 }}>課題一覧</h1>
        <button onClick={() => navigate("/issues/new")}>
          新規登録
        </button>
      </div>

      {/* ステータス絞り込み */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ marginRight: "8px" }}>ステータスで絞り込み:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "6px" }}
        >
          <option value="all">すべて</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
      </div>

      {/* 取得した課題を1件ずつカードとして表示 */}
      {filteredIssues.map((issue) => (
        <div
          key={issue.id}
          onClick={() => navigate(`/issues/${issue.id}`)}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "12px",
            cursor: "pointer",
          }}
        >
          {/* 1行目：タイトル（左）とステータス/優先度（右）を両端に配置 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between", // 左右の端に寄せる
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>
              {issue.title}
            </div>
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
          </div>

          {/* 報告者。nullの場合は「未割り当て」と表示 */}
          <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
            報告者: {issue.reporter?.name ?? "未割り当て"}・ 起票: {formatDate(issue.created_at)}
          </div>

          {/* ラベルを色付きバッジで並べる */}
          <div>
            {issue.labels.map((label) => (
              <span
                key={label.id}
                style={{
                  backgroundColor: label.color,
                  // 背景の明るさに応じて文字色を黒/白で切り替え（可読性確保）
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
        </div>
      ))}
    </div>
  );
}

export default IssueList;