import type {NextPageWithLayout} from '@/types';
import {NextSeo} from 'next-seo';
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Button from "@/components/ui/button";
import {useRecords} from "@/lib/hooks/use-records";
import {RefreshIcon} from "@/components/icons/refresh";
import AnchorLink from "@/components/ui/links/anchor-link";
import {useEffect} from "react";
import Layout from "@/layouts/_layout";

const AccountPage: NextPageWithLayout = () => {
  const {publicKey} = useWallet();
  const { loading, records, refreshRecords } = useRecords();

  useEffect(() => {
    publicKey && refreshRecords("auto");
  }, [publicKey]);

  return (
    <>
      <NextSeo
        title="Account | Aleo Name Service"
        description="Aleo Name Service account page"
      />
      <div className="w-full pt-8">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          My Domain Names
          {publicKey &&
          <Button color={"gray"} className="float-right" disabled={loading} onClick={() => refreshRecords("manual")}>
            <RefreshIcon className={loading?"text-aquamarine motion-safe:animate-spin":""} />
          </Button>
          }
        </h2>
        <div className="mb-5">
          {publicKey && <table className="table-fixed w-full rounded-lg [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))]">
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
                      {!record.private && !record.isPrimaryName && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Public</span>}
                    </td>
                    <td>
                      <AnchorLink href={`/account/${record.name}`}>
                        <Button className="px-4 py-1 h-8 sm:h-8 sm:px-4 mr-5">
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
  return <Layout>{page}</Layout>;
};

export default AccountPage;
