import type {NextPageWithLayout} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import SearchView from "@/components/search/view";


const GettingStartedPage: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Getting Started | Aleo Name Service"
        description="Aleo Name Service"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-center">
          Your Aleo identity starts here.
        </h2>
        <div className="mb-3">
          <SearchView/>
        </div>
      </div>
    </>
  );
};

GettingStartedPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default GettingStartedPage;
