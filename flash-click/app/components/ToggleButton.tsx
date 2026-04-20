"use client";

import * as motion from "motion/react-client";

type Props = {
  toggled: boolean;
  setToggle: (val: boolean) => void;
};

function ToggleButton({ toggled, setToggle }: Props) {
  return (
    <motion.div
      layout
      className={` ${toggled ? "bg-green-500" : "bg-blue-900 hover:bg-indigo-900"} transition-colors rounded-full bg-blue-900 flex items-center w-14 h-8 px-1 cursor-pointer ${toggled ? "justify-end" : "justify-start"}`}
      onClick={() => setToggle(!toggled)}
    >
      <motion.div
        layout
        transition={{
          duration: 0.25,
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className={` rounded-full w-6 h-6 ${toggled ? `bg-white` : `bg-blue-500`}`}
      />
    </motion.div>
  );
}

export default ToggleButton;
