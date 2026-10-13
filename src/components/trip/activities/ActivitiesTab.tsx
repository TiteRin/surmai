import type { Trip, Attachment, Expense, TravellerProfile, Activity } from '../../../types/trips.ts';
import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { listActivities } from '../../../lib/api';
import { Card, Container, Flex, Group, LoadingOverlay, Modal, Stack, Text } from '@mantine/core';
import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { useDisclosure } from '@mantine/hooks';
import { GenericActivityForm } from './GenericActivityForm.tsx';
import { AddActivitiesMenu } from './AddActivitiesMenu.tsx';
import { GenericActivityData } from './GenericActivityData.tsx';

type ActivitiesViewProps = {
  trip: Trip;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
  tripTravellers?: TravellerProfile[];
  refetchTrip: () => void;
};

export const ActivitiesTab = ({
  trip,
  tripAttachments,
  expenseMap,
  tripTravellers = [],
  refetchTrip,
}: ActivitiesViewProps) => {
  const { t } = useTranslation();
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<Activity[]>({
    queryKey: ['listActivities', tripId],
    queryFn: () => listActivities(tripId || ''),
  });

  const { isMobile } = useSurmaiContext();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const refetchData = () => {
    return refetch().then(() => refetchTrip());
  };

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw new Error(error.message);
  }

  return (
    <Container py={'xs'} size="xl">
      <Group justify={'space-between'} align={'center'}>
        <Text size={'sm'} c={'dimmed'}>
          {t('activity_section_description', 'View and edit your activities for this trip')}
        </Text>
        {trip.canUpdate && (
          <>
            <Modal
              opened={formOpened}
              fullScreen={isMobile}
              size="xl"
              title={t('activity_add_new', 'Add Activity')}
              onClose={() => {
                closeForm();
              }}
            >
              <GenericActivityForm
                trip={trip}
                expenseMap={expenseMap}
                tripTravellers={tripTravellers}
                onSuccess={() => {
                  refetchData();
                  closeForm();
                }}
                onCancel={() => {
                  closeForm();
                }}
              />
            </Modal>
            <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
              <AddActivitiesMenu
                onClick={() => {
                  openForm();
                }}
              />
            </Flex>
          </>
        )}
      </Group>
      <Stack mt={'sm'}>
        {data.length === 0 && (
          <Card withBorder>
            <Text c={'dimmed'}>{t('activity_no_data', 'No Activities')}</Text>
          </Card>
        )}
        {data.map((t: Activity) => {
          return (
            <Fragment key={t.id}>
              <GenericActivityData
                refetch={refetchData}
                trip={trip}
                activity={t}
                tripAttachments={tripAttachments}
                expenseMap={expenseMap}
                tripTravellers={tripTravellers}
              />
            </Fragment>
          );
        })}
      </Stack>
    </Container>
  );
};
