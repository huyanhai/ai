"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Plane, SoftShadows, PerspectiveCamera, OrbitControls, ContactShadows, Environment, Float } from "@react-three/drei";
import { useSmartHomeStore } from "@/store/smart-home";
import * as THREE from "three";

export const Room = () => {
  const { lightIntensity, lightColor, isDoorOpen, temperature } = useSmartHomeStore();
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (boxRef.current) {
      boxRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight 
        position={[2, 2, 2]} 
        intensity={lightIntensity * 2} 
        color={lightColor} 
        castShadow 
      />
      
      {/* Floor */}
      <Plane rotation={[-Math.PI / 2, 0, 0]} args={[20, 20]} receiveShadow position={[0, -1, 0]}>
        <meshStandardMaterial color="#f0f0f0" />
      </Plane>

      {/* A floating "smart" device */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Box 
          ref={boxRef} 
          args={[1, 1, 1]} 
          position={[0, 0.5, 0]} 
          castShadow
        >
          <meshStandardMaterial color={isDoorOpen ? "#4ade80" : "#fb7185"} />
        </Box>
      </Float>

      {/* Temperature indicator as a sphere */}
      <Sphere args={[0.2, 32, 32]} position={[2, 0.2, 0]}>
        <meshStandardMaterial color={temperature > 25 ? "#ef4444" : "#3b82f6"} emissive={temperature > 25 ? "#ef4444" : "#3b82f6"} emissiveIntensity={0.5} />
      </Sphere>

      <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.25} far={10} color="#000000" />
      <Environment preset="city" />
      
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
    </>
  );
};
