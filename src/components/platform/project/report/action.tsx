"use client";
import React from "react";
import { Icon } from "@iconify/react";

import { usePathname } from "next/navigation";
import enDict from "@/components/internationalization/en.json";
import arDict from "@/components/internationalization/ar.json";

interface ActionProps {
  projectTitle: string;
  toPDF?: () => void;
}

const Action: React.FC<ActionProps> = ({ projectTitle, toPDF }) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];
  const isArabic = pathname.startsWith("/ar");
  const t = (isArabic ? arDict : enDict).common;

  return (
    <>
      <div className="flex gap-10 items-center">
        <div>
          <h1>{projectTitle}</h1>
        </div>
      </div>
      <div className="flex mt-4 gap-6 border-b border-gray-400 pb-4 w-[60rem]">
        <button className="flex w-32 gap-1 bg-gray-100 border border-gray-400 px-3 py-2 hover:bg-[#2a2a2a] hover:text-[#fcfcfc]">
          <Icon icon={"system-uicons:check"} height="24" />
          <h4>{t.approve}</h4>
        </button>
        <button className="flex w-32 justify-center items-center gap-2 bg-gray-100 border border-gray-400 px-3 py-2 hover:bg-[#2a2a2a] hover:text-[#fcfcfc]">
          <Icon icon={"fluent:edit-48-regular"} height="16" />
          <h4>{t.edit}</h4>
        </button>
        <button className="flex w-32 justify-center items-center gap-2 bg-gray-100 border border-gray-400 px-3 py-2 hover:bg-[#2a2a2a] hover:text-[#fcfcfc]">
          <Icon icon={"bi:send"} height="16" />
          <h4>{t.send}</h4>
        </button>
        <button
          onClick={toPDF}
          className=" flex w-32 justify-center items-center gap-2 bg-gray-100 border border-gray-400 px-3 py-2 hover:bg-[#2a2a2a] hover:text-[#fcfcfc]"
        >
          <Icon icon={"clarity:download-line"} height="18" />
          <h4>{t.download}</h4>
        </button>
      </div>
    </>
  );
};

export default Action;
