import type {NextPageWithLayout, Record} from '@/types';
import {NextSeo} from 'next-seo';
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Button from "@/components/ui/button";
import AnchorLink from "@/components/ui/links/anchor-link";
import React, {useEffect, useState} from "react";
import {useRouter} from 'next/router'
import {useClient} from "@/lib/hooks/use-client";
import Layout from "@/layouts/_layout";
import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import ActiveLink from "@/components/ui/links/active-link";

const NamesPage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL!;
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
      <div className="w-full pt-8">
        <h2 className="mb-6 text-4xl font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          Public Names
        </h2>
        <div className="w-full rounded-lg [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] py-5 px-5">
          <ActiveLink
            href={`${NEXT_PUBLIC_EXPLORER_URL}${address}`}
            target={"_blank"}
            className="cursor-pointer [border:none] rounded-full flex flex-row items-center justify-start gap-[5px] z-[2]">
            <div className="!h-[21px] !w-[21px] relative">
              <div
                className="absolute top-[0.2px] left-[-0.3px] rounded-[50%] bg-gainsboro-200 w-full h-full z-[3]"/>
              <DynamicAddressIcon name="aleo" className="absolute top-[6.5px] left-[6.1px] w-[8.1px] h-[8.7px] z-[4]"/>
            </div>
            <div className="relative text-md leading-[100%] text-left z-[3] truncate">
              {address}
            </div>
          </ActiveLink>
        </div>
        <div className="my-3">
          <table
            className="table-fixed w-full rounded-lg [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] px-5">
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
                        <Button className="px-4 py-1 h-8 sm:h-8 sm:px-4">
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
  return <Layout>{page}</Layout>;
};

export default NamesPage;
