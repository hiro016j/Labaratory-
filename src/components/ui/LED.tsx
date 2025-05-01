export const LED = ({ status }: { status: boolean }) => {
    return (
      <div
        className={`w-16 h-16 rounded-full ${status ? "bg-green-500" : "bg-gray-300"}`}
      ></div>
    );
  };
  