export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
