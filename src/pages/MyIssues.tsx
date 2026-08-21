import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import Loading from "../components/Loading";
import IssueCard from "../components/IssueCard";

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
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    useEffect(() => {
    apiFetch("/my-issues")
      .then((data) => {
        setIssues(data.data);
      })
      .catch(() => {
        setError("取得に失敗しました");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

if (loading) {
  return <Loading />;
}
return (
    <div
    style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "64px 16px 16px",
    }}
  >
    <h1>自分の課題</h1>
    {error && (
      <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
    )}

  {issues.length === 0 ? (
    <p>自分にアサインされた課題はありません。</p>
  ) : (
    issues.map((issue) => (
      <IssueCard
        key={issue.id}
        issue={issue}
        onClick={() => navigate(`/issues/${issue.id}`)}
      />
    ))
  )}
  </div>
);
}

export default MyIssues;