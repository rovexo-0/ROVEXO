package com.rovexo.app.ui.home.components

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class HomeListingCardPresentationContractTest {
    private val card = File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt").readText()
    private val strings = File("src/main/res/values/strings.xml").readText()

    @Test
    fun existsExactlyOnce() {
        assertTrue(File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCardV2.kt").exists())
        assertEquals(1, Regex("fun HomeListingCard\\(").findAll(card).count())
    }

    @Test
    fun rendersCanonicalMarketplaceFields() {
        assertTrue(card.contains("listing.title"))
        assertTrue(card.contains("GbpMoneyFormat.format(listing.price)"))
        assertTrue(card.contains("ListingCardPricing.formatInclLabel"))
        assertTrue(card.contains("preferredImageUrl()"))
        assertTrue(card.contains("fallbackImageUrl()"))
        assertTrue(card.contains("AsyncImage"))
        assertTrue(card.contains("aspectRatio(4f / 5f)"))
        assertTrue(card.contains("maxLines = 1"))
        assertTrue(card.contains("TextOverflow.Ellipsis"))
        assertTrue(card.contains("onToggleSave"))
        assertTrue(card.contains("onOpenListing"))
        assertTrue(card.contains("onOpenListing(listing.slug)"))
        assertTrue(card.contains("onToggleSave(listing.slug)"))
        assertTrue(card.contains("ic_heart_outline"))
        assertTrue(card.contains("ic_heart_filled"))
        assertTrue(card.contains("listing.isSaved"))
        assertTrue(card.contains("ic_listing_incl_shield"))
        assertTrue(card.contains("isFeatured"))
        assertTrue(card.contains("isBumped"))
        assertTrue(File("src/main/res/drawable/ic_heart_outline.xml").exists())
        assertTrue(File("src/main/res/drawable/ic_heart_filled.xml").exists())
        assertTrue(File("src/main/res/drawable/ic_listing_incl_shield.xml").exists())
        assertTrue(strings.contains("home_listing_save"))
    }

    @Test
    fun omitsForbiddenCardMetadata() {
        assertFalse(card.contains("listing.sellerLabel()"))
        assertFalse(card.contains("listing.rating"))
        assertFalse(card.contains("listing.reviewCount"))
        assertFalse(card.contains("formatRatingLabel"))
        assertFalse(card.contains("listing.likes"))
        assertFalse(card.contains("visibleSaveCount"))
        assertFalse(card.contains("saveCount"))
        assertFalse(card.contains("location"))
        assertFalse(card.contains("★"))
        assertFalse(card.contains("⭐"))
        assertFalse(card.contains("5.5%"))
        assertFalse(card.contains("platform fee", ignoreCase = true))
        assertFalse(card.contains("Buyer fee"))
        assertFalse(card.contains("fee", ignoreCase = true))
        assertTrue(card.contains("DemandBadge.COPY"))
        assertTrue(card.contains("DemandJson.showsBadge(listing.demandEligibility)"))
        assertFalse(card.contains("/api/saved"))
        assertFalse(card.contains("seedDemo"))
        assertFalse(card.contains("/_next/image"))
        assertFalse(card.contains("placeholder-product.svg"))
        assertFalse(card.contains("Glide"))
        assertFalse(card.contains("FavoritesRepository"))
        assertFalse(card.contains("if (category"))
    }

    @Test
    fun unsavedUsesOutlineHeartAndSavedUsesFilledHeart() {
        assertTrue(card.contains("if (saved) R.drawable.ic_heart_filled else R.drawable.ic_heart_outline"))
        assertTrue(card.contains("if (saved) R.string.home_listing_unsave else R.string.home_listing_save"))
    }

    @Test
    fun sizeIsDisplayedOnlyWhenPresent() {
        assertEquals("UK 4.5", listingMetaLine("UK 4.5", null))
        assertEquals("UK 4.5", listingMetaLine("UK 4.5", "  "))
        assertEquals("", listingMetaLine(null, null))
        assertEquals("", listingMetaLine("  ", null))
        assertEquals("128GB", listingMetaLine("128GB", null))
    }

    @Test
    fun conditionIsDisplayedOnlyWhenPresent() {
        assertEquals("New with tags", listingMetaLine(null, "New with tags"))
        assertEquals("New without tags", listingMetaLine(null, "New without tags"))
        assertEquals("Like New", listingMetaLine(null, "Like New"))
        assertEquals("", listingMetaLine(null, null))
        assertEquals("", listingMetaLine(null, "  "))
        assertEquals("", listingMetaLine(null, "unknown"))
        assertEquals("Like new", humanizeListingCondition("like_new"))
        assertEquals("New with tags", humanizeListingCondition("New with tags"))
    }

    @Test
    fun combinedSizeAndConditionUsesDotOnlyWhenBothExist() {
        assertEquals("UK 4.5 · New with tags", listingMetaLine("UK 4.5", "New with tags"))
        assertEquals("UK 4.5", listingMetaLine("UK 4.5", null))
        assertEquals("New with tags", listingMetaLine(null, "New with tags"))
        assertEquals("128GB · Good", listingMetaLine("128GB", "Good"))
        assertEquals("", listingMetaLine(null, null))
        assertFalse(listingMetaLine("UK 4.5", null).contains(" · "))
        assertFalse(listingMetaLine(null, "New with tags").contains(" · "))
    }
}
