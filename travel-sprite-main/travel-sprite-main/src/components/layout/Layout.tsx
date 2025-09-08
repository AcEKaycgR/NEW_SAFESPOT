import { DesktopNavigation, MobileNavigation } from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background font-body">
      <DesktopNavigation />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
};

export default Layout;