import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
type Label = { id: number; name: string; color: string };

// プルダウン用の型
type Project = { id: number; name: string };
type User = { id: number; name: string };

function EditIssue() {
  // URLの :id を受け取る（どの課題を編集するか）
  const { id } = useParams();
  const navigate = useNavigate();

  // プルダウンの選択肢データ
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  
  // フォームの入力値（最初は空。既存データ読み込み後に埋める）
  const [projectId, setProjectId] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");

  // 画面表示時：プルダウン用データ＋編集対象の既存データを取得
  useEffect(() => {
    // プルダウン用（新規登録と同じ）
    fetch("http://localhost/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data));

    fetch("http://localhost/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));

    // 編集対象の課題を取得して、各入力欄に初期値としてセット
    fetch(`http://localhost/api/issues/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // idは数値なので、input用に文字列へ変換して入れる
        setProjectId(String(data.project_id));
        setReporterId(String(data.reporter_id));
        setTitle(data.title);
        setDescription(data.description ?? "");
        setStatus(data.status);
        setPriority(data.priority);
        // 今付いているラベルのidだけを取り出して、チェック済みにする
        setLabelIds(data.labels.map((label: Label) => label.id));
      });

      fetch("http://localhost/api/labels")
      .then((res) => res.json())
      .then((data) => setLabels(data));
  }, [id]);

  // 「更新する」ボタンの処理
  const handleSubmit = () => {
    setError("");
    const token = localStorage.getItem("token");

    fetch(`http://localhost/api/issues/${id}`, {
      method: "PUT", // 更新なのでPUT
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_id: Number(projectId),
        reporter_id: Number(reporterId),
        title: title,
        description: description,
        status: status,
        priority: priority,
        label_ids: labelIds,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("更新に失敗しました（入力内容を確認してください）");
        }
        return res.json();
      })
      .then(() => {
        // 更新後は詳細ページに戻る
        navigate(`/issues/${id}`);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
      <h1>課題の編集</h1>

      <button onClick={() => navigate(`/issues/${id}`)} style={{ marginBottom: "16px" }}>
        戻る
      </button>
      
      {/* プロジェクト */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>プロジェクト</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">選択してください</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* 報告者 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>報告者</label>
        <select
          value={reporterId}
          onChange={(e) => setReporterId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">選択してください</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* タイトル */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>タイトル</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>

      {/* 説明 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>説明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "80px" }}
        />
      </div>

      {/* ステータス */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>ステータス</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
      </div>

      {/* 優先度 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>優先度</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </div>

      {/* ラベル選択（複数選択可・既存ラベルは初期チェック済み） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>ラベル</label>
        {labels.map((label) => (
          <label
            key={label.id}
            style={{ display: "inline-flex", alignItems: "center", marginRight: "12px", marginBottom: "4px" }}
          >
            <input
              type="checkbox"
              checked={labelIds.includes(label.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setLabelIds([...labelIds, label.id]);
                } else {
                  setLabelIds(labelIds.filter((id) => id !== label.id));
                }
              }}
              style={{ marginRight: "4px" }}
            />
            {label.name}
          </label>
        ))}
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button onClick={handleSubmit} style={{ padding: "8px 16px" }}>
        更新する
      </button>
    </div>
  );
}

export default EditIssue;