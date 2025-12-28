'use client';
import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ProjectProvider } from "@/provider/project";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const tabs = [
  { label: 'Overview', path: '' },
  { label: 'Docs', path: '/docs' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'ACD', path: '/acd' },
  { label: 'Containers', path: '/containers' },
  { label: 'Duty', path: '/duty' },
];

const Layout: React.FC<LayoutProps> = ({ children, params }) => {
  const pathname = usePathname();
  const { id, lang } = useParams();
  const basePath = `/${lang}/project/${id}`;

  const isActive = (tabPath: string) => {
    if (tabPath === '') {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname.startsWith(`${basePath}${tabPath}`);
  };

  return (
    <ProjectProvider>
      <div>
        <nav className="border-b px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                href={`${basePath}${tab.path}`}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive(tab.path)
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
        <main>
          {children}
        </main>
      </div>
    </ProjectProvider>
  );
};

export default Layout;
