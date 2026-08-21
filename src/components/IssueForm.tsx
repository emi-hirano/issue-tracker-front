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

type IssueFormProps = {
  projects: Project[];
  users: User[];
  labels: Label[];
  projectId: string;
  onProjectIdChange: (value: string) => void;
  assigneeId: string;
  onAssigneeIdChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  labelIds: number[];
  onLabelIdsChange: (value: number[]) => void;
};

// NewIssue/EditIssue共通のフォーム入力欄
// （プロジェクト・担当者・タイトル・説明・ステータス・優先度・ラベル選択）
function IssueForm({
  projects,
  users,
  labels,
  projectId,
  onProjectIdChange,
  assigneeId,
  onAssigneeIdChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  labelIds,
  onLabelIdsChange,
}: IssueFormProps) {
  return (
    <>
      {/* プロジェクト選択（取得したprojectsをoptionに展開） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>プロジェクト</label>
        <select
          value={projectId}
          onChange={(e) => onProjectIdChange(e.target.value)}
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

      {/* 担当者 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>担当者</label>
        <select
          value={assigneeId}
          onChange={(e) => onAssigneeIdChange(e.target.value)}
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
          onChange={(e) => onTitleChange(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>

      {/* 説明（任意・複数行なのでtextarea） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>説明</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "80px" }}
        />
      </div>

      {/* ステータス（バックのin:ルールに合わせた固定の選択肢） */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>ステータス</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
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
          onChange={(e) => onPriorityChange(e.target.value)}
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
                  onLabelIdsChange([...labelIds, label.id]);
                } else {
                  // 外されたら配列から除去
                  onLabelIdsChange(labelIds.filter((id) => id !== label.id));
                }
              }}
              style={{ marginRight: "4px" }}
            />
            {label.name}
          </label>
        ))}
      </div>
    </>
  );
}

export default IssueForm;
