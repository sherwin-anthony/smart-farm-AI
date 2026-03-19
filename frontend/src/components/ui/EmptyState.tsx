type EmptyStateProps = {
  title: string;
  description?: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div style={{ padding: "1rem", border: "1px dashed #ccc", borderRadius: "0.75rem" }}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
