import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { DEBUG_ENABLED } from '../config/debug';
import { STORY_SECTIONS } from '../config/storySections';
import { SCENE_ANALYSIS } from '../config/sceneAnalysis';
import StorySection from './StorySection';

const DEBUG = DEBUG_ENABLED;

function smoothStep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function StoryOverlay({ progressRef, scrollStageRef }) {
  const { active, progress: loadProgress } = useProgress();
  const [progress, setProgress] = useState(0);
  const introCutoff = STORY_SECTIONS[0]?.start ?? 0.16;
  const heroIsActive = progress < introCutoff;
  const isLoading = active || loadProgress < 100;
  const overlayStyle = useMemo(() => {
    const introBlend = 1 - smoothStep(0.04, 0.18, progress);
    const fireplaceBlend = smoothStep(0.46, 0.68, progress);
    const finalBlend = smoothStep(0.78, 0.97, progress);

    return {
      '--grain-opacity': (0.07 - introBlend * 0.03 + finalBlend * 0.01).toFixed(3),
      '--door-glow-opacity': (0.08 + introBlend * 0.26).toFixed(3),
      '--scene-tint-opacity': (0.02 + fireplaceBlend * 0.12 + finalBlend * 0.06).toFixed(3),
      '--scene-tint-color': finalBlend > 0.4 ? '96, 14, 14' : '122, 54, 20',
      '--vignette-outer': (0.8 - fireplaceBlend * 0.08 + finalBlend * 0.06).toFixed(3),
      '--vignette-mid': (0.18 - fireplaceBlend * 0.05 + introBlend * 0.04).toFixed(3),
    };
  }, [progress]);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      setProgress(progressRef.current.current);
      frameId = window.requestAnimationFrame(updateProgress);
    };

    frameId = window.requestAnimationFrame(updateProgress);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [progressRef]);

  return (
    <div
      className={`story-overlay${isLoading ? ' story-overlay--hidden' : ''}`}
      style={overlayStyle}
    >
      <div className="story-overlay__vignette" />
      <div className="story-overlay__door-glow" />
      <div className="story-overlay__scene-tint" />
      <div className="story-overlay__grain" />

      <div className="story-overlay__hero">
        <div
          className={`story-section story-section--center story-section--hero${heroIsActive ? ' story-section--active' : ''}`}
        >
          <p className="story-section__eyebrow">Survival Horror</p>
          <h1 className="story-section__title">Resident Evil</h1>
          <p className="story-section__body story-section__body--single">
            Enter the survival horror.
          </p>
        </div>
      </div>

      <div className="story-overlay__chapters">
        {STORY_SECTIONS.map((section, index) => (
          <StorySection
            key={section.id}
            isActive={
              section.isFinal
                ? progress >= section.start
                : progress >= section.start && progress <= section.end
            }
            {...section}
          />
        ))}
      </div>

      {DEBUG ? (
        <aside className="story-overlay__debug-panel">
          <p>ETAPA 2</p>
          <p>Progress: {progress.toFixed(3)}</p>
          <p>{SCENE_ANALYSIS.animations[0].name}: {SCENE_ANALYSIS.animations[0].duration}s</p>
          <p>Zombie node: {SCENE_ANALYSIS.namedAnchors.zombie.name}</p>
          <p>Fire node: {SCENE_ANALYSIS.namedAnchors.fire.name}</p>
          <p>Use `overrideCamera` or `orbit` in Leva to recalibrate the path.</p>
        </aside>
      ) : null}
    </div>
  );
}
