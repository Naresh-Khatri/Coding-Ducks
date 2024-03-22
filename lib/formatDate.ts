// function to format timestamp into dd month yyyy
export const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

//function to format timestamp into HH:MM:SS
export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  const seconds =
    date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
  return `${hours}:${minutes}:${seconds}`;
};

// function to get time ago
export const getTimeAgo = (timestamp: Date) => {
  const now = new Date();
  const then = new Date(timestamp);
  const secDiff = (now.getTime() - then.getTime()) / 1000;

  if (secDiff < 30) {
    return "just now";
  } else if (secDiff < 45) {
    return "a few seconds ago";
  } else if (secDiff < 90) {
    return "a minute ago";
  } else if (secDiff < 2700) {
    return `${Math.floor(secDiff / 60)}m ago`;
  } else if (secDiff < 5400) {
    return "an hour ago";
  } else if (secDiff < 86400) {
    return `${Math.floor(secDiff / 3600)}h ago`;
  } else if (secDiff < 172800) {
    return "a day ago";
  } else if (secDiff < 2592000) {
    return `${Math.floor(secDiff / 86400)}d ago`;
  } else if (secDiff < 5184000) {
    return "a month ago";
  } else if (secDiff < 31104000) {
    return `${Math.floor(secDiff / 2592000)} months ago`;
  } else if (secDiff < 62208000) {
    return "a year ago";
  } else {
    return `${Math.floor(secDiff / 31104000)}y ago`;
  }
};
