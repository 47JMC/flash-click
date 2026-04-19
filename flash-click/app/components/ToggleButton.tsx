"use client";

import { useState } from "react";
import * as motion from "motion/react-client";

function ToggleButton() {
  const [toggled, setToggle] = useState(true);

  return (
    <motion.div
      layout
      className={`hover:bg-indigo-900 transition-colors rounded-2xl bg-blue-900 flex w-16 ${toggled ? "justify-end" : "justify-start"}`}
      onClick={() => setToggle(!toggled)}
    >
      <motion.div
        transition={{ duration: 0.28 }}
        layout
        className="bg-blue-600 rounded-full p-3 m-1 w-fit h-fit"
      />
    </motion.div>
  );
}

export default ToggleButton;
