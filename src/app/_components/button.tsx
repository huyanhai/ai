import type { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  size?: number;
  onClick?: () => void;
}

const UserButton = ({ children, size = 32, onClick }: IProps) => {
  return (
    <button
      onClick={onClick}
      style={{ height: size, width: size }}
      className="box-border flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full border-[0.5px] border-[#C4C4C4] bg-transparent px-2 text-[#363636] transition-[border-color,background-color] duration-100 ease-in-out hover:bg-[#0C0C0D0A] active:bg-[#0C0C0D14]"
    >
      {children}
    </button>
  );
};

export default UserButton;
