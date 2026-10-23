import type { ReactNode } from "react";

export function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <p className="cinema-label">
      <span>{number}</span>
      <span className="cinema-label-rule" />
      {children}
    </p>
  );
}
