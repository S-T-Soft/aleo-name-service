import { SearchIcon } from '@/components/icons/search';
import { useModal } from '@/components/modal-views/context';
import Button from '@/components/ui/button';

export default function SearchButton({ ...props }) {
  const { openModal } = useModal();
  return (
    <Button
      {...props}
      onClick={() => openModal('SEARCH_VIEW')}
      shape="circle"
      aria-label="Search"
    >
      <SearchIcon className="h-5 w-5" />
    </Button>
  );
}
