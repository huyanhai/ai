"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Room } from "./Room";
import { Loader } from "@react-three/drei";

const Scene = () => {
  return (
    <div className="absolute inset-0 z-0 bg-linear-to-b from-[#f8fafc] to-[#e2e8f0]">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 45 }}
        gl={{ antialias: true, stencil: false, depth: true }}
      >
        <Suspense fallback={null}>
          <Room />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};

export default Scene;
