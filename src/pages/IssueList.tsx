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

function IssueList() {
  const navigate = useNavigate();

  // 現在表示している課題一覧
  const [issues, setIssues] = useState<Issue[]>([]);
  // 現在のページ番号
  const [currentPage, setCurrentPage] = useState(1);
  // 最終ページ
  const [lastPage, setLastPage] = useState(1);

  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  // 選択中のステータス
  const [statusFilter, setStatusFilter] = useState("all");
  // 検索に使うステータス
  const [searchStatus, setSearchStatus] = useState("all");

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchPriority, setSearchPriority] = useState("all");

  // ラベル一覧
  const [labels, setLabels] = useState<Label[]>([]);
  // 選択中のラベル
  const [labelFilter, setLabelFilter] = useState("all");
  // 検索に使うラベル
  const [searchLabel, setSearchLabel] = useState("all");

    // 初回表示時にラベル一覧を取得
  useEffect(() => {
    fetch("http://localhost/api/labels")
      .then((res) => res.json())
      .then((data) => setLabels(data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    // 現在のページ番号
    params.append("page", currentPage.toString());

    // ステータスを指定している場合だけ検索条件に追加
    if (searchStatus !== "all") {
      params.append("status", searchStatus);
    }

    // 検索ボタンで確定したキーワードだけ送る
    if (searchKeyword.trim() !== "") {
      params.append("keyword", searchKeyword);
    }

    // 優先度
    if (searchPriority !== "all") {
      params.append("priority", searchPriority);
    }

    // ラベルを指定している場合だけ検索条件に追加
    if (searchLabel !== "all") {
      params.append("label_id", searchLabel);
    }
    const queryString = params.toString();

    // 検索条件が無ければ一覧取得、あればクエリ付きで取得
    const url =
      queryString === ""
        ? "http://localhost/api/issues"
        : `http://localhost/api/issues?${queryString}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setIssues(data.data);
        setCurrentPage(data.current_page);
        setLastPage(data.last_page);
      });

  // 検索条件が変わったら再取得
  }, [searchKeyword, searchStatus, searchPriority, searchLabel, currentPage]);

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
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        {/* 検索エリア */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
            alignItems: "end",
          }}
        >
          <div>
            <label style={{ marginRight: "8px" }}>タイトル:</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}

              // Enterキーで検索
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchKeyword(keyword);
                }
              }}

              placeholder="タイトルで検索"
              style={{ padding: "6px" }}
            />
          </div>

          <div>
            <label style={{ marginRight: "8px" }}>ステータス:</label>
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
          <div>
            <label style={{ marginRight: "8px" }}>優先度:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: "6px" }}
            >
              <option value="all">すべて</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
          <div>
            <label style={{ marginRight: "8px" }}>ラベル:</label>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              style={{ padding: "6px" }}
            >
              <option value="all">すべて</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "end" }}>
            <button
            onClick={() => {
              setSearchKeyword(keyword);
              setSearchStatus(statusFilter);
              setSearchPriority(priorityFilter);
              setSearchLabel(labelFilter);
              setCurrentPage(1);
            }}
              style={{ padding: "6px 12px", whiteSpace: "nowrap" }}
            >
              検索
            </button>

            <button
              onClick={() => {
                setKeyword("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setLabelFilter("all");

                setSearchKeyword("");
                setSearchStatus("all");
                setSearchPriority("all");
                setSearchLabel("all");
                setCurrentPage(1);
              }}
              style={{ padding: "6px 12px", whiteSpace: "nowrap" }}
            >
              クリア
            </button>
          </div>
        </div>
      </div>      
      {/* 取得した課題を1件ずつカードとして表示 */}
      {issues.length === 0 ? (
        <p>該当する課題はありません。</p>
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
        ))
      )}
      {/* ページネーション */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          前へ
        </button>

        <span>
          {currentPage} / {lastPage}
        </span>

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          次へ
        </button>
      </div>
    </div>
  );
}

export default IssueList;