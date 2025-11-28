import React from 'react';

import classNames from 'clsx';

import { ReactComponent as LogoIcon } from '@/assets/images/logo.svg';
import { ReactComponent as CloseIcon } from '@/assets/images/close.svg';
import { ReactComponent as HomeIcon } from '@/assets/images/home.svg';
import { ReactComponent as MintIcon } from '@/assets/images/mint.svg';
import { ReactComponent as SendIcon } from '@/assets/images/send.svg';
import { ReactComponent as AssetsIcon } from '@/assets/images/assets.svg';
import { ReactComponent as CreateFaucetIcon } from '@/assets/images/create-faucet.svg';
import { ReactComponent as ConsumableNotesIcon } from '@/assets/images/consumable-notes.svg';
import { ReactComponent as CustomTransactionIcon } from '@/assets/images/custom-transaction.svg';
import { ReactComponent as SignIcon } from '@/assets/images/sign.svg';
import { ReactComponent as SignDataIcon } from '@/assets/images/sign-data.svg';
import { ReactComponent as ImportPrivateNoteIcon } from '@/assets/images/import-note.svg';
import { ReactComponent as PrivateNotesIcon } from '@/assets/images/private-notes.svg';
import { ReactComponent as WalletIcon } from '@/assets/images/wallet.svg';
import { ReactComponent as DownloadIcon } from '@/assets/images/download.svg';
import { ReactComponent as LinksIcon } from '@/assets/images/links.svg';
import { ReactComponent as CoinsIcon } from '@/assets/images/coins.svg';
import { ReactComponent as ChevronDownIcon } from '@/assets/images/chevron-down.svg';
import { ReactComponent as SearchIcon } from '@/assets/images/search.svg';
import { ReactComponent as CheckIcon } from '@/assets/images/check.svg';
import { ReactComponent as CopyIcon } from '@/assets/images/copy.svg';

export enum IconName {
  Logo = 'Logo',
  Close = 'Close',
  Home = 'Home',
  Mint = 'Mint',
  Send = 'Send',
  Assets = 'Assets',
  CreateFaucet = 'CreateFaucet',
  ConsumableNotes = 'ConsumableNotes',
  CustomTransaction = 'CustomTransaction',
  Sign = 'Sign',
  SignData = 'SignData',
  ImportNote = 'ImportNote',
  PrivateNotes = 'PrivateNotes',
  Wallet = 'Wallet',
  Download = 'Download',
  Links = 'Links',
  Coins = 'Coins',
  ChevronDown = 'ChevronDown',
  Search = 'Search',
  Check = 'Check',
  Copy = 'Copy',
}

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '5xl';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName;
  size?: IconSize;
}

const Icons = (props: IconProps) => {
  switch (props.name) {
    case IconName.Logo:
      return <LogoIcon {...props} />;
    case IconName.Close:
      return <CloseIcon {...props} />;
    case IconName.Home:
      return <HomeIcon {...props} />;
    case IconName.Mint:
      return <MintIcon {...props} />;
    case IconName.Send:
      return <SendIcon {...props} />;
    case IconName.Assets:
      return <AssetsIcon {...props} />;
    case IconName.CreateFaucet:
      return <CreateFaucetIcon {...props} />;
    case IconName.ConsumableNotes:
      return <ConsumableNotesIcon {...props} />;
    case IconName.CustomTransaction:
      return <CustomTransactionIcon {...props} />;
    case IconName.Sign:
      return <SignIcon {...props} />;
    case IconName.SignData:
      return <SignDataIcon {...props} />;
    case IconName.ImportNote:
      return <ImportPrivateNoteIcon {...props} />;
    case IconName.PrivateNotes:
      return <PrivateNotesIcon {...props} />;
    case IconName.Wallet:
      return <WalletIcon {...props} />;
    case IconName.Download:
      return <DownloadIcon {...props} />;
    case IconName.Links:
      return <LinksIcon {...props} />;
    case IconName.Coins:
      return <CoinsIcon {...props} />;
    case IconName.ChevronDown:
      return <ChevronDownIcon {...props} />;
    case IconName.Search:
      return <SearchIcon {...props} />;
    case IconName.Check:
      return <CheckIcon {...props} />;
    case IconName.Copy:
      return <CopyIcon {...props} />;
    default:
      return null;
  }
};

const iconClassNamePerSize = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  xxl: 'w-16 h-16',
  '3xl': 'w-40 h-40',
  '5xl': 'w-64 h-64',
};

export const Icon: React.FC<IconProps> = ({
  className,
  size = 'md',
  ...props
}) => {
  return (
    <Icons
      {...props}
      className={classNames(className, iconClassNamePerSize[size])}
    />
  );
};
