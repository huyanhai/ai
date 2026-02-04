"use client";
import { Popover, Space, Typography } from "antd";
import React from "react";
import UserButton from "../../button";
import { Bolt } from "lucide-react";
import Svg from "../../svg";
import type { TConfigScheme } from "@/lib/schema";
const { Title, Text } = Typography;

export interface IConfigProps {
  config: TConfigScheme;
  changeConfig: (config: TConfigScheme) => void;
}

const aspectConfig: TConfigScheme["aspect"][] = [
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const;

const setting = ({ config, changeConfig }: IConfigProps) => {
  return (
    <Popover
      content={
        <Space vertical size="small" className="w-100 p-1">
          <Title level={5} className="m-0! text-sm">
            生成偏好
          </Title>
          <div className="flex flex-col gap-2">
            <Text type="secondary" className="text-[11px]">
              选择比例
            </Text>
            <div className="grid grid-cols-6 gap-2 rounded-lg bg-gray-50/80 p-2">
              {aspectConfig.map((item, index) => (
                <div
                  onClick={() =>
                    changeConfig({
                      ...config,
                      aspect: item,
                    })
                  }
                  key={index}
                  className={`group flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-md py-2 transition-all hover:bg-[#191E26] ${config.aspect === item && "bg-[#191E26]"} `}
                >
                  <Svg
                    name={item}
                    className={`text-[#191E26] group-hover:text-white ${config.aspect === item && "text-white"}`}
                  />
                  <p
                    className={`text-[12px] text-[#191E26] group-hover:text-white ${config.aspect === item && "text-white"}`}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Space>
      }
      trigger="click"
    >
      <div>
        <UserButton>
          <Bolt strokeWidth={2} size={14} />
        </UserButton>
      </div>
    </Popover>
  );
};

export default setting;
