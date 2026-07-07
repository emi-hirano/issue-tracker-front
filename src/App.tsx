import { useEffect, useState } from "react";

type Issue = {
  id: number;
  title: string;
  status: string;
  priority: string;
  reporter: {
    id: number;
    name: string;
  } | null;
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
};

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

function App() {
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    fetch("http://localhost/api/issues")
      .then((res) => res.json())
      .then((data) => setIssues(data));
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
      <h1>課題一覧</h1>
      {issues.map((issue) => (
        <div
          key={issue.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "12px",
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
            <div style={{ fontSize: "14px", color: "#555" }}>
              {issue.status} / {issue.priority}
            </div>
          </div>

          <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
            報告者: {issue.reporter?.name ?? "未割り当て"}
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
      ))}
    </div>
  );
}

export default App;