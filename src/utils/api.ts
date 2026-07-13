// APIのベースURL
const API_BASE = "http://localhost/api";

/**
 * 認証トークン付きでAPIを呼び出す共通関数。
 * トークンの付け忘れを防ぐため、fetchを直接呼ばずここを通す。
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`, // トークンで認証
      ...options.headers, // 呼び出し側の指定を優先（Content-Type など）
    },
  });

  if (!res.ok) {
    throw new Error(`APIエラー: ${res.status}`);
  }

  return res.json();
}