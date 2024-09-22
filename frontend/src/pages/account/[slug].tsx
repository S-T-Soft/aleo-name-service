import type {NextPageWithLayout} from '@/types';
import {Record} from "@/types";
import {NextSeo} from 'next-seo';
import Head from 'next/head';
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useEffect, useState} from "react";
import {useRecords} from "@/lib/hooks/use-records";
import {useANS} from "@/lib/hooks/use-ans";
import {useClient} from "@/lib/hooks/use-client";
import ResolverView from "@/components/resolver/view";
import PrivateName from "@/pages/account/private-name";
import PublicName from "@/pages/account/public-name";
import SubNameView from "@/components/subname/view";
import Layout from "@/layouts/_layout";


const ManageNamePage: NextPageWithLayout = () => {
  const router = useRouter();
  const {wallet, publicKey} = useWallet();
  const {getAddress} = useClient();
  const {convertToPrivate, convertToPublic, setPrimaryName, unsetPrimaryName, transfer} = useANS();
  const {records, updateRecodeBalance} = useRecords();
  const [activeTab, setActiveTab] = useState('profile');
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [isMine, setIsMine] = useState(true);
  const [isPrimaryName, setIsPrimaryName] = useState(false);
  const [name, setName] = useState("");
  const [record, setRecord] = useState<Record | undefined>(undefined);

  useEffect(() => {
    if (!loading && name && name.length > 0) {
      if (available || !isMine) {
        router.push(`/name/${name}`);
      }
    }
  }, [loading, isMine, name]);

  useEffect(() => {
    if (router.isReady) {
      const tab = router.query.tab || "profile";
      const {slug} = router.query;
      if (tab) {
        setActiveTab(tab as string);
      }
      if (typeof slug === 'string') {
        setName(slug)
      }
    }
  }, [router.isReady && router.query]);

  useEffect(() => {
    // Only do the check if the name is valid and the public key is available
    if (publicKey && !loading && name && name.length > 0) {
      setLoading(true);
      getAddress(name)
        .then((address) => {
          setAvailable(false);
          const record = records?.find((rec) => rec.name === name);
          setRecord(record);
          record && updateRecodeBalance(record);
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
    } else if (!wallet?.adapter.connected && name && name.length > 0) {
      router.push(`/name/${name}`);
    }
  }, [records, name, publicKey, triggerRecheck]);

  return (
    <>
      <Head>
        <title>{`${name} - ${activeTab} | Manage | Aleo Name Service`}</title>
      </Head>
      <NextSeo
        title={`${name} - ${activeTab} | Manage | Aleo Name Service`}
        description="Aleo Name Service manage page"
      />
      <div className="w-full pt-8">
        <h2 className="mb-6 text-4xl font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 text-left">
          Manage <span className="text-aquamarine">{name}</span>
          {isPrimaryName && <span className="bg-green-700 mx-3 px-2 py-1 rounded-lg text-lg sm:text-xl">PrimaryName</span>}
        </h2>
        <div>
            <ul className="flex text-gray-300">
                <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
                  <button
                      className={`font-bold uppercase px-5 py-3 block leading-normal ${activeTab === 'profile' ? 'text-aquamarine' : ''}`}
                      onClick={() => router.push(name)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                  >
                      Profile
                  </button>
                </li>
                <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
                  <button
                      className={`font-bold uppercase px-5 py-3 block leading-normal ${activeTab === 'subnames' ? 'text-aquamarine' : ''}`}
                      onClick={() => router.push(name + '?tab=subnames')}
                      style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                  >
                      Subnames
                  </button>
                </li>
              {!loading && <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
                  <button
                      className={`font-bold uppercase px-5 py-3 block leading-normal ${activeTab === 'resolver' ? 'text-aquamarine' : ''}`}
                      onClick={() => router.push(name + '?tab=resolver')}
                      style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                  >
                      Resolver
                  </button>
                </li>}
            </ul>
        </div>
        <div
          className="mb-6 rounded-lg bg-white shadow-card z-50 mx-auto w-full max-w-full [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))]">
          <div className="relative items-center justify-between gap-4 p-4">
          {loading && <span>Loading...</span>}
          {!loading && available || !isMine && <span>Redirecting...</span>}
          {!loading && activeTab == "profile" && isPrivate &&
              <PrivateName
                record={record!}
                setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                convertToPublic={convertToPublic}
                transfer={transfer}
              />}
          {!loading && record && activeTab == "profile" && !isPrivate &&
              <PublicName
                record={record}
                setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                convertToPrivate={convertToPrivate}
                setPrimaryName={setPrimaryName}
                unsetPrimaryName={unsetPrimaryName}
                transfer={transfer}
              />}
          {!loading && activeTab == "subnames" && <SubNameView record={record!}/>}
          {!loading && activeTab == "resolver" && record && <ResolverView record={record} onlyView={false}/>}
          </div>
        </div>
      </div>
    </>
  );
};

ManageNamePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ManageNamePage;
