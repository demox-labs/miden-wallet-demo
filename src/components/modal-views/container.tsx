import { Fragment, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Dialog, DialogPanel, DialogBackdrop } from '@/components/ui/dialog';
import { Transition, TransitionChild } from '@/components/ui/transition';
import Button from '@/components/ui/button';
import { useModal, MODAL_VIEW } from '@/components/modal-views/context';
import { Icon, IconName } from '../icons';

// dynamic imports
const SearchView = dynamic(() => import('@/components/search/view'));

function renderModalContent(view: MODAL_VIEW | string) {
  switch (view) {
    case 'SEARCH_VIEW':
      return <SearchView />;
    default:
      return null;
  }
}

export default function ModalContainer() {
  const router = useRouter();
  const { view, isOpen, closeModal } = useModal();
  useEffect(() => {
    // close search modal when route change
    router.events.on('routeChangeStart', closeModal);
    return () => {
      router.events.off('routeChangeStart', closeModal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 h-full w-full overflow-y-auto overflow-x-hidden p-4 text-center sm:p-6 lg:p-8 xl:p-10 3xl:p-12"
        onClose={closeModal}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 z-40 cursor-pointer bg-gray-700 bg-opacity-60 backdrop-blur" />
        </TransitionChild>

        {/* This element is to trick the browser into centering the modal contents. */}
        {view && view !== 'SEARCH_VIEW' && (
          <span className="inline-block h-full align-middle" aria-hidden="true">
            &#8203;
          </span>
        )}

        {/* This element is need to fix FocusTap headless-ui warning issue */}
        <div className="sr-only">
          <Button
            size="small"
            color="primary"
            shape="circle"
            onClick={closeModal}
            className="opacity-50 hover:opacity-80 "
          >
            <Icon name={IconName.Close} />
          </Button>
        </div>

        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-105"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-105"
        >
          <DialogPanel className="relative z-50 inline-block w-full text-left align-middle xs:w-auto">
            {view && renderModalContent(view)}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
