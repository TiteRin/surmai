import { Chip } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type ChipFilterProps = {
  valueToDisplay: string | string[];
  onClearFilter?: (value?: string) => void;
};

type ChipFilterType = {
  valueToDisplay: string | string[];
  onClearFilter?: (value?: string) => void;
};

export const DefaultChipFilter = ({ valueToDisplay, onClearFilter }: ChipFilterType) => {
  return (
    <Chip defaultChecked size={'md'} onChange={onClearFilter}>
      {valueToDisplay}
    </Chip>
  );
};

export const StatusChipFilter = ({ valueToDisplay, onClearFilter }: ChipFilterProps) => {
  const { t } = useTranslation();

  return <DefaultChipFilter valueToDisplay={t(valueToDisplay, valueToDisplay)} onClearFilter={onClearFilter} />;
};

export const DestinationChipFilter = ({ valueToDisplay, onClearFilter }: ChipFilterProps) => {
  return <DefaultChipFilter valueToDisplay={valueToDisplay} onClearFilter={onClearFilter} />;
};