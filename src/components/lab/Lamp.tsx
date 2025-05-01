export const Lamp = ({ isOn }: { isOn: boolean }) => {
  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center shadow relative ${
        isOn ? "bg-yellow-400" : "bg-gray-300"
      }`}
    >
      💡
      <div className="absolute left-0 top-1/2 -translate-y-1/2">+</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">−</div>
    </div>
  );
};
