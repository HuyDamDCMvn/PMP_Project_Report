// Definitions describe source labels; they do not infer a new defect classification.
export const legendDefinitions = {
  'One pass': 'Family with source Rework_Outcome = One_pass; no return recorded.',
  Returned: 'Family with source Rework_Outcome = Returned; returned for rework.',
  Uploaded: 'Family in the TIDP scope linked to a project upload.',
  'Not Yet Upload': 'Family in the TIDP scope without a linked upload at the snapshot; this does not prove the Family does not exist.',
  Positive: 'Ticket classified as Positive, including Re-Assessment under the project rule.',
  Negative: 'Ticket with source Active = Negative.',
  'Uploaded Families': 'Distinct Families uploaded each week by End Date, including One pass and Returned.',
  Graphics_2D_Visibility: 'Incorrect 2D graphics or visibility: required views are not enabled, LOD thumbnails are crossed out, symbols do not match, line styles or Object Styles are incorrect, or visibility settings are wrong.',
  'Ticket Missing Meta Data': 'Missing ticket information required for audit: the RFA link is incorrect, or metadata or checklist information is missing, so the Family cannot yet be checked.',
  Category_Template_Structure: 'Incorrect category, subcategory or template structure: a detail item is still classified as Generic Models, a required subcategory has not been created, a nested category is incorrect, or detail-item annotation is missing.',
  Family_Naming_Convention: 'Family naming does not follow the required convention: the connection type is missing, a nested detail item does not follow the 400_DI_… naming format, or the name does not match the LOD file or library.',
  Other_Unclear: 'A return that cannot be classified into any of the other eight error categories.',
  Parameter_Naming: 'Incorrect parameters: required parameters are missing, parameter names are wrong, a parameter that should be instance-based is set as a type parameter, or IFC, keynote or manufacturer values are blank.',
  Geometry_Dimensions: 'Incorrect geometry or dimensions: the Family does not resize with the pipe, geometry is missing, or reference planes are incorrectly positioned.',
  Connector_MEP: 'Incorrect MEP connectors: a connector is marked with a red circle, connector parameters are not linked, or the connector direction or position does not match.',
  RevitVersion_File_Upload: 'The uploaded file uses the wrong Revit version.',
};

export function renderLegendDefinitions(items, escapeHtml, fallback) {
  return `<h3>Legend definitions</h3><dl>${items.map(item => `<dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(legendDefinitions[item.label] || fallback(item))}</dd>`).join('')}</dl>`;
}
