import { BrowserRouter, Routes, Route } from "react-router-dom";
import IssueList from "./pages/IssueList";
import Login from "./pages/Login";
import NewIssue from "./pages/NewIssue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IssueList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/issues/new" element={<NewIssue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;