export const Battery = () => {
  return (
    <div className="w-24 h-12 bg-red-600 text-white rounded flex flex-col justify-center items-center p-1 shadow relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">➕</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">➖</div>
      <span>Battery</span>
    </div>
  );
};
