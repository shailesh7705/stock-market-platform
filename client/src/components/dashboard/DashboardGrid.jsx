function DashboardGrid({ children }) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
      {children}
    </div>
  );
}

export default DashboardGrid;