import { NavLink, Link, useNavigate } from "react-router-dom";
// import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2 style={{ margin: 0 }}>
      <Link
        to="/"
        style={{
          textDecoration: "none",
          color: "inherit",
        }}
      >
        Issue Tracker
      </Link>
    </h2>

      <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          textDecoration: "none",
          color: isActive ? "#1976d2" : "#551A8B",
          fontWeight: isActive ? "bold" : "normal",
        })}
      >
        課題一覧
      </NavLink>

      <NavLink
        to="/my"
        style={({ isActive }) => ({
          textDecoration: "none",
          color: isActive ? "#1976d2" : "#551A8B",
          fontWeight: isActive ? "bold" : "normal",
        })}
      >
        My Issues
      </NavLink>

      <NavLink
        to="/issues/new"
        style={({ isActive }) => ({
          textDecoration: "none",
          color: isActive ? "#1976d2" : "#551A8B",
          fontWeight: isActive ? "bold" : "normal",
        })}
      >
        新規登録
      </NavLink>

        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "#551A8B",
            cursor: "pointer",
            padding: 0,
            fontSize: "inherit",
          }}
        >
          ログアウト
        </button>
      </nav>
    </header>
  );
}