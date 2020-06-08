// @flow
const env = require('./config');

export const JOBNAMES = {
  // PUSH_COMMENT: 'send-push-comment',
  // PUSH_FOLLOW: 'send-push-follow',
  // PUSH_ORDER: 'send-push-order',
  // SCHEDULE: 'listing-schedule',
  SYSTEM_MSG: 'send-system-message',
};

export const debug = (...args) => {
  if (env.DEBUG) console.log('debug::: ', ...args);
};
