package com.rovexo.app.home.model

import com.rovexo.app.demand.DemandEligibility

data class HomeListing(
    val id: String,
    val slug: String,
    val title: String,
    val price: Double,
    val condition: String?,
    val sellerName: String?,
    val sellerId: String?,
    val sellerUsername: String?,
    val sellerAvatar: String?,
    val sellerVerified: Boolean,
    val rating: Double,
    val reviewCount: Int,
    val views: Int?,
    val likes: Int?,
    val imageUrl: String,
    val imageFullUrl: String,
    val isFeatured: Boolean,
    val isBumped: Boolean,
    val promotionScore: Double?,
    val homepagePriorityScore: Double?,
    val categoryId: String?,
    val shippingPrice: Double?,
    val freeDelivery: Boolean,
    val stock: Int?,
    val size: String? = null,
    val isSaved: Boolean = false,
    val demandEligibility: DemandEligibility = DemandEligibility.UNKNOWN,
) {
    fun sellerLabel(): String {
        val name = sellerName?.trim().orEmpty()
        if (name.isNotEmpty()) return name
        return sellerUsername?.trim().orEmpty()
    }

    fun preferredImageUrl(): String {
        return imageUrl.trim().ifEmpty { imageFullUrl.trim() }
    }

    fun fallbackImageUrl(): String {
        val thumb = imageUrl.trim()
        val full = imageFullUrl.trim()
        if (thumb.isEmpty()) return ""
        return if (full.isNotEmpty() && full != thumb) full else ""
    }
}

data class HomeFeedPage(
    val items: List<HomeListing>,
    val page: Int,
    val hasMore: Boolean,
)
