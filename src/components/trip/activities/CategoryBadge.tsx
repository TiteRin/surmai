import { Badge, BadgeProps, Space } from '@mantine/core';
import { getCategoryColor } from '@/src/app/theme.ts';
import type { ActivityCategory } from '@/src/types/trips.ts';

type CategoryBadgeProps = BadgeProps & {
  category?: ActivityCategory;
};

const CategoryBadge = ({ category, ...badgeProps }: CategoryBadgeProps) => {

  const { size } = badgeProps;

  if (!category) {
    return <Space h={size || "md"}/>;
  }

  return (
    <Badge
      color={getCategoryColor(category.color)}
      size={size || "md"}
      leftSection={category.emoji}
      variant="outline"
      {...badgeProps}
    >
      {category.name}
    </Badge>
  );
};

export default CategoryBadge;