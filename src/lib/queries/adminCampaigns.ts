import type {
  AdminCampaignHistoryRecord,
  AdminCampaignInput,
  AdminCampaignResult,
} from '../../types/admin';
import {
  parseAdminCampaignHistoryResponse,
  parseAdminCampaignResult,
} from '../../schemas/integrations/admin';

const ADMIN_CAMPAIGNS_ENDPOINT = '/api/admin-campaigns';
const ADMIN_CAMPAIGN_HISTORY_ENDPOINT = '/api/admin-campaign-history';

export const getAdminCampaignHistoryQueryKey = () => ['adminCampaignHistory'] as const;

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to send admin campaign.';
};

export const sendAdminCampaign = async (
  input: AdminCampaignInput,
): Promise<AdminCampaignResult> => {
  const response = await fetch(ADMIN_CAMPAIGNS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return parseAdminCampaignResult((await response.json()) as unknown);
};

export const fetchAdminCampaignHistory = async (): Promise<AdminCampaignHistoryRecord[]> => {
  const response = await fetch(ADMIN_CAMPAIGN_HISTORY_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = parseAdminCampaignHistoryResponse((await response.json()) as unknown);
  return payload.campaigns;
};
