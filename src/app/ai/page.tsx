import React from "react";
import AiChat from "../_components/ai-chat";
import Scene from "@/components/Three/Scene";

const Page = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 3D Scene Background */}
      <div className="flex-1 relative overflow-hidden">
        <Scene />
        <div className="absolute bottom-10 left-10 z-10 p-6 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-xl max-w-md">
          <h1 className="text-2xl font-bold text-gray-800">3D Smart Home Agent</h1>
          <p className="text-gray-600 mt-2">
            Try saying: "Turn the light to red", "Open the door", or "Set temperature to 28 degrees".
          </p>
        </div>
      </div>

      {/* Chat UI */}
      <div className="relative h-full w-1/2 max-w-125 min-w-100 p-2 z-20">
        <div className="relative flex h-full w-full shrink-0 flex-col self-start overflow-hidden rounded-2xl border border-solid border-[#d5d8dd] bg-white/80 p-2 backdrop-blur-md shadow-2xl">
          <AiChat />
        </div>
      </div>
    </div>
  );
};

export default Page;
