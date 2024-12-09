import type {NextPageWithLayout} from "@/types";
import Layout from "@/layouts/_layout";
import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import RotatingCoin from "@/pages/tapns/rotating-coin";
import SearchView from "@/components/search/view";
import env from "@/config/env";

const NamePage: NextPageWithLayout = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [queue, setQueue] = useState(0);

  useEffect(() => {
    if (router.isReady) {
      const {code, queue, address} = router.query;
      if (typeof code === 'string') {
        setCode(code);
      }
      if (typeof queue === 'string') {
        setQueue(parseInt(queue));
      }
      if (typeof address === 'string') {
        setAddress(address);
      }
    }
  }, [router.isReady && router.query]);

  useEffect(() => {
    const fetchQueuePosition = async () => {
      try {
        const response = await fetch(`${env.GO_URL}/tapns/queue/${code}`);
        const data = await response.json();
        setQueue(data.queue);
        if (data.queue === 0) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Error fetching queue position:", error);
      }
    };

    const intervalId = setInterval(fetchQueuePosition, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [code]);

  return <div className="container mx-auto p-4 flex justify-center items-center">
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="w-48 mx-auto mb-4">
          <RotatingCoin/>
        </div>
      </CardHeader>
      {queue > 0 && <CardContent className={"leading-relaxed"}>
        <CardTitle>You’re in line! 🎉</CardTitle>
        <CardDescription className={"mt-2"}>
          You’re currently in position <span className="font-bold text-xl text-aquamarine"> {queue} </span> for
          receiving your Coupon Card.<br/>
          Hang tight—your turn is coming soon! 😊
        </CardDescription>
      </CardContent>}
      {queue == 0 && <CardContent className={"leading-relaxed text-center"}>
        <CardTitle>🎉Register your ANS🎉</CardTitle>
      </CardContent>}
      {queue == 0 &&  <SearchView/>}
    </Card>
  </div>
}

NamePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default NamePage;