import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import lightLogo from '@/assets/images/logo.svg';
import darkLogo from '@/assets/images/logo-white.svg';
import logo from '@/assets/images/logo.svg';

const Logo: React.FC<React.SVGAttributes<{}>> = (props) => {
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();

  return (
    <AnchorLink href="https://www.leo.app/miden" className="flex" {...props}>
      <span className="relative flex overflow-hidden">
        {isMounted && isDarkMode && (
          <Image src={logo} alt="Miden Wallet" priority />
        )}
        {isMounted && !isDarkMode && (
          <Image src={logo} alt="Miden Wallet" priority />
        )}
      </span>
    </AnchorLink>
  );
};

export default Logo;
