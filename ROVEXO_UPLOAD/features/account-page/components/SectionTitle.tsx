type SectionTitleProps = {
  children: string;
  id?: string;
};

export function SectionTitle({ children, id }: SectionTitleProps) {
  return (
    <h2 id={id} className="account-section-title">
      {children}
    </h2>
  );
}
