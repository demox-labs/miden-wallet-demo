import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Button from '@/components/ui/button';
import routes from '@/config/routes';
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui';
import { Wallet } from '@/components/icons/wallet';
import { Download } from '@/components/icons/download';
import { Links } from '@/components/icons/links';
import { Coins } from '@/components/icons/coins';

type SectionProps = {
  title: string;
  bgColor: string;
  icon: React.ReactNode;
  sectionWidth?: string;
};

export function Section({
  title,
  bgColor,
  icon,
  sectionWidth,
  children,
}: React.PropsWithChildren<SectionProps>) {
  return (
    <div className="mb-3">
      <div className={`${bgColor}`}>
        <div className="relative flex items-center justify-between gap-4 p-4">
          <div
            className={`flex-start flex flex-row items-start gap-[40px] ltr:mr-6 rtl:ml-6 ${sectionWidth}`}
          >
            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#FAE6D9] p-2">
              <span>{icon}</span>
            </div>
            <div>
              <span className="block text-xs font-medium tracking-wider text-gray-900 dark:text-white sm:text-sm">
                {title}
              </span>
              <span className="mt-1 hidden text-xs tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
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
  return (
    <>
      <NextSeo
        title="Miden Wallet | Getting Started"
        description="How to get started using the Miden Wallet"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14">
        <Section
          title="01. Get a Wallet"
          bgColor="bg-white"
          icon={<Download />}
        >
          Download and install a Miden-compatible wallet. We recommend Miden
          Wallet
          <br />
          <br />
          <a href="https://miden.fi" target="_blank">
            <Button color="gray">Download Miden Wallet</Button>
          </a>
        </Section>
        <Section
          title="02. Create a New Wallet Account"
          bgColor="bg-white"
          icon={<Wallet />}
        >
          <ol className="list-decimal space-y-1 pl-5">
            <li>Once installed - click on &quot;Create a new wallet&quot;.</li>
            <li>Type in your password.</li>
            <li>
              Save the provided Secret Recovery Phrase somewhere safe and finish
              creating your account. Never share this phrase.
            </li>
          </ol>
        </Section>
        <Section
          title="03. Connect Your Wallet"
          bgColor="bg-white"
          icon={<Links />}
        >
          Now that you have your wallet setup, connect it to our site by
          clicking the button below <br />
          <br />
          <WalletMultiButton />
        </Section>
        <Section
          title="04. Fund Your Wallet"
          bgColor="bg-white"
          icon={<Coins />}
        >
          Click on the button below to mint funds for your wallet
          <br /> <br />
          <a href={`${routes.mint}`}>
            <Button color="gray">Fund Wallet</Button>
          </a>
        </Section>
      </div>
    </>
  );
};

GettingStartedPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default GettingStartedPage;
