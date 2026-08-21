import { isLightColor, formatDate, statusColor, priorityColor } from "../utils/format";

type Label = {
  id: number;
  name: string;
  color: string;
};

type Issue = {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  reporter?: {
    name: string;
  };
  labels: Label[];
};

type IssueCardProps = {
  issue: Issue;
  onClick: () => void;
};

// IssueList/MyIssues共通の課題カード
function IssueCard({ issue, onClick }: IssueCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "12px",
        cursor: "pointer",

        // Closedは視覚的に弱くする
        opacity: issue.status === "closed" ? 0.5 : 1,
        backgroundColor: issue.status === "closed" ? "#f5f5f5" : "#fff",
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
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            textDecoration: issue.status === "closed" ? "line-through" : "none",
          }}
        >
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
  );
}

export default IssueCard;
