import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  // 入力値を覚えておく箱
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // エラーメッセージ用

  const navigate = useNavigate(); // ログイン成功後に一覧へ移動するための道具

  // 「ログイン」ボタンを押したときの処理
  const handleLogin = () => {
    setError(""); // 前回のエラー表示をクリア

    fetch("http://localhost/api/login", {
      method: "POST", // ログインは情報を送るのでPOST
      headers: {
        "Content-Type": "application/json", // JSON形式で送る
        Accept: "application/json",         // JSON形式で返してもらう
      },
      body: JSON.stringify({ email, password }), // email/passwordを送信
    })
      .then((res) => {
        // 認証失敗（401など）ならエラーを投げてcatchへ
        if (!res.ok) {
          throw new Error("ログインに失敗しました");
        }
        return res.json();
      })
      .then((data) => {
        // 成功：返ってきたトークンをブラウザに保存（以降のリクエストで使う）
        localStorage.setItem("token", data.token);
        navigate("/"); // 一覧ページへ移動
      })
      .catch((err) => {
        setError(err.message); // 失敗したらエラーメッセージを表示
      });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
      style={{ maxWidth: "400px", margin: "0 auto", padding: "16px" }}
    >
      <h1>ログイン</h1>

      {/* メールアドレス入力 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>

      {/* パスワード入力 */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button type="submit" style={{ padding: "8px 16px" }}>
        ログイン
      </button>
    </form>
  );
}

export default Login;