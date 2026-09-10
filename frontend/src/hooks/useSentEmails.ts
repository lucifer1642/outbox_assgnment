import { useQuery } from '@tanstack/react-query';
import { emailsApi } from '@/lib/api';
import type { PaginatedResponse, EmailJob } from '@/types';

export function useSentEmails(page = 1, limit = 20, searchQuery = '', statusFilter = '') {
  return useQuery<PaginatedResponse<EmailJob>, Error>({
    queryKey: ['emails', 'sent', page, limit, searchQuery, statusFilter],
    queryFn: async () => {
      if (searchQuery || statusFilter) {
        return emailsApi.search(searchQuery, statusFilter, page, limit);
      }
      return emailsApi.getSent(page, limit);
    },
    refetchInterval: 10000,
  });
}
