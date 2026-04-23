import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
        style={{ background: "#f0eee6" }}
      >
        {icon ?? <FileQuestion className="w-5 h-5" style={{ color: "#b0aea5" }} strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "#141413" }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mb-4" style={{ color: "#87867f" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
