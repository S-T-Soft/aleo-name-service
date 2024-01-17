import {useRecords} from "@/lib/hooks/use-records";

const Stats = () => {
  const {statistic} = useRecords();

  return (
    <div className="text-gray-300 p-4 relative mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px]">
      <div className="flex sm:flex-row flex-col justify-between items-center">
        <div className="text-center mt-3">
          <p className="font-semibold text-gray-500">Domains</p>
          <p className="text-4xl font-bold">{statistic?.totalNames?.toLocaleString()}</p>
        </div>
        <div className="sm:border-l border-gray-800 mx-4 h-12 align-middle hidden md:block"></div>
        <div className="text-center mt-3">
          <p className="font-semibold text-gray-500">Private Domains</p>
          <p className="text-4xl font-bold">{statistic?.totalPriNames?.toLocaleString()}</p>
        </div>
        <div className="sm:border-l border-gray-800 mx-4 h-12 align-middle hidden md:block"></div>
        <div className="text-center mt-3">
          <p className="font-semibold text-gray-500">Public Owners</p>
          <p className="text-4xl font-bold">{statistic?.totalNFTOwners?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Stats;
