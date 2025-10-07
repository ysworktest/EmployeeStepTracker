export const formatAbsoluteTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) {
    return 'Not synced yet';
  }

  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'Invalid time';
  }
};
