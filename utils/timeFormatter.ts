export const formatAbsoluteTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) {
    return 'Not synced yet';
  }

  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${minutesStr} ${ampm}`;
  } catch (error) {
    return 'Invalid time';
  }
};
