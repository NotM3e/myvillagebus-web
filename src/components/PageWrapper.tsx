export default function PageWrapper({ 
  children,
  className = "",
  maxWidth = "max-w-6xl"
}: { 
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div className={`min-h-screen p-6 md:p-8 ${className}`}>
      <div className={`${maxWidth} mx-auto`}>
        {children}
      </div>
    </div>
  );
}