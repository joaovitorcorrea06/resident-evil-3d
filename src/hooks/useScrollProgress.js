import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollProgress(stageRef) {
  const progressRef = useRef({
    target: 0,
    current: 0,
    velocity: 0,
    direction: 1,
    walking: 0,
    lastUpdateAt: 0,
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return undefined;
    }

    const scrollTrigger = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate(self) {
        progressRef.current.target = self.progress;
        progressRef.current.velocity = Math.abs(self.getVelocity());
        progressRef.current.direction = self.direction;
        progressRef.current.lastUpdateAt = performance.now();
      },
    });

    const handleRefresh = () => {
      progressRef.current.target = scrollTrigger.progress;
    };

    ScrollTrigger.addEventListener('refresh', handleRefresh);
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener('refresh', handleRefresh);
      scrollTrigger.kill();
    };
  }, [stageRef]);

  return progressRef;
}
