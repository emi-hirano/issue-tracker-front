function Loading() {
  return (
    <div
      style={{
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <div className="spinner" />
      <div>読み込み中...</div>
    </div>
  );
}

export default Loading;