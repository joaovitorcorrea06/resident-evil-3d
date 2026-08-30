export default function StorySection({
  align,
  body,
  eyebrow,
  isActive,
  isFinal,
  title,
}) {
  return (
    <section
      className={`story-section story-section--${align}${isFinal ? ' story-section--final' : ''}${isActive ? ' story-section--active' : ''}`}
    >
      <p className="story-section__eyebrow">{eyebrow}</p>
      <h2 className="story-section__title">{title}</h2>
      {body?.length ? (
        <div className="story-section__body">
          {body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
