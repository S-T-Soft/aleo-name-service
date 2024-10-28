import BindPage from './bind-page'
import type {NextPageWithLayout} from "@/types";
import Layout from "@/layouts/_layout";
import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";

const NamePage: NextPageWithLayout = () => {
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (router.isReady) {
      const {code} = router.query;
      if (typeof code === 'string') {
        setCode(code);
      }
    }
  }, [router.isReady && router.query]);

  return <BindPage params={{ code }} />
}

NamePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default NamePage;