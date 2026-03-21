export const StatusBadge = ({ status }: { status: 'active' | 'paused' | 'archived' }) => {
  const styles = {
    active: "bg-green-100 text-status-success border-green-200",
    paused: "bg-yellow-100 text-status-warning border-yellow-200",
    archived: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};