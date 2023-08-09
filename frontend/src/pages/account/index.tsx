import type {NextPageWithLayout} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Button from "@/components/ui/button";
import {useRecords} from "@/lib/hooks/use-records";
import {RefreshIcon} from "@/components/icons/refresh";
import AnchorLink from "@/components/ui/links/anchor-link";
import {useEffect} from "react";

const AccountPage: NextPageWithLayout = () => {
  const {wallet, publicKey} = useWallet();
  const { loading, records, refreshRecords } = useRecords();

  useEffect(() => {
    publicKey && refreshRecords("auto");
  }, [publicKey]);

  return (
    <>
      <NextSeo
        title="Aleo Name Service | Account"
        description="Aleo Name Service account page"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          My Domain Names
          <Button className="bg-sky-500 float-right" disabled={loading} onClick={() => refreshRecords("manual")}>
            <RefreshIcon className={loading?"motion-safe:animate-spin":""} />
          </Button>
        </h2>
        <div className="mb-3">
          {publicKey && <table className="table-fixed w-full rounded-lg bg-gray-800 px-5">
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
                      <span className="text-gray-400 font-bold">.ans</span>
                      {record.private && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Private</span>}
                      {record.isPrimaryName && <span className="bg-green-700 mx-3 px-2 py-1 rounded-lg">PrimaryName</span>}
                      {!record.private && !record.isPrimaryName && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Public</span>}
                    </td>
                    <td className="text-center">
                      <AnchorLink href={`/account/${record.name}.ans`}>
                        <Button className="bg-sky-500 px-4 py-1 h-8 sm:h-8 sm:px-4">
                          Manage
                        </Button>
                      </AnchorLink>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>}
          {!publicKey && <div className="text-center">
              Please connect your wallet to view your domain names
          </div>}
        </div>
      </div>
    </>
  );
};

AccountPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default AccountPage;
