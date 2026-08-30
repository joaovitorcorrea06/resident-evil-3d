import { useProgress } from '@react-three/drei';

export default function LoadingScreen() {
  const { active, progress } = useProgress();
  const isVisible = active || progress < 100;

  return (
    <div
      className={`loading-screen${isVisible ? ' is-visible' : ''}`}
      aria-hidden={!isVisible}
    >
      <div className="loading-screen__inner">
        <p className="loading-screen__eyebrow">Survival Horror</p>
        <h1 className="loading-screen__title">Resident Evil</h1>
        <p className="loading-screen__status">Loading...</p>
        <div className="loading-screen__bar" role="presentation">
          <span
            className="loading-screen__bar-fill"
            style={{ transform: `scaleX(${Math.min(progress / 100, 1)})` }}
          />
        </div>
      </div>
    </div>
  );
}
