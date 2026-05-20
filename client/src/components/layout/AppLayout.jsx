import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

function AppLayout({ children }) {

  return (

    <div className="flex h-screen bg-[#081121] text-white overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        id="dashboard-container"
        className="flex-1 overflow-y-auto"
      >

        <TopNavbar />

        <main className="p-6">

          {children}

        </main>

      </div>

    </div>

  );

}

export default AppLayout;