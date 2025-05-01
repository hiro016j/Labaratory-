export const Wire = ({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) => {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <>
      <div
        className="absolute bg-black h-1"
        style={{
          width: `${length}px`,
          top: `${from.y}px`,
          left: `${from.x}px`,
          transform: `rotate(${angle}deg)`,
          transformOrigin: "0 0",
        }}
      />
    </>
  );
};
