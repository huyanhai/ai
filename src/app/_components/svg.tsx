"use client";

import dynamic from "next/dynamic";
import React from "react";

const iconCache: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {};

interface SvgProps extends React.SVGProps<SVGSVGElement> {
  name?: string;
}

const Svg = ({ name = "1:1", ...props }: SvgProps) => {
  iconCache[name] ??= dynamic(() => import(`@/assets/svg/${name}.svg`), {
    ssr: false,
  });
  const Icon = iconCache[name];
  return <Icon {...props} />;
};

export default Svg;
