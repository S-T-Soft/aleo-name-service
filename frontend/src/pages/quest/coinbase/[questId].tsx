import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTrace } from '@/lib/hooks/use-trace';
import DOMPurify from "dompurify";
import {usePrivateFee} from "@/lib/hooks/use-private-fee";

const CoinbaseQuest = () => {
  const router = useRouter();
  const {setPrivateFee} = usePrivateFee();
  const { setCbUUID, setQuestId } = useTrace();

  useEffect(() => {
    const { questId, next, coinbase_uuid } = router.query;
    if (coinbase_uuid) {
      console.log('CoinbaseQuest', coinbase_uuid, questId, next);
      setCbUUID(coinbase_uuid as string);
      setQuestId(questId as string);
      setPrivateFee(false);
      if (next && ((next as string).startsWith('/') || (next as string).startsWith(location.origin))) {
        const sanitizedNext = DOMPurify.sanitize(next as string);
        router.push(sanitizedNext);
      } else {
        router.push(questId == 'aleo_names_register' ? '/' : '/account');
      }
    }
  }, [router.query]);

  return null;
};

export default CoinbaseQuest;