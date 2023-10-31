import type {NextPageWithLayout} from '@/types';
import {Record} from "@/types";
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useEffect, useState} from "react";
import {useRecords} from "@/lib/hooks/use-records";
import {useANS} from "@/lib/hooks/use-ans";
import {useClient} from "@/lib/hooks/use-client";
import ResolverView from "@/components/resolver/view";
import {PrivateName} from "@/pages/account/private-name";
import {PublicName} from "@/pages/account/public-name";


const ManageNamePage: NextPageWithLayout = () => {
  const router = useRouter();
  const {publicKey} = useWallet();
  const {getAddress} = useClient();
  const {convertToPrivate, convertToPublic, setPrimaryName, unsetPrimaryName, transfer} = useANS();
  const {records} = useRecords();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [isMine, setIsMine] = useState(true);
  const [isPrimaryName, setIsPrimaryName] = useState(false);
  const [name, setName] = useState("");
  const [record, setRecord] = useState<Record | undefined>(undefined);

  let {slug} = router.query;

  useEffect(() => {
    if (typeof slug === 'string') {
      setName(slug)
    }
  }, [slug]);

  useEffect(() => {
    if (!loading && name && name.length > 0) {
      if (available || !isMine) {
        router.push(`/name/${name}`);
      }
    }
  }, [loading, isMine, name]);

  useEffect(() => {
    // Only do the check if the name is valid and the public key is available
    if (publicKey && !loading && name && name.length > 0) {
      setLoading(true);
      getAddress(name)
        .then((address) => {
          setAvailable(false);
          const record = records?.find((rec) => rec.name === name);
          setRecord(record);
          const isPrivate = address.startsWith("Private");
          if (!isPrivate) {
            setIsPrimaryName(record?.isPrimaryName || false);
          }
          setIsPrivate(isPrivate);
          setIsMine(address === publicKey || (isPrivate && (records || []).some((rec) => rec.name === name)));
        }).catch((error) => {
        setAvailable(true);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [records, name, publicKey, triggerRecheck]);

  return (
    <>
      <NextSeo
        title="Aleo Name Service | Getting Started"
        description="Aleo Name Service"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          Manage <span className="text-sky-500">{name}</span>
          {isPrimaryName && <span className="bg-green-700 mx-3 px-2 py-1 rounded-lg text-lg sm:text-xl">PrimaryName</span>}
        </h2>
        <div
          className="mb-6 rounded-lg bg-white shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full">
          <div className="relative items-center justify-between gap-4 p-4">
            {loading ? (
              <span>Loading...</span>
            ) : available || !isMine ? (
              <span>Redirecting...</span>
            ) : isPrivate ? (
              <PrivateName
                name={name}
                setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                convertToPublic={convertToPublic}
                transfer={transfer}
              />
            ) : (
              <PublicName
                name={name}
                isPrimaryName={isPrimaryName}
                setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                convertToPrivate={convertToPrivate}
                setPrimaryName={setPrimaryName}
                unsetPrimaryName={unsetPrimaryName}
                transfer={transfer}
              />
            )}
          </div>
        </div>
        {!loading && !isPrivate && false && <div
            className="rounded-lg bg-white shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full gap-4 p-4">
            <ResolverView record={record!}/>
        </div>}
      </div>
    </>
  );
};

ManageNamePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ManageNamePage;
