import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTrace } from '@/lib/hooks/use-trace';

const CoinbaseQuest = () => {
  const router = useRouter();
  const { setCbUUID } = useTrace();

  useEffect(() => {
    const { uuid } = router.query;
    if (uuid) {
      setCbUUID(uuid as string);
      router.push(router.query.next as string || '/');
    }
  }, [router.query, setCbUUID]);

  return null;
};

export default CoinbaseQuest;