import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTrace } from '@/lib/hooks/use-trace';
import DOMPurify from "dompurify";

const CoinbaseQuest = () => {
  const router = useRouter();
  const { setCbUUID } = useTrace();

  useEffect(() => {
    const { uuid, next } = router.query;
    if (uuid) {
      setCbUUID(uuid as string);
      if (next && ((next as string).startsWith('/') || (next as string).startsWith(location.origin))) {
        const sanitizedNext = DOMPurify.sanitize(next as string);
        router.push(sanitizedNext);
      } else {
        router.push('/');
      }
    }
  }, [router.query, setCbUUID]);

  return null;
};

export default CoinbaseQuest;