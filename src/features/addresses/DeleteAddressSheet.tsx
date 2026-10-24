import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@/shared/ui';

type DeleteAddressSheetProps = {
  /** The name of the address to delete, or null when the sheet is closed. */
  name: string | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteAddressSheet({
  name,
  deleting,
  onConfirm,
  onCancel,
}: DeleteAddressSheetProps) {
  const { t } = useTranslation('addresses');

  return (
    <Sheet
      open={name !== null}
      placement="center"
      onClose={onCancel}
      title={t('list.deleteSheet.title')}
      footer={
        <>
          <Button loading={deleting} onClick={onConfirm}>
            {t('list.deleteSheet.confirm')}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {t('list.deleteSheet.cancel')}
          </Button>
        </>
      }
    >
      <p>{t('list.deleteSheet.message', { name: name ?? '' })}</p>
    </Sheet>
  );
}
