interface PlaceholderPageProps {
  title: string;
  phase: string;
}

export function PlaceholderPage({ title, phase }: PlaceholderPageProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-1">
          Cette section sera développée en {phase}.
        </p>
      </div>
    </div>
  );
}
