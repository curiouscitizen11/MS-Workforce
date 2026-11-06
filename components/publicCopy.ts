/**
 * Public-site copy that must stay identical wherever it appears.
 * The live site does not publish a different set of hours, so this is the one reply promise.
 */
export const REPLY_SLA =
  "We reply within one business hour, Monday to Friday, 6am–5pm (Sydney time).";

/** Client booking path. These three sentences are the public steps. */
export const BOOKING_STEPS = [
  "Tell us the roles, dates, site and tickets needed.",
  "We confirm available people, tickets and the rate.",
  "You approve before anyone is dispatched.",
] as const;

export const RATE_LINES = [
  "The client rate covers the worker's pay, super, workers compensation cover, payroll on-costs and our margin.",
  "Exact quotes stay on the booking form, by email, or when you call.",
  "We do not publish charge-out rates.",
] as const;

export const WORKER_PAY_LINES = [
  "Weekly pay.",
  "Casual employees are paid the relevant Fair Work award rate plus casual loading, plus super.",
  "White Card is required for construction sites.",
] as const;
