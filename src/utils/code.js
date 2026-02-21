function randomSegment(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function generateHouseholdCode() {
  return `AS-${randomSegment(4)}-${randomSegment(1)}`;
}

module.exports = {
  generateHouseholdCode,
};
