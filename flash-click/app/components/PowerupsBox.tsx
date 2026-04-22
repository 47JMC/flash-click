import { ReactNode } from "react";

function PowerupsBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#1F1B5C] rounded-lg flex flex-col border-2 border-indigo-900 p-2 m-2 gap-4">
      <p className="text-xl font-semibold font-fredoka">Power Ups</p>
      {children}
    </div>
  );
}

export default PowerupsBox;
