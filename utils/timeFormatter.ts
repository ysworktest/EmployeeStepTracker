import { formatTimeWithZone } from './timezoneUtils';

export const formatAbsoluteTime = (timestamp: string | null | undefined): string => {
  return formatTimeWithZone(timestamp);
};
