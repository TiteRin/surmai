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
  noneOption?: Option;
};

export const SearchableFilter = ({
  label,
  description,
  options,
  disabled = false,
  noneOption = undefined,
  ...props
}: SearchableFilterProps) => {

  const data = [
    ...options,
    ...(noneOption ? [noneOption] : []),
  ];
  const optionMap = new Map(data.map((option) => [option.value, option]));
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);

  const handleChange = (values: string[]) => {

    if (!noneOption) {
      props.onChange(values);
      return;
    }

    if (values.includes(noneOption.value)) {
      props.onChange([noneOption.value]);
      return;
    }

    props.onChange(values);
  }

  const isNoneOptionSelected = noneOption && props.value?.includes(noneOption.value);

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
      onChange={handleChange}
      data={data.map(option => ({...option, disabled: isNoneOptionSelected}))}
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
