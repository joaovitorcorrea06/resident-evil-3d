import { useRef } from 'react';
import { useProgress } from '@react-three/drei';
import SoundToggle from './components/experience/SoundToggle';
import Experience from './components/experience/Experience';
import { SCROLL_STAGE_HEIGHT_VH } from './config/cameraPath';
import { useAmbientAudio } from './hooks/useAmbientAudio';
import { useScrollProgress } from './hooks/useScrollProgress';
import StoryOverlay from './story/StoryOverlay';

export default function App() {
  const scrollStageRef = useRef(null);
  const progressRef = useScrollProgress(scrollStageRef);
  const { active, progress: loadProgress } = useProgress();
  const isLoading = active || loadProgress < 100;
  const audio = useAmbientAudio(progressRef, !isLoading);

  return (
    <div className="app-shell">
      <Experience progressRef={progressRef} />
      <StoryOverlay progressRef={progressRef} scrollStageRef={scrollStageRef} />
      <SoundToggle
        activated={audio.activated}
        isLoading={isLoading}
        muted={audio.muted}
        onToggle={audio.toggleMuted}
      />
      <div
        ref={scrollStageRef}
        aria-hidden="true"
        className="scroll-stage"
        style={{ height: `${SCROLL_STAGE_HEIGHT_VH}vh` }}
      />
    </div>
  );
}
