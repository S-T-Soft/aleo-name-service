import type {NextPageWithLayout, Record} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Button from "@/components/ui/button";
import AnchorLink from "@/components/ui/links/anchor-link";
import {useEffect, useState} from "react";
import {useRouter} from 'next/router'
import {useClient} from "@/lib/hooks/use-client";

const NamesPage: NextPageWithLayout = () => {
  const {publicKey} = useWallet();
  const {getPublicDomain} = useClient();
  const router = useRouter();
  const [records, setRecords] = useState<Record[]>([]);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (router.isReady) {
      const {addr} = router.query;
      if (address == publicKey) {
        router.push("/account");
        return;
      }
      setAddress(addr || "");
    }
 }, [router.isReady && router.query, publicKey]);

  useEffect(() => {
    if (address) {
      getPublicDomain(address).then((records) => {
        console.log(records)
        setRecords(records);
      });
    }
  }, [address]);

  return (
    <>
      <NextSeo
        title={`${address} | Names | Aleo Name Service`}
        description="Aleo Name Service address public names page"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          Public Names
        </h2>
        <div className="mb-3">
          <table className="table-fixed w-full rounded-lg bg-gray-800 px-5">
              <thead>
                <tr className="uppercase h-16">
                  <th>Aleo Name</th>
                  <th className="w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(records || []).map((record, index) => (
                  <tr key={index} className="h-16 hover:bg-gray-700">
                    <td className="pl-5">
                      <span className="font-bold">{record.name}</span>
                      {record.private && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Private</span>}
                      {record.isPrimaryName && <span className="bg-green-700 mx-3 px-2 py-1 rounded-lg">PrimaryName</span>}
                    </td>
                    <td className="text-center">
                      <AnchorLink href={`/name/${record.name}`}>
                        <Button className="bg-sky-500 px-4 py-1 h-8 sm:h-8 sm:px-4">
                          View
                        </Button>
                      </AnchorLink>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

NamesPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default NamesPage;
