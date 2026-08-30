import { useEffect, useState } from 'react';

export default function SoundToggle({
  activated,
  isLoading,
  muted,
  onToggle,
}) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!activated || muted) {
      return undefined;
    }

    setFlash(true);
    const timeoutId = window.setTimeout(() => setFlash(false), 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activated, muted]);

  if (isLoading) {
    return null;
  }

  return (
    <button
      type="button"
      className={`sound-toggle${activated && !muted ? ' sound-toggle--live' : ''}${flash ? ' sound-toggle--flash' : ''}`}
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={
        !activated
          ? 'Enable ambient audio'
          : muted
            ? 'Unmute ambient audio'
            : 'Mute ambient audio'
      }
    >
      <span className="sound-toggle__label">
        {!activated ? 'Enable Sound' : muted ? 'Sound Off' : 'Sound On'}
      </span>
      <span className="sound-toggle__hint">
        {activated ? 'Toggle ambience' : 'Start the ambient score'}
      </span>
      <span className="sound-toggle__status-dot" aria-hidden="true" />
    </button>
  );
}
