/**
 * The words a customer reads when they decline, and the words you read after.
 *
 * The KEYS are mirrored in functions/api/_quotes.ts (DECLINE_REASONS) because a
 * Pages Function cannot import from src/. Only the keys have to agree — the
 * labels live here, next to the screen that renders them.
 *
 * WHY PRESETS AT ALL. Almost nobody writes a paragraph explaining why they went
 * elsewhere. A great many will tap one of six words on the way out, and a fixed
 * set is the only version of this that can be counted: "four of the last ten
 * said price" is an instruction, where ten paragraphs are an afternoon's
 * reading. The free-text box stays, optional, underneath — occasionally it is
 * the most valuable sentence anyone writes about the business all month.
 *
 * The customer labels are written in the FIRST PERSON and kept blameless. A
 * customer doing you the favour of explaining should not have to click a
 * sentence that sounds like an accusation, or like a form they are failing.
 */

export type DeclineReasonKey =
  | 'price'
  | 'competitor'
  | 'timing'
  | 'diy'
  | 'scope'
  | 'no_longer_needed'
  | 'other';

export type DeclineReasonMeta = {
  key: DeclineReasonKey;
  /** What the customer taps. */
  label: string;
  /** What you see in the quotes list. Shorter, and written for scanning. */
  adminLabel: string;
  /**
   * Whether this is a quote worth going back to.
   *
   * Price and timing are the two that are genuinely recoverable — one is a
   * conversation about a lower frequency, the other is a callback. Marking them
   * is what stops the declined pile becoming another bucket nothing leaves.
   */
  recoverable: boolean;
};

export const DECLINE_REASONS: DeclineReasonMeta[] = [
  {
    key: 'price',
    label: 'It’s more than I wanted to spend',
    adminLabel: 'Price',
    recoverable: true,
  },
  {
    key: 'timing',
    label: 'The timing isn’t right just now',
    adminLabel: 'Timing',
    recoverable: true,
  },
  {
    key: 'competitor',
    label: 'I’m going with another company',
    adminLabel: 'Went elsewhere',
    recoverable: false,
  },
  {
    key: 'diy',
    label: 'I’ve decided to look after it myself',
    adminLabel: 'Doing it themselves',
    recoverable: false,
  },
  {
    key: 'scope',
    label: 'It isn’t quite the service I need',
    adminLabel: 'Scope wrong',
    recoverable: true,
  },
  {
    key: 'no_longer_needed',
    label: 'I don’t need it any more',
    adminLabel: 'No longer needed',
    recoverable: false,
  },
  {
    key: 'other',
    label: 'Something else',
    adminLabel: 'Other',
    recoverable: false,
  },
];

export const declineMeta = (key: string | null | undefined): DeclineReasonMeta | undefined =>
  DECLINE_REASONS.find((r) => r.key === key);

/**
 * What to say back, per reason.
 *
 * A decline screen that just says "thanks" wastes the only moment the customer
 * is still paying attention. Two of these reasons are recoverable, so the reply
 * to those leaves a door open — without arguing, because arguing with someone
 * who has already decided is how you turn a soft no into a hard one.
 */
export const declineReply = (key: DeclineReasonKey): string => {
  switch (key) {
    case 'price':
      return 'Understood, and thank you for saying so — that’s genuinely useful. If it helps, we can look at a less frequent schedule that costs less; just reply to the email and ask.';
    case 'timing':
      return 'That’s no problem at all. The link stays live, so this quote is here whenever you’re ready — and you’re welcome to ask us to check back nearer the time.';
    case 'scope':
      return 'Thank you — that’s worth knowing. If you tell us what you were after, we’ll happily requote it properly rather than guess.';
    case 'competitor':
      return 'Thanks for letting us know, and good luck with it. If anything changes down the line, we’d be glad to hear from you.';
    case 'diy':
      return 'Fair enough — plenty of people do. If you ever want a hand with the awkward parts, we’re here.';
    case 'no_longer_needed':
      return 'Thanks for closing the loop — that saves us chasing you, which we appreciate.';
    default:
      return 'Thank you for letting us know. It genuinely helps us to hear it either way.';
  }
};
