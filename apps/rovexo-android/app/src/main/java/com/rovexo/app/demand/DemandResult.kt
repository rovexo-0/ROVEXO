package com.rovexo.app.demand

import org.json.JSONObject

/**
 * Native consume-only Demand presentation state.
 * Does not evaluate thresholds, windows, seller exclusion, availability, or score.
 */
enum class DemandEligibility {
    ELIGIBLE,
    NOT_ELIGIBLE,
    UNKNOWN,
    ERROR,
    MISSING,
    UNAVAILABLE,
}

object DemandBadge {
    const val COPY = "🔥 In demand"
}

object DemandJson {
    fun parse(parent: JSONObject): DemandEligibility {
        if (!parent.has("demand")) {
            return DemandEligibility.MISSING
        }
        if (parent.isNull("demand")) {
            return DemandEligibility.MISSING
        }
        val demand = parent.optJSONObject("demand") ?: return DemandEligibility.ERROR
        if (!demand.has("eligible") || demand.isNull("eligible")) {
            return DemandEligibility.UNKNOWN
        }
        return when (val raw = demand.opt("eligible")) {
            is Boolean -> {
                if (raw) DemandEligibility.ELIGIBLE else DemandEligibility.NOT_ELIGIBLE
            }
            else -> DemandEligibility.ERROR
        }
    }

    fun showsBadge(value: DemandEligibility): Boolean {
        return value == DemandEligibility.ELIGIBLE
    }
}
