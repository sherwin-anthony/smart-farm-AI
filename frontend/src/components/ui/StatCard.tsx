type StatCardProps = {
  label: string;
  value: string | number;
};

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "0.75rem", padding: "1rem" }}>
      <p style={{ margin: 0, color: "#666" }}>{label}</p>
      <strong style={{ fontSize: "1.5rem" }}>{value}</strong>
    </div>
  );
}
