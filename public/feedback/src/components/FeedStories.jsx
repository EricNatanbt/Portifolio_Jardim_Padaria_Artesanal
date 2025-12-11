import { useState, useEffect, useRef } from "react";

export default function FeedStories() {

  const storyFiles = import.meta.glob("../videos/*.{mp4,MP4,jpg,JPG,gif,GIF}", { eager: true });

  console.log("storyFiles:", storyFiles);

  const stories = Object.entries(storyFiles)
    .map(([path, file]) => ({
      path,
      src: file?.default ?? file,
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((item) => item.src);

  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const current = stories[index];

  const next = () => setIndex((i) => (i + 1 < stories.length ? i + 1 : 0));
  const prev = () => setIndex((i) => (i - 1 >= 0 ? i - 1 : stories.length - 1));

  useEffect(() => {
    clearTimeout(timerRef.current);

    const isImage = current && (current.includes(".jpg") || current.includes(".gif"));

    if (isImage) {
      timerRef.current = setTimeout(() => next(), 4000);
    }

    return () => clearTimeout(timerRef.current);
  }, [index]);

  return (
    <div className="coluna fade-in">
      <h3 className="col-title">Stories</h3>

      <div className="story-container">
        <button className="story-btn" onClick={prev}>◀</button>

        <div className="story-content">
          {current?.includes(".mp4") ? (
            <video
              className="story-video"
              autoPlay
              muted
              playsInline
              onEnded={next}
              src={current}
            />
          ) : (
            <img className="story-video" src={current} />
          )}
        </div>

        <button className="story-btn" onClick={next}>▶</button>
      </div>

      <div className="story-progress-bar">
        <div
          className="story-progress-fill"
          style={{ width: ((index + 1) / stories.length) * 100 + "%" }}
        ></div>
      </div>

      <h3 className="col-footer">Stories</h3>
    </div>
  );
}
