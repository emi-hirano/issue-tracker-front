import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import Loading from "../components/Loading";

// プルダウンに出すプロジェクトの形（idと名前だけあればいい）
type Project = {
  id: number;
  name: string;
};

// プルダウンに出すユーザーの形（idと名前だけ。emailは受け取らない）
type User = {
  id: number;
  name: string;
};

type Label = { id: number; name: string; color: string };

function NewIssue() {
  // プルダウンの選択肢データ（APIから取得して入れる箱）
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [labels, setLabels] = useState<Label[]>([]);        // ラベル一覧（選択肢）
  const [labelIds, setLabelIds] = useState<number[]>([]);   // 選択されたラベルidの配列

  // フォームの入力値を覚えておく箱（入力するたびに更新される）
  const [projectId, setProjectId] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");     // 初期値open
  const [priority, setPriority] = useState("medium"); // 初期値medium
  const [error, setError] = useState("");             // エラーメッセージ用

  const navigate = useNavigate(); // 登録成功後に一覧へ移動するための道具

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      apiFetch("/projects"),
      apiFetch("/users"),
      apiFetch("/labels"),
    ])
      .then(([projectsData, usersData, labelsData]) => {
        setProjects(projectsData);
        setUsers(usersData);
        setLabels(labelsData);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 「登録する」ボタンを押したときの処理
  const handleSubmit = () => {
    setError("");
    setSubmitting(true);

    apiFetch("/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: Number(projectId),
        reporter_id: Number(reporterId),
        assignee_id: assigneeId ? Number(assigneeId) : null,
        title,
        description,
        status,
        priority,
        label_ids: labelIds,
      }),
    })
      .then(() => {
        navigate("/");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (loading) {
    return <Loading />;
  }

  if (submitting) {
    return <Loading />;
  }
  
  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
      <h1>課題の新規登録</h1>
      <button onClick={() => navigate("/")} style={{ marginBottom: "16px" }}>
        一覧に戻る
      </button>

      {/* プロジェクト選択（取得したprojectsをoptionに展開） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>プロジェクト</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">選択してください</option>
          {projects.map((project) => (
            // valueにidを入れて送信用に、表示は名前
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* 報告者選択（取得したusersをoptionに展開） */}
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
      {/* 担当者 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>担当者</label>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">未割り当て</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      {/* タイトル（必須・255文字まで） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>タイトル</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>

      {/* 説明（任意・複数行なのでtextarea） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>説明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "80px" }}
        />
      </div>

      {/* ステータス（バックのin:ルールに合わせた固定の選択肢） */}
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

      {/* 優先度（バックのin:ルールに合わせた固定の選択肢） */}
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

      {/* ラベル選択（複数選択可） */}
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
                  // チェックされたら配列に追加
                  setLabelIds([...labelIds, label.id]);
                } else {
                  // 外されたら配列から除去
                  setLabelIds(labelIds.filter((id) => id !== label.id));
                }
              }}
              style={{ marginRight: "4px" }}
            />
            {label.name}
          </label>
        ))}
      </div>

      {/* エラーがあるときだけ赤字で表示 */}
      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button onClick={handleSubmit} style={{ padding: "8px 16px" }}>
        登録する
      </button>
    </div>
  );
}

export default NewIssue;