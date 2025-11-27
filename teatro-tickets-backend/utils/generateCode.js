import crypto from 'crypto';

export function generateTicketCode() {
  return 'T-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}
