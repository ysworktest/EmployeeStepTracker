export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};

export const getTimezoneAbbreviation = (date: Date = new Date()): string => {
  try {
    const timezone = getUserTimezone();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find((part) => part.type === 'timeZoneName');

    return timeZonePart?.value || 'UTC';
  } catch (error) {
    return 'UTC';
  }
};

export const convertUTCToLocal = (utcTimestamp: string | null | undefined): Date | null => {
  if (!utcTimestamp) {
    return null;
  }

  try {
    const date = new Date(utcTimestamp);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    return null;
  }
};

export const formatTimeWithZone = (
  timestamp: string | null | undefined,
  options?: {
    includeSeconds?: boolean;
    use24Hour?: boolean;
  }
): string => {
  const date = convertUTCToLocal(timestamp);

  if (!date) {
    return 'Not synced yet';
  }

  try {
    const timezone = getUserTimezone();
    const timezoneAbbr = getTimezoneAbbreviation(date);

    const timeString = date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: options?.includeSeconds ? '2-digit' : undefined,
      hour12: !options?.use24Hour,
    });

    return `${timeString} ${timezoneAbbr}`;
  } catch (error) {
    return 'Invalid time';
  }
};

export const formatDateWithZone = (
  timestamp: string | null | undefined,
  options?: {
    includeTime?: boolean;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
  }
): string => {
  const date = convertUTCToLocal(timestamp);

  if (!date) {
    return 'N/A';
  }

  try {
    const timezone = getUserTimezone();
    const timezoneAbbr = getTimezoneAbbreviation(date);

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: options?.includeTime ? '2-digit' : undefined,
      minute: options?.includeTime ? '2-digit' : undefined,
      hour12: options?.includeTime,
    });

    const dateString = dateFormatter.format(date);

    if (options?.includeTime) {
      return `${dateString} ${timezoneAbbr}`;
    }

    return dateString;
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatDateShortWithZone = (
  timestamp: string | null | undefined
): string => {
  const date = convertUTCToLocal(timestamp);

  if (!date) {
    return 'N/A';
  }

  try {
    const timezone = getUserTimezone();

    const dateString = date.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return dateString;
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatRelativeTime = (timestamp: string | null | undefined): string => {
  const date = convertUTCToLocal(timestamp);

  if (!date) {
    return 'Never';
  }

  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 10) {
      return 'Just now';
    } else if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffMinutes === 1) {
      return '1 minute ago';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours === 1) {
      return '1 hour ago';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatTimeWithZone(timestamp);
    }
  } catch (error) {
    return 'Invalid time';
  }
};

export const getTodayDateStringInTimezone = (): string => {
  try {
    const timezone = getUserTimezone();
    const now = new Date();

    const year = now.toLocaleString('en-US', { timeZone: timezone, year: 'numeric' });
    const month = now.toLocaleString('en-US', { timeZone: timezone, month: '2-digit' });
    const day = now.toLocaleString('en-US', { timeZone: timezone, day: '2-digit' });

    return `${year}-${month}-${day}`;
  } catch (error) {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
};

export const formatWeekday = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const timezone = getUserTimezone();

    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
  } catch (error) {
    return '';
  }
};
