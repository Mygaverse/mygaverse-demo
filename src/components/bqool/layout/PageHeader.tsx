interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // This is where the filters go
}

export const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      
      {/* This area renders whatever buttons/filters specific to the page */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {children}
      </div>
    </div>
  );
};