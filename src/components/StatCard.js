const COLORS = {
  yellow: "bg-card-yellow",
  pink: "bg-card-pink",
  purple: "bg-card-purple",
};

export default function StatCard({ icon, label, value, sub, color = "yellow" }) {
  return (
    <div className={`rounded-2xl p-6 ${COLORS[color]}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-full bg-white/60 flex items-center justify-center text-sm">
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="text-3xl font-semibold mb-1">{value}</div>
      {sub && <p className="text-xs text-black/60">{sub}</p>}
    </div>
  );
}
