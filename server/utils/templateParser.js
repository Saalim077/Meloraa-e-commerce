/**
 * Parses an HTML template and replaces {{variable}} placeholders with actual data.
 * @param {string} template - The HTML template string.
 * @param {object} data - The data object containing variables.
 * @returns {string} - The parsed HTML string.
 */
const parseTemplate = (template, data) => {
  if (!template) return '';
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const keys = key.trim().split('.');
    let value = data;
    for (const k of keys) {
      if (value && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        value = match; // Keep the placeholder if variable not found
        break;
      }
    }
    return value;
  });
};

module.exports = { parseTemplate };
