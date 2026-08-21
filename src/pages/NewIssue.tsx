import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import Loading from "../components/Loading";
import IssueForm from "../components/IssueForm";

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
      .catch(() => {
        setError("データの取得に失敗しました");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 「登録する」ボタンを押したときの処理
  const handleSubmit = () => {
    setError("");

    if (!projectId || title.trim() === "") {
      setError("プロジェクトとタイトルは必須です");
      return;
    }

    setSubmitting(true);

    apiFetch("/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: Number(projectId),
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

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
      <h1>課題の新規登録</h1>
      <button onClick={() => navigate("/")} style={{ marginBottom: "16px" }}>
        一覧に戻る
      </button>

      <IssueForm
        projects={projects}
        users={users}
        labels={labels}
        projectId={projectId}
        onProjectIdChange={setProjectId}
        assigneeId={assigneeId}
        onAssigneeIdChange={setAssigneeId}
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        labelIds={labelIds}
        onLabelIdsChange={setLabelIds}
      />

      {/* エラーがあるときだけ赤字で表示 */}
      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: "8px 16px" }}>
        登録する
      </button>
    </div>
  );
}

export default NewIssue;