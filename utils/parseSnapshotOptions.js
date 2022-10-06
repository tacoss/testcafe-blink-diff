const OPTIONS_SEPARATOR = ',';
const KEY_VALUE_SEPARATOR = '=';
const DEFAULT_OPTIONS = { as: 'base' };

module.exports.parseSnapshotOptions = (optionsStr = '') => {
  if (typeof optionsStr !== 'string' || optionsStr.trim() === '') {
    return { ...DEFAULT_OPTIONS };
  }
  const parsed = optionsStr.trim()
    .split(OPTIONS_SEPARATOR)
    .map(keyValueString => keyValueString.split(KEY_VALUE_SEPARATOR))
    .map(([key, value]) => {
      return value && value.trim().length ? { [key]: value.trim() } : key.trim();
    });
  if (parsed.length === 1 && typeof parsed[0] === 'string') {
    return parsed[0].match(/^[a-z\d_]/) ? { as: parsed[0] } : { ...DEFAULT_OPTIONS };
  }
  return {
    ...DEFAULT_OPTIONS,
    ...parsed.reduce((acc, cur) => {
      if (cur.quality && !isNaN(cur.quality)) {
        cur.quality = parseInt(cur.quality, 10);
        acc = { ...acc, ...cur };
      } else if (cur.mw && !isNaN(cur.mw)) {
        cur.mw = parseInt(cur.mw, 10);
        acc = { ...acc, ...cur };
      } else if (cur.mh && !isNaN(cur.mh)) {
        cur.mh = parseInt(cur.mh, 10);
        acc = { ...acc, ...cur };
      } else if (cur.as && cur.as.match(/^[a-z\d_]/)) {
        acc = { ...acc, ...cur };
      }
      return acc;
    }, {}),
  };
};
