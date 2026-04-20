"use client";

import { useEffect, useState, createContext, useContext, RefObject } from "react";

const ActiveSectionContext = createContext<string>("");

export function useActiveSection(): string {
  return useContext(ActiveSectionContext);
}

interface TableOfContentsProps {
  activeSection: string;
  overviewRef: RefObject<HTMLDivElement | null>;
  featuresRef: RefObject<HTMLDivElement | null>;
  processRef: RefObject<HTMLDivElement | null>;
  advantagesRef: RefObject<HTMLDivElement | null>;
  scrollToSection: (ref: RefObject<HTMLDivElement | null>) => void;
  labels: {
    onThisPage: string;
    overview: string;
    features: string;
    process: string;
    advantages: string;
  };
}

export function TableOfContents({
  activeSection,
  overviewRef,
  featuresRef,
  processRef,
  advantagesRef,
  scrollToSection,
  labels,
}: TableOfContentsProps) {
  const [tocState, setTocState] = useState<"initial" | "fixed" | "bottom">("initial");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const ctaSection = document.querySelector(".cta-section");

      if (ctaSection) {
        const ctaSectionTop = ctaSection.getBoundingClientRect().top + window.scrollY;
        const tocHeight = 320;
        const stopFixedPoint = ctaSectionTop - tocHeight - 40;

        if (scrollPosition < 220) {
          setTocState("initial");
        } else if (scrollPosition >= stopFixedPoint) {
          setTocState("bottom");
        } else {
          setTocState("fixed");
        }
      } else {
        setTocState(scrollPosition > 220 ? "fixed" : "initial");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items: Array<{ id: string; label: string; ref: RefObject<HTMLDivElement | null> }> = [
    { id: "overview", label: labels.overview, ref: overviewRef },
    { id: "features", label: labels.features, ref: featuresRef },
    { id: "process", label: labels.process, ref: processRef },
    { id: "advantages", label: labels.advantages, ref: advantagesRef },
  ];

  return (
    <div
      className={`hidden lg:block lg:w-40 xl:w-64 z-20 ${
        tocState === "initial"
          ? "lg:absolute lg:top-0 ltr:lg:right-4 rtl:lg:left-4"
          : tocState === "fixed"
            ? "fixed top-20 ltr:right-4 rtl:left-4 transition-all duration-300 ease-in-out"
            : "lg:absolute bottom-auto transition-all duration-300 ease-in-out ltr:lg:right-4 rtl:lg:left-4"
      }`}
      style={
        tocState === "bottom"
          ? { position: "absolute", top: "auto", bottom: "580px" }
          : {}
      }
    >
      <ActiveSectionContext.Provider value={activeSection}>
        <div className="relative ps-4">
          <div className="absolute ltr:left-[21px] rtl:right-[21px] top-8 bottom-0 w-[0.5px] bg-white/10" />
          <div className="flex gap-2 items-center text-white/80 pb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M17 6.1H3" />
              <path d="M21 12.1H3" />
              <path d="M15.1 18H3" />
            </svg>
            <p className="text-sm text-white/80 m-0">{labels.onThisPage}</p>
          </div>

          <nav className="flex flex-col gap-4 max-h-[calc(100vh-180px)] overflow-y-auto pe-2">
            {items.map(({ id, label, ref }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(ref)}
                className={`w-full text-start px-4 py-2 ltr:border-l-2 rtl:border-r-2 transition ${
                  activeSection === id
                    ? "text-white border-white"
                    : "text-neutral-300 border-transparent hover:border-white/50 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </ActiveSectionContext.Provider>
    </div>
  );
}
