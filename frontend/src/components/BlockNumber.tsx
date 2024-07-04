import {useRecords} from "@/lib/hooks/use-records";

export const BlockNumber = () => {
  const {statistic} = useRecords();

  return (
    <div
      className="fixed bottom-4 right-12 flex items-center gap-1.5 rounded bg-white px-3 py-1.5">
      <span className="relative flex h-1 w-1">
        <span className="absolute h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
        <span className="relative inline-flex h-1 w-1 rounded-full bg-green-500"></span>
      </span>
      <span className="text-black text-3xs-5">{statistic?.blockHeight}</span>
    </div>
  );
};