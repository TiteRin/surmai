import { Group, MultiSelect, Text } from '@mantine/core';
import type { MultiSelectProps } from '@mantine/core';
import { useState } from 'react';

type Option = {
  value: string;
  label: string;
  description?: string;
};

type SearchableFilterProps = Omit<MultiSelectProps, 'data'> & {
  label: string;
  description: string;
  options: Array<Option>;
};

export const SearchableFilter = ({
  label,
  description,
  options,
  disabled = false,
  ...props
}: SearchableFilterProps) => {
  const optionMap = new Map(options.map((option) => [option.value, option]));
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);

  return (
    <MultiSelect
      {...props}
      label={label}
      description={description}
      comboboxProps={{
        withinPortal: false,
      }}
      dropdownOpened={isSelectOpen}
      onDropdownClose={() => setIsSelectOpen(false)}
      onDropdownOpen={() => setIsSelectOpen(true)}
      onOptionSubmit={() => setIsSelectOpen(false)}
      data={options}
      searchable
      clearable
      disabled={disabled}
      renderOption={({ option }) => {
        const data = optionMap.get(option.value);

        if (!data) {
          return;
        }

        return (
          <Group gap={'sm'}>
            <Text size={'sm'}>{data.label}</Text>
            {data.description && (
              <Text size={'xs'} c={'dimmed'}>
                {data.description}
              </Text>
            )}
          </Group>
        );
      }}
    />
  );
};
