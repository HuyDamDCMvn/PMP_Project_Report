export const PUBLISHED_DATA_URL = 'https://huydamdcmvn.github.io/PMP_Project_Report/data/';

export async function fetchPublishedData(fetcher = fetch, base = PUBLISHED_DATA_URL) {
  const stamp = Date.now();
  const files = ['dashboard-data.json', 'family-role-hours.json', 'weekly-hours.json'];
  const [data, familyRoleHours, timeHistory] = await Promise.all(files.map(async file => {
    const response = await fetcher(`${base}${file}?refresh=${stamp}`, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Could not download ${file} (${response.status}).`);
    return response.json();
  }));
  if (!data?.meta?.asOf || !Array.isArray(data.families) || !Array.isArray(data.tickets) || !Array.isArray(data.deliverables)) throw new Error('Published dashboard data is invalid.');
  if (!familyRoleHours?.meta || !timeHistory?.meta) throw new Error('Published supplemental data is invalid.');
  return { data, familyRoleHours, timeHistory };
}
