package com.rovexo.app.home.data

import com.rovexo.app.demand.DemandJson
import com.rovexo.app.home.model.HomeFeedPage
import com.rovexo.app.home.model.HomeListing
import org.json.JSONArray
import org.json.JSONObject

object HomeFeedParser {
    fun parse(json: String): HomeFeedPage? {
        val root = try {
            JSONObject(json)
        } catch (_: Exception) {
            return null
        }
        if (!root.has("items") || root.isNull("items")) return null
        val itemsNode = root.opt("items")
        if (itemsNode !is JSONArray) return null
        val page = root.optInt("page", Int.MIN_VALUE)
        if (page < 1) return null
        val hasMore = root.optBoolean("hasMore", false)
        val items = ArrayList<HomeListing>(itemsNode.length())
        for (index in 0 until itemsNode.length()) {
            val raw = itemsNode.optJSONObject(index) ?: continue
            val listing = parseItem(raw) ?: continue
            items.add(listing)
        }
        return HomeFeedPage(items = items, page = page, hasMore = hasMore)
    }

    private fun parseItem(obj: JSONObject): HomeListing? {
        val id = obj.optString("id").trim()
        val slug = obj.optString("slug").trim()
        val title = obj.optString("title").trim()
        val price = finiteDouble(obj, "price")
        if (id.isEmpty() || slug.isEmpty() || title.isEmpty() || price == null) {
            return null
        }
        return HomeListing(
            id = id,
            slug = slug,
            title = title,
            price = price,
            condition = optionalString(obj, "condition"),
            sellerName = optionalString(obj, "sellerName"),
            sellerId = optionalString(obj, "sellerId"),
            sellerUsername = optionalString(obj, "sellerUsername"),
            sellerAvatar = optionalString(obj, "sellerAvatar"),
            sellerVerified = obj.optBoolean("sellerVerified", false),
            rating = finiteDouble(obj, "rating") ?: 0.0,
            reviewCount = obj.optInt("reviewCount", 0).coerceAtLeast(0),
            views = optionalInt(obj, "views"),
            likes = optionalInt(obj, "likes"),
            imageUrl = obj.optString("imageUrl").trim(),
            imageFullUrl = obj.optString("imageFullUrl").trim(),
            isFeatured = obj.optBoolean("isFeatured", false),
            isBumped = obj.optBoolean("isBumped", false),
            promotionScore = finiteDouble(obj, "promotionScore"),
            homepagePriorityScore = finiteDouble(obj, "homepagePriorityScore"),
            categoryId = optionalString(obj, "categoryId"),
            shippingPrice = finiteDouble(obj, "shippingPrice"),
            freeDelivery = obj.optBoolean("freeDelivery", false),
            stock = optionalInt(obj, "stock"),
            size = optionalString(obj, "size"),
            isSaved = false,
            demandEligibility = DemandJson.parse(obj),
        )
    }

    fun parseSavedSlugs(json: String): Set<String>? {
        val root = try {
            JSONObject(json)
        } catch (_: Exception) {
            return null
        }
        if (!root.has("items") || root.isNull("items")) return null
        val itemsNode = root.opt("items")
        if (itemsNode !is JSONArray) return null
        val slugs = HashSet<String>(itemsNode.length())
        for (index in 0 until itemsNode.length()) {
            val raw = itemsNode.optJSONObject(index) ?: continue
            val slug = raw.optString("productSlug").trim()
            if (slug.isNotEmpty()) slugs.add(slug)
        }
        return slugs
    }

    fun parseSaveAccepted(json: String): Boolean {
        val root = try {
            JSONObject(json)
        } catch (_: Exception) {
            return false
        }
        return root.optBoolean("saved", false)
    }

    private fun optionalString(obj: JSONObject, key: String): String? {
        if (!obj.has(key) || obj.isNull(key)) return null
        val value = obj.optString(key).trim()
        return value.ifEmpty { null }
    }

    private fun optionalInt(obj: JSONObject, key: String): Int? {
        if (!obj.has(key) || obj.isNull(key)) return null
        return obj.optInt(key)
    }

    private fun finiteDouble(obj: JSONObject, key: String): Double? {
        if (!obj.has(key) || obj.isNull(key)) return null
        val value = obj.optDouble(key, Double.NaN)
        return if (value.isFinite()) value else null
    }
}
