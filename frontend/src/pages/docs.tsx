import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { CodeBlock } from '@/components/CodeBlock';
import * as process from "process";

type SectionProps = {
  title: string;
  bgColor: string;
  sectionWidth?: string;
};

export function Section({
  title,
  bgColor,
  children,
  sectionWidth,
}: React.PropsWithChildren<SectionProps>) {
  return (
    <div className="mb-3">
      <div className={`rounded-lg ${bgColor}`}>
        <div className="relative items-center justify-between gap-4 p-4">
          <div className={`items-center ltr:mr-6 rtl:ml-6 ${sectionWidth}`}>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">
                {title}
              </span>
              <span className="mt-1 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                {children}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const GettingStartedPage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

  const addressToPrimaryName = `
// Replace "aleo1s......abcdef" with the address you want to lookup.
const address = "aleo1s......abcdef";
const response = await fetch(\`${NEXT_PUBLIC_API_URL}/primary_name/\${address}\`);
const { name } = await response.json();
  `;
  const nameToAddress = `
// Replace "test.ans" with your ANS name. 
// For private name, the address will be "Private Registration".
const name = "test.ans";
const response = await fetch(\`${NEXT_PUBLIC_API_URL}/address/\${name}\`);
const { address } = await response.json();
  `;
  const resolverContent = `
// Replace "test.ans" with your ANS name. replace category with category you want to lookup.
const name = "test.ans";
const category = "btc";
const response = await fetch(\`${NEXT_PUBLIC_API_URL}/resolver?name=\${name}&category=\${category}\`);
const { content } = await response.json();
  `;

  return (
    <>
      <NextSeo
        title="Aleo Name Service | Docs"
        description="Integrate Aleo Name Service into your app."
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl">
          Integrate Aleo Name Service into your app
        </h2>
        <Section
          title="Convert Address to Primary Name"
          bgColor="bg-white shadow-card dark:bg-light-dark"
        >
          <CodeBlock code={addressToPrimaryName} />
        </Section>
        <Section
            title="Convert Name to Address"
            bgColor="bg-white shadow-card dark:bg-light-dark"
        >
          <CodeBlock code={nameToAddress} />
        </Section>
        <Section
          title="Query Resolver Content"
          bgColor="bg-white shadow-card dark:bg-light-dark"
        >
          <CodeBlock code={resolverContent} />
        </Section>
      </div>
    </>
  );
};

GettingStartedPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default GettingStartedPage;
