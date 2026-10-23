import { motion, useTransform, type MotionValue } from "framer-motion";
import { processSteps } from "./processSteps";

export function ProcessStep({
  index,
  position,
  still,
}: {
  index: number;
  position: MotionValue<number>;
  still: boolean;
}) {
  const opacity = useTransform(
    position,
    [index - 0.49, index - 0.2, index + 0.2, index + 0.49],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    position,
    [index - 1, index, index + 1],
    [100, 0, -100],
  );
  const numberY = useTransform(
    position,
    [index - 1, index, index + 1],
    [160, 0, -160],
  );
  const step = processSteps[index];
  return (
    <motion.article
      className="cinema-process-step"
      style={still ? undefined : { opacity, y }}
    >
      <div className="cinema-process-copy">
        <p className="cinema-micro">Step 0{index + 1} / 05</p>
        <h3>{step.title}</h3>
        <p className="cinema-process-subtitle">{step.subtitle}</p>
        <p>{step.text}</p>
        <span className="cinema-micro">{step.detail}</span>
      </div>
      <motion.span
        className="cinema-process-number"
        aria-hidden="true"
        style={still ? undefined : { y: numberY }}
      >
        0{index + 1}
      </motion.span>
    </motion.article>
  );
}
