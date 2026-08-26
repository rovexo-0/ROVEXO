package com.rovexo.app.search.data

import com.rovexo.app.demand.DemandJson
import com.rovexo.app.home.model.HomeListing
import com.rovexo.app.search.model.SearchCategoryHit
import com.rovexo.app.search.model.SearchMember
import com.rovexo.app.search.model.SearchPage
import org.json.JSONArray
import org.json.JSONObject

object SearchParser {
    fun parse(json: String): SearchPage? {
        val root = try {
            JSONObject(json)
        } catch (_: Exception) {
            return null
        }
        val products = parseProducts(root.optJSONArray("products"))
        val members = parseMembers(root.optJSONArray("users"))
        val categories = parseCategories(root.optJSONArray("categories"))
        val trending = parseStringList(root.optJSONArray("trending"))
        val popular = parseStringList(root.optJSONArray("popular"))
        return SearchPage(
            products = products,
            members = members,
            categories = categories,
            trending = trending,
            popular = popular,
            productsHasMore = root.optBoolean("productsHasMore", false),
            productsOffset = root.optInt("productsOffset", products.size).coerceAtLeast(0),
        )
    }

    private fun parseProducts(array: JSONArray?): List<HomeListing> {
        if (array == null) return emptyList()
        val items = ArrayList<HomeListing>(array.length())
        for (index in 0 until array.length()) {
            val raw = array.optJSONObject(index) ?: continue
            val listing = parseListing(raw) ?: continue
            items.add(listing)
        }
        return items
    }

    private fun parseMembers(array: JSONArray?): List<SearchMember> {
        if (array == null) return emptyList()
        val items = ArrayList<SearchMember>(array.length())
        for (index in 0 until array.length()) {
            val raw = array.optJSONObject(index) ?: continue
            val id = raw.optString("id").trim()
            val name = raw.optString("name").trim()
            if (id.isEmpty() || name.isEmpty()) continue
            items.add(
                SearchMember(
                    id = id,
                    name = name,
                    handle = raw.optString("handle").trim(),
                    href = raw.optString("href").trim(),
                ),
            )
        }
        return items
    }

    private fun parseCategories(array: JSONArray?): List<SearchCategoryHit> {
        if (array == null) return emptyList()
        val items = ArrayList<SearchCategoryHit>(array.length())
        for (index in 0 until array.length()) {
            val raw = array.optJSONObject(index) ?: continue
            val name = raw.optString("name").trim()
            if (name.isEmpty()) continue
            items.add(
                SearchCategoryHit(
                    name = name,
                    href = raw.optString("href").trim(),
                ),
            )
        }
        return items
    }

    private fun parseStringList(array: JSONArray?): List<String> {
        if (array == null) return emptyList()
        val items = ArrayList<String>(array.length())
        for (index in 0 until array.length()) {
            val value = array.optString(index).trim()
            if (value.isNotEmpty()) items.add(value)
        }
        return items
    }

    private fun parseListing(obj: JSONObject): HomeListing? {
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
