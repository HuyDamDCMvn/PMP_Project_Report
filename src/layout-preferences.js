const KEY = 'pmp-layout-preferences-v1';
const AXES = ['familyAxisStep', 'uploadAxisStep', 'hoursAxisStep', 'effortAxisStep', 'issueAxisStep'];

export function restoreLayout(state, storage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY) || '{}');
    if (!saved || typeof saved !== 'object') return;
    if (['tidp', 'overview', 'team'].includes(saved.page)) state.page = saved.page;
    if (saved.collapsed && typeof saved.collapsed === 'object' && !Array.isArray(saved.collapsed)) {
      state.collapsed = Object.fromEntries(Object.entries(saved.collapsed).filter(([, value]) => typeof value === 'boolean'));
    }
    for (const key of AXES) if (Number.isFinite(saved[key]) && saved[key] > 0) state[key] = saved[key];
    if (Array.isArray(saved.hiddenErrorSeries)) state.hiddenErrorSeries = saved.hiddenErrorSeries.filter(value => typeof value === 'string');
    if (typeof saved.showIssueLabels === 'boolean') state.showIssueLabels = saved.showIssueLabels;
  } catch { /* Corrupt or unavailable storage keeps the default layout usable. */ }
}

export function saveLayout(state, storage) {
  try {
    const keys = ['page', 'collapsed', ...AXES, 'hiddenErrorSeries', 'showIssueLabels'];
    storage.setItem(KEY, JSON.stringify(Object.fromEntries(keys.map(key => [key, state[key]]))));
  } catch { /* Current-session layout still works when storage is unavailable. */ }
}
