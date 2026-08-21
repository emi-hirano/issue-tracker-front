import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import Loading from "../components/Loading";
import IssueForm from "../components/IssueForm";

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
  const [assigneeId, setAssigneeId] = useState("");

  // フォームの入力値（最初は空。既存データ読み込み後に埋める）
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [originalStatus, setOriginalStatus] = useState("");
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // スピナー
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 画面表示時：プルダウン用データ＋編集対象の既存データを取得
  useEffect(() => {
    setLoading(true);

    Promise.all([
      apiFetch("/projects"),
      apiFetch("/users"),
      apiFetch("/labels"),
      apiFetch(`/issues/${id}`),
    ])
      .then(([projectsData, usersData, labelsData, issueData]) => {
        // プルダウン用
        setProjects(projectsData);
        setUsers(usersData);
        setLabels(labelsData);

        // 編集対象の課題
        setProjectId(String(issueData.project_id));
        setAssigneeId(
          issueData.assignee ? String(issueData.assignee.id) : ""
        );
        setTitle(issueData.title);
        setDescription(issueData.description ?? "");
        setStatus(issueData.status);
        setOriginalStatus(issueData.status);
        setPriority(issueData.priority);
        setLabelIds(
          issueData.labels.map((label: Label) => label.id)
        );
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // 「更新する」ボタンの処理
  const handleSubmit = () => {
    setError("");

    if (!projectId || title.trim() === "") {
      setError("プロジェクトとタイトルは必須です");
      return;
    }

    if (originalStatus !== "closed" && status === "closed") {
      const confirmed = window.confirm("この課題をCloseしますか？");

    if (!confirmed) {
      return;
    }
  }

  setSubmitting(true);

  apiFetch(`/issues/${id}`, {
    method: "PUT",
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
      navigate(`/issues/${id}`);
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

  if (notFound) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
        <button onClick={() => navigate("/")}>一覧に戻る</button>
        <h1>課題が見つかりません</h1>
        <p>指定された課題は存在しないか、削除された可能性があります。</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
      <h1>課題の編集</h1>

      <button onClick={() => navigate(`/issues/${id}`)} style={{ marginBottom: "16px" }}>
        戻る
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

      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: "8px 16px" }}>
        更新する
      </button>
    </div>
  );
}

export default EditIssue;