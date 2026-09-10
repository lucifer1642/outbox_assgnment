import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emailsApi } from '@/lib/api';
import type { ScheduleEmailRequest } from '@/types';

export function useScheduleEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleEmailRequest) => emailsApi.schedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}
