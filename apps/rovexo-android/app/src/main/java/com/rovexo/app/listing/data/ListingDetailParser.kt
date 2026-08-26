package com.rovexo.app.listing.data

import com.rovexo.app.demand.DemandJson
import com.rovexo.app.listing.model.PublicListingDetail
import org.json.JSONArray
import org.json.JSONObject

object ListingDetailParser {
    fun parse(json: String): PublicListingDetail? {
        val root = try {
            JSONObject(json)
        } catch (_: Exception) {
            return null
        }
        val listing = root.optJSONObject("listing") ?: return null
        val id = listing.optString("id").trim()
        val slug = listing.optString("slug").trim()
        val title = listing.optString("title").trim()
        val price = finiteDouble(listing, "price")
        val sellerId = listing.optString("sellerId").trim()
        if (id.isEmpty() || slug.isEmpty() || title.isEmpty() || price == null || sellerId.isEmpty()) {
            return null
        }
        return PublicListingDetail(
            id = id,
            slug = slug,
            title = title,
            description = listing.optString("description").trim(),
            price = price,
            originalPrice = finiteDouble(listing, "originalPrice"),
            condition = listing.optString("condition").trim(),
            brand = optionalString(listing, "brand"),
            colour = optionalString(listing, "colour"),
            material = optionalString(listing, "material"),
            size = optionalString(listing, "size"),
            images = stringList(listing.optJSONArray("images")),
            imageUrl = listing.optString("imageUrl").trim(),
            views = listing.optInt("views", 0).coerceAtLeast(0),
            rating = finiteDouble(listing, "rating") ?: 0.0,
            reviewCount = listing.optInt("reviewCount", 0).coerceAtLeast(0),
            sellerId = sellerId,
            sellerName = listing.optString("sellerName").trim().ifEmpty { "Seller" },
            sellerUsername = optionalString(listing, "sellerUsername"),
            sellerAvatar = optionalString(listing, "sellerAvatar"),
            sellerVerified = listing.optBoolean("sellerVerified", false),
            sellerRating = finiteDouble(listing, "sellerRating"),
            sellerReviewCount = optionalInt(listing, "sellerReviewCount"),
            sellerOnHoliday = listing.optBoolean("sellerOnHoliday", false),
            listingType = optionalString(listing, "listingType"),
            acceptOffers = listing.optBoolean("acceptOffers", false),
            transactionMode = listing.optString("transactionMode").trim().ifEmpty { "MARKETPLACE" },
            categoryId = optionalString(listing, "categoryId"),
            createdAt = optionalString(listing, "createdAt"),
            stock = listing.optInt("stock", 0).coerceAtLeast(0),
            availability = listing.optString("availability").trim().ifEmpty { "in_stock" },
            status = optionalString(listing, "status"),
            freeDelivery = listing.optBoolean("freeDelivery", false),
            shippingPrice = finiteDouble(listing, "shippingPrice"),
            deliveryCarriers = stringList(listing.optJSONArray("deliveryCarriers")),
            salesCount = listing.optInt("salesCount", 0).coerceAtLeast(0),
            isFeatured = listing.optBoolean("isFeatured", false),
            isBumped = listing.optBoolean("isBumped", false),
            dispatchTimeDays = optionalPositiveInt(listing, "dispatchTimeDays"),
            categoryLabel = lastBreadcrumbName(listing),
            demandEligibility = DemandJson.parse(listing),
        )
    }

    private fun lastBreadcrumbName(listing: JSONObject): String? {
        val crumbs = listing.optJSONArray("categoryBreadcrumbs") ?: return null
        if (crumbs.length() <= 0) return null
        val last = crumbs.optJSONObject(crumbs.length() - 1) ?: return null
        return optionalString(last, "name") ?: optionalString(last, "label")
    }

    private fun optionalString(obj: JSONObject, key: String): String? {
        if (!obj.has(key) || obj.isNull(key)) return null
        val value = obj.optString(key).trim()
        return value.takeIf { it.isNotEmpty() }
    }

    private fun optionalInt(obj: JSONObject, key: String): Int? {
        if (!obj.has(key) || obj.isNull(key)) return null
        return obj.optInt(key, Int.MIN_VALUE).takeIf { it != Int.MIN_VALUE }?.coerceAtLeast(0)
    }

    private fun optionalPositiveInt(obj: JSONObject, key: String): Int? {
        return optionalInt(obj, key)?.takeIf { it > 0 }
    }

    private fun finiteDouble(obj: JSONObject, key: String): Double? {
        if (!obj.has(key) || obj.isNull(key)) return null
        val value = obj.optDouble(key, Double.NaN)
        return value.takeIf { it.isFinite() }
    }

    private fun stringList(array: JSONArray?): List<String> {
        if (array == null) return emptyList()
        val values = ArrayList<String>(array.length())
        for (index in 0 until array.length()) {
            val value = array.optString(index).trim()
            if (value.isNotEmpty()) values.add(value)
        }
        return values
    }
}
