import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function MyIssues() {
  const [message, setMessage] = useState("読み込み中...");
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(() => {
      console.log(localStorage.getItem("token"));
      fetch("http://localhost/api/my-issues", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        console.log("レスポンス", res);

        if (!res.ok) {
          throw new Error(`APIエラー: ${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        console.log(data);

        // 確認用APIでは data.issues に一覧が入っている
        setIssues(data.data);

        setMessage("自分にアサインされた課題を表示しています");
      })
      .catch((error) => {
        console.error(error);
        setMessage("取得に失敗しました");
      });
  }, []);

return (
    <div
    style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "64px 16px 16px",
    }}
  >
    <h1>自分の課題</h1>
    <p>{message}</p>

  {issues.length === 0 ? (
    <p>自分にアサインされた課題はありません。</p>
  ) : (
    issues.map((issue) => (
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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

        <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
          報告者: {issue.reporter?.name ?? "未割り当て"}・ 起票: {formatDate(issue.created_at)}
        </div>

        <div>
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
      </div>
    ))
  )}
  </div>
);
}

export default MyIssues;