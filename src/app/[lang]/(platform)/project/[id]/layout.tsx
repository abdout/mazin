'use client';
import React from "react";
import { ProjectProvider } from "@/provider/project";

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const Layout: React.FC<LayoutProps> = ({ children, params }) => {
  return (
    <ProjectProvider>
      <div>
        <main>
          {children}
        </main>
      </div>
    </ProjectProvider>
  );
};

export default Layout;
