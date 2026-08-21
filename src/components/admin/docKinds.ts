/** Which document the admin is building. Kept in its own module so the chooser
 *  and the page can share the type without importing either builder. */
export type DocKind = 'proposal' | 'commercial' | 'inspection' | 'quotes';

/** Remembers the last-picked document across a reload, so a mid-draft refresh
 *  lands back in the same builder instead of the chooser. */
export const LAST_DOC_KEY = 'scpp_admin_last_doc';
