export function buildMapsLink(lat: number, lon: number): string {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

export function buildMapsLinkFromCoords(lat: number, lon: number): string {
  // Also works in Apple Maps on iOS via universal link
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
