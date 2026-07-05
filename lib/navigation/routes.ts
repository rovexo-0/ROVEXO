/**
 * Canonical application routes — Single Source of Truth.
 *
 * Per the approved v1.0 navigation decision, the ONLY official Business route
 * is `/business/dashboard`. Legacy aliases (e.g. `/business`, `/business/center`)
 * must redirect here rather than render alternative Business surfaces.
 */

/** The one official Business destination. All Business navigation resolves here. */
export const BUSINESS_DASHBOARD_ROUTE = "/business/dashboard";
