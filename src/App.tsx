import { BrowserRouter, Routes, Route } from "react-router-dom";
import IssueList from "./pages/IssueList";
import Login from "./pages/Login";
import NewIssue from "./pages/NewIssue";
import IssueDetail from "./pages/IssueDetail";
import EditIssue from "./pages/EditIssue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IssueList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/issues/new" element={<NewIssue />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/issues/:id/edit" element={<EditIssue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;