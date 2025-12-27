"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface Params {
  id: string;
}

const Header = ({ params }: { params: Params | Promise<Params> }) => {
  // Properly unwrap params using React.use() for Next.js 15
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

  return (
    <div className="sticky top-14 z-40 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container max-w-screen-2xl py-2">
        <nav className="flex justify-between">
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
    </div>
  );
};

export default Header;