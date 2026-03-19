type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header style={{ marginBottom: "1rem" }}>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  );
}
