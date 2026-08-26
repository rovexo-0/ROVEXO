package com.rovexo.app.demand

import com.rovexo.app.home.data.HomeFeedParser
import com.rovexo.app.listing.data.ListingDetailParser
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class DemandNativeTest {
    @Test
    fun eligibleShowsBadge() {
        val eligibility = DemandJson.parse(JSONObject("""{"demand":{"eligible":true}}"""))
        assertEquals(DemandEligibility.ELIGIBLE, eligibility)
        assertTrue(DemandJson.showsBadge(eligibility))
        assertEquals("🔥 In demand", DemandBadge.COPY)
    }

    @Test
    fun notEligibleShowsNoBadge() {
        val eligibility = DemandJson.parse(JSONObject("""{"demand":{"eligible":false}}"""))
        assertEquals(DemandEligibility.NOT_ELIGIBLE, eligibility)
        assertFalse(DemandJson.showsBadge(eligibility))
    }

    @Test
    fun unknownShowsNoBadge() {
        val eligibility = DemandJson.parse(JSONObject("""{"demand":{}}"""))
        assertEquals(DemandEligibility.UNKNOWN, eligibility)
        assertFalse(DemandJson.showsBadge(eligibility))
        assertFalse(DemandJson.showsBadge(DemandEligibility.UNKNOWN))
    }

    @Test
    fun errorShowsNoBadge() {
        val eligibility = DemandJson.parse(JSONObject("""{"demand":"broken"}"""))
        assertEquals(DemandEligibility.ERROR, eligibility)
        assertFalse(DemandJson.showsBadge(eligibility))
        val malformed = DemandJson.parse(JSONObject("""{"demand":{"eligible":{}}}"""))
        assertEquals(DemandEligibility.ERROR, malformed)
        assertFalse(DemandJson.showsBadge(malformed))
    }

    @Test
    fun missingShowsNoBadge() {
        val eligibility = DemandJson.parse(JSONObject("""{"id":"listing-1"}"""))
        assertEquals(DemandEligibility.MISSING, eligibility)
        assertFalse(DemandJson.showsBadge(eligibility))
        val nullDemand = DemandJson.parse(JSONObject("""{"demand":null}"""))
        assertEquals(DemandEligibility.MISSING, nullDemand)
        assertFalse(DemandJson.showsBadge(nullDemand))
    }

    @Test
    fun unavailableShowsNoBadge() {
        assertFalse(DemandJson.showsBadge(DemandEligibility.UNAVAILABLE))
    }

    @Test
    fun homeListingCardUsesExactCopyOnlyWhenEligible() {
        val card = File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt").readText()
        assertTrue(card.contains("DemandBadge.COPY"))
        assertTrue(card.contains("DemandJson.showsBadge(listing.demandEligibility)"))
        assertTrue(card.contains("inDemand"))
        assertEquals("🔥 In demand", DemandBadge.COPY)
        assertFalse(card.contains("DemandListingCard"))
        assertFalse(card.contains("HomeListingCardV2"))
    }

    @Test
    fun listingDetailUsesExactCopyOnlyWhenEligible() {
        val screen = File("src/main/java/com/rovexo/app/ui/listing/ListingDetailScreen.kt").readText()
        assertTrue(screen.contains("DemandBadge.COPY"))
        assertTrue(screen.contains("DemandJson.showsBadge(listing.demandEligibility)"))
        val content = screen.substring(
            screen.indexOf("private fun ListingDetailContent"),
            screen.indexOf("private fun ListingGallery"),
        )
        assertTrue(content.indexOf("listing.title") < content.indexOf("DemandBadge.COPY"))
        assertTrue(content.indexOf("DemandBadge.COPY") < content.indexOf("GbpMoneyFormat.format(listing.price)"))
        assertEquals("🔥 In demand", DemandBadge.COPY)
    }

    @Test
    fun noScoreRankingOrMessagesSignal() {
        val demand = File("src/main/java/com/rovexo/app/demand/DemandResult.kt").readText()
        val card = File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt").readText()
        val screen = File("src/main/java/com/rovexo/app/ui/listing/ListingDetailScreen.kt").readText()
        listOf(demand, card, screen).forEach { source ->
            assertFalse(source.contains("demandScore"))
            assertFalse(source.contains("ranking"))
            assertFalse(source.contains("OFFER_THRESHOLD"))
            assertFalse(source.contains("FAVOURITE_THRESHOLD"))
            assertFalse(source.contains("QUALIFIED_VIEW_THRESHOLD"))
            assertFalse(source.contains("DEMAND_WINDOW"))
        }
        assertFalse(demand.contains("messagesEnabled"))
        assertFalse(demand.contains("MESSAGES_ENABLED"))
        assertFalse(demand.contains("getBoolean"))
        assertTrue(demand.contains("Does not evaluate thresholds"))
    }

    @Test
    fun eligibleAcceptsOnlyJsonBoolean() {
        assertEquals(
            DemandEligibility.ELIGIBLE,
            DemandJson.parse(JSONObject("""{"demand":{"eligible":true}}""")),
        )
        assertTrue(DemandJson.showsBadge(DemandJson.parse(JSONObject("""{"demand":{"eligible":true}}"""))))
        assertEquals(
            DemandEligibility.NOT_ELIGIBLE,
            DemandJson.parse(JSONObject("""{"demand":{"eligible":false}}""")),
        )
        assertFalse(DemandJson.showsBadge(DemandJson.parse(JSONObject("""{"demand":{"eligible":false}}"""))))

        val stringTrue = DemandJson.parse(JSONObject("""{"demand":{"eligible":"true"}}"""))
        assertEquals(DemandEligibility.ERROR, stringTrue)
        assertFalse(DemandJson.showsBadge(stringTrue))

        val stringFalse = DemandJson.parse(JSONObject("""{"demand":{"eligible":"false"}}"""))
        assertEquals(DemandEligibility.ERROR, stringFalse)
        assertFalse(DemandJson.showsBadge(stringFalse))

        val numberOne = DemandJson.parse(JSONObject("""{"demand":{"eligible":1}}"""))
        assertEquals(DemandEligibility.ERROR, numberOne)
        assertFalse(DemandJson.showsBadge(numberOne))

        val numberZero = DemandJson.parse(JSONObject("""{"demand":{"eligible":0}}"""))
        assertEquals(DemandEligibility.ERROR, numberZero)
        assertFalse(DemandJson.showsBadge(numberZero))

        val eligibleNull = DemandJson.parse(JSONObject("""{"demand":{"eligible":null}}"""))
        assertEquals(DemandEligibility.UNKNOWN, eligibleNull)
        assertFalse(DemandJson.showsBadge(eligibleNull))

        val missing = DemandJson.parse(JSONObject("""{"id":"listing-1"}"""))
        assertEquals(DemandEligibility.MISSING, missing)
        assertFalse(DemandJson.showsBadge(missing))

        val malformed = DemandJson.parse(JSONObject("""{"demand":{"eligible":{}}}"""))
        assertEquals(DemandEligibility.ERROR, malformed)
        assertFalse(DemandJson.showsBadge(malformed))
    }

    @Test
    fun saveBehaviourUnchangedAndNoDuplicateEngine() {
        val card = File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt").readText()
        val saved = File("src/main/java/com/rovexo/app/home/data/HomeFeedRepository.kt").readText()
        val mapper = File("src/main/java/com/rovexo/app/saved/SavedListingMapper.kt").readText()
        assertTrue(card.contains("onToggleSave(listing.slug)"))
        assertTrue(card.contains("private fun SaveHeartButton("))
        assertTrue(card.contains("listing.isSaved"))
        assertTrue(saved.contains("fun saveListing("))
        assertTrue(saved.contains("fun unsaveListing("))
        assertFalse(mapper.contains("DemandEngine"))
        assertFalse(File("src/main/java/com/rovexo/app/demand/DemandEngine.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/demand/DemandEngineV2.kt").exists())
        assertEquals(1, File("src/main/java/com/rovexo/app/demand").listFiles()?.count { it.extension == "kt" })
    }

    @Test
    fun parsersConsumeDemandWithoutCalculatingThresholds() {
        val feed = HomeFeedParser.parse(
            """{"page":1,"hasMore":false,"items":[{"id":"1","slug":"s","title":"Bag","price":1,"demand":{"eligible":true}}]}""",
        )!!
        assertEquals(DemandEligibility.ELIGIBLE, feed.items.single().demandEligibility)
        val missing = HomeFeedParser.parse(
            """{"page":1,"hasMore":false,"items":[{"id":"1","slug":"s","title":"Bag","price":1}]}""",
        )!!
        assertEquals(DemandEligibility.MISSING, missing.items.single().demandEligibility)
        val detail = ListingDetailParser.parse(
            """{"listing":{"id":"1","slug":"s","title":"Bag","price":1,"sellerId":"seller","demand":{"eligible":false}}}""",
        )!!
        assertEquals(DemandEligibility.NOT_ELIGIBLE, detail.demandEligibility)
        assertFalse(DemandJson.showsBadge(detail.demandEligibility))
    }
}
