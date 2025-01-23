// components/CoinbaseBanner.tsx
import React, { useMemo } from 'react';
import { useRecords } from '@/lib/hooks/use-records';
import { useRouter } from 'next/router';
import { useTrace } from '@/lib/hooks/use-trace';

export function CoinbaseBanner() {
  const { isPrimaryQuest, isConvertQuest, isRegisterQuest, isAvatarQuest } = useTrace();
  const { activeRecord } = useRecords();
  const router = useRouter();

  const coinbaseTips = {
    aleo_names_register: 'Register a name to complete the Quest.',
    convert_ans_to_public: 'Convert your private name to public to complete the Quest.',
    set_ans_primary_name: 'Set a primary name to complete the Quest.',
    list_page_convert: 'Manage a private name to complete the Quest.',
    list_page_set_primary: 'Manage a public name to complete the Quest.',
    list_page_avatar: 'Manage a name to complete the Quest.',
    set_ans_avatar: 'Set an avatar to complete the Quest.'
  };

  const coinbaseTip = useMemo(() => {
    if (isRegisterQuest && (router.pathname === '/' || router.pathname.startsWith('/name/'))) {
      return coinbaseTips.aleo_names_register;
    }
    const isAccountPage = router.pathname == '/account';
    const isNamePage = router.pathname.startsWith('/account/');
    if (isConvertQuest && isNamePage && activeRecord && activeRecord.private) {
      return coinbaseTips.convert_ans_to_public;
    }
    if (isConvertQuest && isAccountPage) {
      return coinbaseTips.list_page_convert;
    }
    if (isPrimaryQuest && isNamePage && activeRecord && !activeRecord.private && !activeRecord.isPrimaryName) {
      return coinbaseTips.set_ans_primary_name;
    }
    if (isPrimaryQuest && isAccountPage) {
      return coinbaseTips.list_page_set_primary;
    }
    if (isAvatarQuest && isAccountPage) {
      return coinbaseTips.list_page_avatar;
    }
    if (isAvatarQuest && isNamePage && activeRecord) {
      return coinbaseTips.set_ans_avatar;
    }
    return '';
  }, [router.pathname, activeRecord, isConvertQuest, isPrimaryQuest, isRegisterQuest, isAvatarQuest]);

  return (
    <>
      {coinbaseTip && (
        <div
          style={{
            backgroundColor: 'rgb(0, 82, 255)',
            color: '#ffffff',
            textAlign: 'center',
            padding: '5px',
            fontSize: '1rem'
          }}
        >
          {coinbaseTip}
        </div>
      )}
    </>
  );
}