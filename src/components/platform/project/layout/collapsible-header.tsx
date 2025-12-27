"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Params {
  id: string;
}

const CollapsibleHeader = ({ params }: { params: Params | Promise<Params> }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const id = unwrappedParams.id;
  const pathname = usePathname();

  const links = [
    { href: `/project/${id}`, label: "Detail" },
    { href: `/project/${id}/itp`, label: "ITP" },
    { href: `/project/${id}/mos`, label: "MOS" },
    { href: `/project/${id}/plan`, label: "Plan" },
    { href: `/project/${id}/report`, label: "Report" },
    { href: `/project/${id}/doc`, label: "Docs" },
    { href: `/project/${id}/quote`, label: "Quote" },
  ];

  // Find the active link
  const activeLink = links.find(link => 
    link.label === "Detail" 
      ? pathname === link.href 
      : pathname.startsWith(link.href)
  ) || links[0];

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="w-full border-b border-border/40 bg-background/95">
      <div className="container max-w-screen-2xl">
        {/* Collapsed view - only shows current section */}
        <div className="flex items-center py-2 justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Project Section:</span>
            <span className="text-foreground/90">{activeLink.label}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpanded}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-1 text-xs">{isExpanded ? "Collapse" : "Expand"} Navigation</span>
          </Button>
        </div>

        {/* Expanded view - shows all project navigation */}
        {isExpanded && (
          <div className="py-3 border-t border-border/20 animate-in slide-in-from-top duration-300">
            <nav>
              <ul className="flex space-x-8">
                {links.map((link) => (
                  <li
                    key={link.href}
                    className={
                      (
                        link.label === "Detail"
                          ? pathname === link.href
                          : pathname.startsWith(link.href)
                      )
                        ? "font-medium"
                        : "text-foreground/60 hover:text-foreground/80 transition-colors"
                    }
                  >
                    <Link href={link.href} className="text-base">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleHeader; 