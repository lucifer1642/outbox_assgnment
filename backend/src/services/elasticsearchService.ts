import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { logger } from '../db/logger';

export const esClient = new Client({
  node: config.elasticsearch.url,
});

const EMAIL_INDEX = 'email_jobs';

export interface EmailDocument {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  previewUrl?: string;
  campaignId?: string;
  createdAt: string;
}

export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            recipientEmail: { type: 'keyword' },
            subject: { type: 'text', analyzer: 'standard' },
            body: { type: 'text', analyzer: 'standard' },
            senderEmail: { type: 'keyword' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            previewUrl: { type: 'keyword' },
            campaignId: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
      });
      logger.info(`Elasticsearch index '${EMAIL_INDEX}' created`);
    } else {
      logger.info(`Elasticsearch index '${EMAIL_INDEX}' already exists`);
    }
  } catch (err: any) {
    logger.warn('Elasticsearch init failed (non-fatal, search will be unavailable)', {
      error: err.message,
    });
  }
}

export async function indexEmail(doc: EmailDocument): Promise<void> {
  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: doc.id,
      document: doc,
    });
  } catch (err: any) {
    logger.warn('Failed to index email in Elasticsearch', { error: err.message, id: doc.id });
  }
}

export async function updateEmailInIndex(
  id: string,
  updates: Partial<EmailDocument>
): Promise<void> {
  try {
    await esClient.update({
      index: EMAIL_INDEX,
      id,
      doc: updates,
    });
  } catch (err: any) {
    logger.warn('Failed to update email in Elasticsearch', { error: err.message, id });
  }
}

export interface SearchEmailsOptions {
  userId: string;
  query?: string;
  status?: string;
  from?: number;
  size?: number;
}

export interface SearchEmailsResult {
  total: number;
  hits: EmailDocument[];
}

export async function searchEmails(options: SearchEmailsOptions): Promise<SearchEmailsResult> {
  const { userId, query, status, from = 0, size = 20 } = options;

  const must: any[] = [{ term: { userId } }];

  if (status) {
    must.push({ term: { status } });
  }

  if (query && query.trim()) {
    must.push({
      multi_match: {
        query: query.trim(),
        fields: ['subject^2', 'body', 'recipientEmail^3', 'senderEmail^2'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  try {
    const result = await esClient.search<EmailDocument>({
      index: EMAIL_INDEX,
      from,
      size,
      query: { bool: { must } },
      sort: [{ scheduledAt: { order: 'desc' } }],
    });

    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value || 0;

    return {
      total,
      hits: result.hits.hits.map((h) => h._source as EmailDocument),
    };
  } catch (err: any) {
    logger.warn('Elasticsearch search failed', { error: err.message });
    return { total: 0, hits: [] };
  }
}
