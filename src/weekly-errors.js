import { familyProductivity, familyOutcome } from './family-outcomes.js';

export const ERROR_SERIES = [
  ['Graphics_2D_Visibility', 'var(--blue)', ''],
  ['Ticket Missing Meta Data', 'var(--green)', '8 4'],
  ['Category_Template_Structure', 'var(--amber)', ''],
  ['Family_Naming_Convention', 'var(--red)', '8 4'],
  ['Other_Unclear', 'var(--brown)', ''],
  ['Parameter_Naming', 'var(--grey)', '4 4'],
  ['Geometry_Dimensions', 'var(--blue)', '2 5'],
  ['Connector_MEP', 'var(--green)', '12 4 2 4'],
  ['RevitVersion_File_Upload', 'var(--amber)', '2 5'],
];
export function weeklyErrors(families, asOf) {
  const { weeks } = familyProductivity(families, [], asOf, { startWeek: 20 });
  return ERROR_SERIES.map(([type, color, dash]) => ({ type, color, dash, weeks: weeks.map(({ key, uploaded }) => {
    const matches = uploaded.filter(f => familyOutcome(f) === 'Returned' && f.reworkErrors?.includes(type));
    return { key, value: matches.length, rows: matches };
  }) }));
}

export function weeklyIssueSeries(families, asOf) {
  const { weeks } = familyProductivity(families, [], asOf, { startWeek: 20 });
  return [{ type: 'Uploaded Families', color: 'var(--ink)', dash: '12 6', unit: 'Families',
    weeks: weeks.map(({ key, uploaded }) => ({ key, value: uploaded.length, rows: uploaded })) },
  ...weeklyErrors(families, asOf).map(s => ({ ...s, unit: 'error flags' }))];
}
