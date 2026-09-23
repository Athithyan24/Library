import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUi } from '../store/useUi';
import login from '../lottie/login.json';
import shelf from '../lottie/shelf.json';
import empty from '../lottie/empty.json';
import desk from '../lottie/desk.json';
import lost from '../lottie/lost.json';
import read from '../lottie/read.json';

const clips = { login, shelf, empty, desk, lost, read };

export function LottieSlot({ name, className = 'h-40 w-40' }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <Lottie animationData={clips[name]} loop />
    </motion.div>
  );
}

export function useThemeBoot() {
  const dark = useUi((state) => state.dark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
}
