export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "status-draft",
    pending: "status-pending",
    picking: "status-picking",
    packing: "status-packing",
    completed: "status-completed",
    cancelled: "status-cancelled",
  };
  return <span className={map[status] || "status-draft"}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
