// ラベルの文字色を背景の明るさで切り替える（6桁hex前提）
export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// UTCの日時文字列を「2026/7/7 10:15」形式（日本時間）に変換
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ステータスに応じた色（背景・文字）を返す
export function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "open":
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case "in_progress":
      return { bg: "#FEF3C7", text: "#92400E" };
    case "resolved":
      return { bg: "#D1FAE5", text: "#065F46" };
    case "closed":
      return { bg: "#E5E7EB", text: "#374151" };
    default:
      return { bg: "#E5E7EB", text: "#374151" };
  }
}

// 優先度に応じた色（背景・文字）を返す
export function priorityColor(priority: string): { bg: string; text: string } {
  switch (priority) {
    case "high":
      return { bg: "#FEE2E2", text: "#B91C1C" };
    case "medium":
      return { bg: "#FEF3C7", text: "#92400E" };
    case "low":
      return { bg: "#F3F4F6", text: "#6B7280" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280" };
  }
}