// extracts the npm-shipped chromium once so the config can use a fixed path
module.exports = async () => {
  const spart = require('@sparticuz/chromium').default;
  const p = await spart.executablePath();
  process.env.FW_CHROMIUM = p;
};
