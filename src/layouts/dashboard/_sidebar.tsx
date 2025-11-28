import cn from 'classnames';
import { MenuItem } from '@/components/ui/collapsible-menu';
import Scrollbar from '@/components/ui/scrollbar';
import Button from '@/components/ui/button';
import routes from '@/config/routes';
import { useDrawer } from '@/components/drawer-views/context';
import { Icon, IconName } from '@/components/icons';

const menuItems = [
  {
    name: 'Getting Started',
    icon: <Icon name={IconName.Home} size="xs" />,
    href: routes.gettingStarted,
  },
  {
    name: 'Mint',
    icon: <Icon name={IconName.Mint} size="xs" />,
    href: routes.mint,
  },
  {
    name: 'Send',
    icon: <Icon name={IconName.Send} size="xs" />,
    href: routes.send,
  },
  {
    name: 'Assets',
    icon: <Icon name={IconName.Assets} size="xs" />,
    href: routes.assets,
  },
  {
    name: 'Create Faucet',
    icon: <Icon name={IconName.CreateFaucet} size="xs" />,
    href: routes.faucet,
  },
  {
    name: 'Private Notes',
    icon: <Icon name={IconName.PrivateNotes} size="xs" />,
    href: routes.privateNotes,
  },
  {
    name: 'Consumable Notes',
    icon: <Icon name={IconName.ConsumableNotes} size="xs" />,
    href: routes.consumableNotes,
  },
  {
    name: 'Sign',
    icon: <Icon name={IconName.Sign} size="xs" />,
    href: routes.sign,
  },
  {
    name: 'Custom Transaction',
    icon: <Icon name={IconName.CustomTransaction} size="xs" />,
    href: routes.customTransaction,
  },
  {
    name: 'Import Private Note',
    icon: <Icon name={IconName.ImportNote} size="xs" />,
    href: routes.importPrivateNote,
  },
  {
    name: 'Sign Data',
    icon: <Icon name={IconName.SignData} size="xs" />,
    href: routes.signData,
  },
];

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { closeDrawer } = useDrawer();
  return (
    <aside
      className={cn(
        'top-0 z-40 h-[calc(100vh-80px)] w-full max-w-full border-dashed border-gray-400 bg-white ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed xl:top-[80px] xl:w-72 2xl:w-80',
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-between px-6 pt-9 pb-4 2xl:px-8">
        <div className="md:hidden">
          <Button
            title="Close"
            color="primary"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Icon name={IconName.Close} />
          </Button>
        </div>
      </div>

      <Scrollbar style={{ height: 'calc(100% - 96px)' }}>
        <div className="px-6 pb-5 2xl:px-8">
          <div className="mt-2">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </Scrollbar>
    </aside>
  );
}
