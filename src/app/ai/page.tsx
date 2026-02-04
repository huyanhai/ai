import React from "react";
import AiChat from "../_components/ai-chat";

const Page = () => {
  return (
    <div className="flex h-screen flex-col">
      <div className="fixed right-0 h-full w-1/2 max-w-125 min-w-100 p-2">
        <div className="relative flex h-full w-full shrink-0 flex-col self-start overflow-hidden rounded-2xl border border-solid border-[#d5d8dd] bg-white p-2 backdrop-blur-sm empty:hidden">
          <AiChat />
        </div>
      </div>
    </div>
  );
};

export default Page;
