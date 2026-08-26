package com.rovexo.app.listing.model

import com.rovexo.app.demand.DemandEligibility

data class PublicListingDetail(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val price: Double,
    val originalPrice: Double?,
    val condition: String,
    val brand: String?,
    val colour: String?,
    val material: String?,
    val size: String?,
    val images: List<String>,
    val imageUrl: String,
    val views: Int,
    val rating: Double,
    val reviewCount: Int,
    val sellerId: String,
    val sellerName: String,
    val sellerUsername: String?,
    val sellerAvatar: String?,
    val sellerVerified: Boolean,
    val sellerRating: Double?,
    val sellerReviewCount: Int?,
    val sellerOnHoliday: Boolean,
    val listingType: String?,
    val acceptOffers: Boolean,
    val transactionMode: String,
    val categoryId: String?,
    val createdAt: String?,
    val stock: Int,
    val availability: String,
    val status: String?,
    val freeDelivery: Boolean,
    val shippingPrice: Double?,
    val deliveryCarriers: List<String>,
    val salesCount: Int,
    val isFeatured: Boolean = false,
    val isBumped: Boolean = false,
    val dispatchTimeDays: Int? = null,
    val categoryLabel: String? = null,
    val demandEligibility: DemandEligibility = DemandEligibility.UNKNOWN,
) {
    fun gallery(): List<String> {
        val fromImages = images.map { it.trim() }.filter { it.isNotEmpty() }
        if (fromImages.isNotEmpty()) return fromImages
        val cover = imageUrl.trim()
        return if (cover.isEmpty()) emptyList() else listOf(cover)
    }
}
