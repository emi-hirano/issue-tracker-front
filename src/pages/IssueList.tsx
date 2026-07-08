import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 課題1件の形（APIから返るJSONの構造に合わせて定義）
type Issue = {
  id: number;
  title: string;
  status: string;
  priority: string;
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

function IssueList() {
  // 課題一覧を入れておく箱（最初は空配列）
  const [issues, setIssues] = useState<Issue[]>([]);
  const navigate = useNavigate();

  // 画面表示時に一度だけ、課題一覧APIを叩いて取得する
  useEffect(() => {
    fetch("http://localhost/api/issues")
      .then((res) => res.json())
      .then((data) => setIssues(data));
  }, []); // []なので初回のみ実行

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
      <h1>課題一覧</h1>

      {/* 取得した課題を1件ずつカードとして表示 */}
      {issues.map((issue) => (
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
            <div style={{ fontSize: "14px", color: "#555" }}>
              {issue.status} / {issue.priority}
            </div>
          </div>

          {/* 報告者。nullの場合は「未割り当て」と表示 */}
          <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
            報告者: {issue.reporter?.name ?? "未割り当て"}
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