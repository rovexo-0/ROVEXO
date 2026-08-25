package com.rovexo.app.home

import com.rovexo.app.auth.InMemorySessionStore
import com.rovexo.app.core.config.AppConfig
import com.rovexo.app.core.config.AppEnvironment
import com.rovexo.app.core.logging.AppLogger
import com.rovexo.app.core.network.NetworkStatusProvider
import com.rovexo.app.core.network.RovexoApiClient
import com.rovexo.app.home.data.HomeFeedPage1Cache
import com.rovexo.app.home.data.HomeFeedParser
import com.rovexo.app.home.data.HomeFeedRepository
import com.rovexo.app.home.model.HomeListing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File

@OptIn(ExperimentalCoroutinesApi::class)
class HomeFeedViewModelTest {
    private val mainDispatcher = UnconfinedTestDispatcher()
    private val ioDispatcher = StandardTestDispatcher()
    private lateinit var server: MockWebServer
    private lateinit var network: MutableHomeNetwork
    private lateinit var repository: HomeFeedRepository

    @Before
    fun setUp() {
        Dispatchers.setMain(mainDispatcher)
        server = MockWebServer()
        server.start()
        network = MutableHomeNetwork(true)
        val base = server.url("/").toString().trimEnd('/')
        val config = AppConfig(
            environment = AppEnvironment.DEVELOPMENT,
            apiBaseUrl = base,
            authBaseUrl = base,
            publishableAuthKey = "public-anon-key",
        )
        val client = RovexoApiClient(
            config = config,
            httpClient = RovexoApiClient.createHttpClient(config),
            sessionStore = InMemorySessionStore(),
            networkMonitor = network,
            logger = AppLogger(AppEnvironment.DEVELOPMENT),
            onUnauthorized = {},
        )
        repository = HomeFeedRepository(client)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        server.shutdown()
    }

    @Test
    fun page1Loads() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        val ready = awaitReady(viewModel)
        assertEquals(12, ready.items.size)
        assertEquals("id-1", ready.items.first().id)
        assertEquals("id-12", ready.items.last().id)
        assertEquals(1, viewModel.currentPageNumber)
        assertTrue(viewModel.canLoadMore)
        assertFalse(ready.isLoadingNextPage)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun viewAllSeedReusesJustListedFeedWithoutAnotherRequest() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        val spec = com.rovexo.app.home.model.HomeDiscoveryRailsSsot.spec(
            com.rovexo.app.home.model.HomeDiscoveryRailId.JUST_LISTED,
        )
        val seed = viewModel.viewAllSeed(spec)
        assertEquals(12, seed!!.items.size)
        assertTrue(seed.skipFirstRequest)
        assertEquals(2, seed.nextPage)
        assertTrue(seed.hasMore)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun savedHydrationDoesNotBlockPage1Ready() {
        val source = File("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt").readText()
        val loadInitial = source.substringAfter("private fun loadInitial()").substringBefore("private fun applyPage1")
        assertTrue(loadInitial.contains("repository.cachedPage1()"))
        assertTrue(loadInitial.contains("repository.fetchPage(1)"))
        assertFalse(loadInitial.contains("fetchSavedSlugs"))
        val applyPage1 = source.substringAfter("private fun applyPage1").substringBefore("private fun hydrateSaved")
        assertTrue(applyPage1.contains("_state.value = if (loadedItems.isEmpty())"))
        val hydrateIndex = loadInitial.indexOf("hydrateSaved()")
        assertTrue(hydrateIndex >= 0)
        enqueuePage(page = 1, hasMore = false, ids = ids(1, 2))
        val viewModel = createViewModel()
        val ready = awaitReady(viewModel)
        assertEquals(2, ready.items.size)
        assertEquals(1, server.requestCount)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
    }

    @Test
    fun page2LoadsAfterPrefetchThreshold() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        server.takeRequest()
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        viewModel.onVisibleItems(lastVisibleItemIndex = 1, totalItemsCount = 13)
        ioDispatcher.scheduler.advanceUntilIdle()
        assertEquals(1, server.requestCount)
        viewModel.onVisibleItems(lastVisibleItemIndex = 2, totalItemsCount = 13)
        val ready = awaitReady(viewModel, minItems = 24)
        assertEquals(24, ready.items.size)
        assertEquals("id-1", ready.items.first().id)
        assertEquals("id-13", ready.items[12].id)
        assertEquals(2, viewModel.currentPageNumber)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
        assertEquals(2, server.requestCount)
    }

    @Test
    fun page2IsRequestedBeforeEndOfPage1() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        val page1 = awaitReady(viewModel)
        server.takeRequest()
        enqueuePage(page = 2, hasMore = false, ids = ids(13, 17))
        assertEquals(12, page1.items.size)
        assertTrue(shouldPrefetch(lastVisibleItemIndex = 4, listingCount = 12))
        assertEquals(8, remainingListings(lastVisibleItemIndex = 4, listingCount = 12))
        viewModel.onVisibleItems(lastVisibleItemIndex = 4, totalItemsCount = 13)
        val ready = awaitReady(viewModel, minItems = 17)
        assertEquals(17, ready.items.size)
        assertEquals(page1.items.map { it.id }, ready.items.take(12).map { it.id })
        assertEquals("id-13", ready.items[12].id)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
        assertEquals(2, server.requestCount)
        assertFalse(viewModel.canLoadMore)
    }

    @Test
    fun prefetchThresholdIsTenRemainingListings() {
        assertEquals(10, HomeFeedViewModel.PREFETCH_THRESHOLD)
        assertFalse(shouldPrefetch(lastVisibleItemIndex = 1, listingCount = 12))
        assertEquals(11, remainingListings(lastVisibleItemIndex = 1, listingCount = 12))
        assertTrue(shouldPrefetch(lastVisibleItemIndex = 2, listingCount = 12))
        assertEquals(10, remainingListings(lastVisibleItemIndex = 2, listingCount = 12))
        assertTrue(shouldPrefetch(lastVisibleItemIndex = 4, listingCount = 12))
        assertFalse(shouldPrefetch(lastVisibleItemIndex = 0, listingCount = 12))
    }

    @Test
    fun page3LoadsAfterPage2() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        viewModel.loadNextPage()
        awaitReady(viewModel, minItems = 24)
        enqueuePage(page = 3, hasMore = true, ids = ids(25, 36))
        viewModel.loadNextPage()
        val ready = awaitReady(viewModel, minItems = 36)
        assertEquals(36, ready.items.size)
        assertEquals(3, viewModel.currentPageNumber)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
        assertEquals(HomeFeedRepository.feedPath(3), server.takeRequest().path)
    }

    @Test
    fun pagesAreSequentialAndNeverSkip() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        viewModel.loadNextPage()
        awaitReady(viewModel, minItems = 24)
        enqueuePage(page = 3, hasMore = false, ids = ids(25, 36))
        viewModel.loadNextPage()
        awaitReady(viewModel, minItems = 36)
        val paths = listOf(
            server.takeRequest().path,
            server.takeRequest().path,
            server.takeRequest().path,
        )
        assertEquals(
            listOf(
                HomeFeedRepository.feedPath(1),
                HomeFeedRepository.feedPath(2),
                HomeFeedRepository.feedPath(3),
            ),
            paths,
        )
        assertFalse(paths.contains(HomeFeedRepository.feedPath(4)))
    }

    @Test
    fun duplicatePageRequestIsBlocked() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        repeat(8) { viewModel.loadNextPage() }
        awaitReady(viewModel, minItems = 24)
        assertEquals(2, server.requestCount)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
    }

    @Test
    fun duplicateListingIdsAreRemovedAndExistingItemsRemain() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        val page1 = awaitReady(viewModel)
        val firstId = page1.items.first().id
        val firstTitle = page1.items.first().title
        enqueuePage(page = 2, hasMore = true, ids = listOf("id-12") + ids(13, 23))
        viewModel.loadNextPage()
        val ready = awaitReady(viewModel, minItems = 23)
        assertEquals(23, ready.items.size)
        assertEquals(23, ready.items.map { it.id }.distinct().size)
        assertEquals(firstId, ready.items.first().id)
        assertEquals(firstTitle, ready.items.first().title)
        assertEquals("id-12", ready.items[11].id)
        assertEquals("id-13", ready.items[12].id)
        assertEquals(1, ready.items.count { it.id == "id-12" })
    }

    @Test
    fun hasMoreTrueContinuesAndHasMoreFalseStops() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 2, hasMore = false, ids = ids(13, 24))
        viewModel.loadNextPage()
        val afterPage2 = awaitReady(viewModel, minItems = 24)
        assertEquals(24, afterPage2.items.size)
        assertFalse(viewModel.canLoadMore)
        viewModel.loadNextPage()
        viewModel.onVisibleItems(30, 25)
        ioDispatcher.scheduler.advanceUntilIdle()
        assertEquals(2, server.requestCount)
        assertEquals(24, viewModel.loadedItemCount)
        assertEquals(2, viewModel.currentPageNumber)
    }

    @Test
    fun page2FailurePreservesPage1() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        val page1 = awaitReady(viewModel)
        server.enqueue(MockResponse().setResponseCode(500))
        viewModel.loadNextPage()
        ioDispatcher.scheduler.advanceUntilIdle()
        val ready = viewModel.state.value as HomeFeedUiState.Ready
        assertEquals(12, ready.items.size)
        assertEquals(page1.items.map { it.id }, ready.items.map { it.id })
        assertTrue(ready.nextPageError)
        assertFalse(ready.isLoadingNextPage)
        assertEquals(1, viewModel.currentPageNumber)
        assertTrue(viewModel.canLoadMore)
        assertEquals(2, server.requestCount)
    }

    @Test
    fun retryRequestsOnlyPage2() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        server.enqueue(MockResponse().setResponseCode(500))
        viewModel.loadNextPage()
        ioDispatcher.scheduler.advanceUntilIdle()
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        viewModel.retryNextPage()
        val ready = awaitReady(viewModel, minItems = 24)
        assertEquals(24, ready.items.size)
        assertFalse(ready.nextPageError)
        assertEquals(3, server.requestCount)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
        assertEquals(HomeFeedRepository.feedPath(2), server.takeRequest().path)
    }

    @Test
    fun networkFailurePreservesExistingFeed() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        val page1 = awaitReady(viewModel)
        network.isConnected = false
        viewModel.loadNextPage()
        ioDispatcher.scheduler.advanceUntilIdle()
        val ready = viewModel.state.value as HomeFeedUiState.Ready
        assertEquals(12, ready.items.size)
        assertEquals(page1.items.map { it.id }, ready.items.map { it.id })
        assertTrue(ready.nextPageError)
        assertEquals(1, viewModel.currentPageNumber)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun rapidScrollingDoesNotCreateDuplicateRequests() {
        enqueuePage(page = 1, hasMore = true, ids = ids(1, 12))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 2, hasMore = true, ids = ids(13, 24))
        repeat(20) {
            viewModel.onVisibleItems(lastVisibleItemIndex = 12, totalItemsCount = 13)
            viewModel.loadNextPage()
        }
        awaitReady(viewModel, minItems = 24)
        assertEquals(2, server.requestCount)
        assertEquals(2, viewModel.currentPageNumber)
    }

    @Test
    fun mergeKeepsExistingOrderAndDropsDuplicateIds() {
        val first = listing("keep")
        val duplicate = listing("keep")
        val extra = listing("new")
        val merged = mergeUniqueById(listOf(first), listOf(duplicate, extra))
        assertEquals(listOf("keep", "new"), merged.map { it.id })
        assertTrue(merged[0] === first)
    }

    @Test
    fun noFakeListingsAreIntroduced() {
        val viewModelSource = File("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt").readText()
        val repositorySource = File("src/main/java/com/rovexo/app/home/data/HomeFeedRepository.kt").readText()
        val screen = File("src/main/java/com/rovexo/app/ui/home/HomeScreen.kt").readText()
        for (source in listOf(viewModelSource, repositorySource, screen)) {
            assertFalse(source.contains("seedDemo"))
            assertFalse(source.contains("fake listing", ignoreCase = true))
            assertFalse(source.contains("canonical-demo"))
            assertFalse(source.contains("placeholder product"))
        }
        assertFalse(screen.contains("/api/saved"))
        assertTrue(viewModelSource.contains("fun toggleSave("))
        assertTrue(repositorySource.contains("/api/saved"))
        enqueuePage(page = 1, hasMore = false, ids = ids(1, 2))
        val viewModel = createViewModel()
        val ready = awaitReady(viewModel)
        assertEquals(listOf("id-1", "id-2"), ready.items.map { it.id })
        assertTrue(ready.items.all { it.title.startsWith("Title id-") })
        assertEquals(
            listOf("✨ Just Listed", "💰 Great Value"),
            ready.rails.map { com.rovexo.app.home.model.HomeDiscoveryRailsSsot.heading(it.spec) },
        )
        assertFalse(ready.rails.any { it.spec.title == "Trending Today" })
        assertEquals(1, ready.rails.count { it.spec.id == com.rovexo.app.home.model.HomeDiscoveryRailId.JUST_LISTED })
    }

    @Test
    fun cachedPage1RendersWhenNetworkFails() {
        val json = enqueueBody(page = 1, hasMore = false, ids = ids(1, 2))
        val cache = HomeFeedPage1Cache.inMemory()
        cache.save(json, HomeFeedParser.parse(json)!!)
        val cachedRepo = HomeFeedRepository(createClient(), page1Cache = cache)
        server.enqueue(MockResponse().setResponseCode(500))
        val viewModel = HomeFeedViewModel(cachedRepo, ioDispatcher = ioDispatcher)
        val ready = awaitReady(viewModel)
        assertEquals(listOf("id-1", "id-2"), ready.items.map { it.id })
        assertEquals(1, server.requestCount)
    }

    @Test
    fun livePage1ReplacesCachedListings() {
        val cachedJson = enqueueBody(page = 1, hasMore = false, ids = listOf("id-cache"))
        val cache = HomeFeedPage1Cache.inMemory()
        cache.save(cachedJson, HomeFeedParser.parse(cachedJson)!!)
        val cachedRepo = HomeFeedRepository(createClient(), page1Cache = cache)
        enqueuePage(page = 1, hasMore = false, ids = listOf("id-live"))
        val viewModel = HomeFeedViewModel(cachedRepo, ioDispatcher = ioDispatcher)
        val ready = awaitReady(viewModel)
        assertEquals(listOf("id-live"), ready.items.map { it.id })
    }

    @Test
    fun refreshPage1FetchesPage1AndUpdatesItemsWithoutLoading() {
        enqueuePage(page = 1, hasMore = false, ids = ids(1, 2))
        val viewModel = createViewModel()
        val first = awaitReady(viewModel)
        assertEquals(listOf("id-1", "id-2"), first.items.map { it.id })
        server.takeRequest()
        enqueuePage(page = 1, hasMore = false, ids = listOf("id-live"))
        viewModel.refreshPage1()
        assertTrue(viewModel.state.value is HomeFeedUiState.Ready)
        assertFalse(viewModel.state.value is HomeFeedUiState.Loading)
        val ready = awaitReady(viewModel)
        assertEquals(listOf("id-live"), ready.items.map { it.id })
        assertTrue(viewModel.state.value is HomeFeedUiState.Ready)
        assertEquals(HomeFeedRepository.feedPath(1), server.takeRequest().path)
        assertEquals(2, server.requestCount)
    }

    @Test
    fun refreshPage1FailurePreservesReady() {
        enqueuePage(page = 1, hasMore = false, ids = ids(1, 2))
        val viewModel = createViewModel()
        val first = awaitReady(viewModel)
        server.enqueue(MockResponse().setResponseCode(500))
        viewModel.refreshPage1()
        ioDispatcher.scheduler.advanceUntilIdle()
        val ready = viewModel.state.value as HomeFeedUiState.Ready
        assertEquals(first.items.map { it.id }, ready.items.map { it.id })
        assertEquals(2, server.requestCount)
    }

    @Test
    fun overlappingRefreshPage1ResultsInOneGet() {
        enqueuePage(page = 1, hasMore = false, ids = ids(1, 2))
        val viewModel = createViewModel()
        awaitReady(viewModel)
        enqueuePage(page = 1, hasMore = false, ids = listOf("id-live"))
        viewModel.refreshPage1()
        viewModel.refreshPage1()
        viewModel.refreshPage1()
        ioDispatcher.scheduler.advanceUntilIdle()
        assertEquals(2, server.requestCount)
        val ready = viewModel.state.value as HomeFeedUiState.Ready
        assertEquals(listOf("id-live"), ready.items.map { it.id })
    }

    @Test
    fun refreshPage1DoesNotReplayCacheOrClearRails() {
        val source = File("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt").readText()
        val refresh = source.substringAfter("fun refreshPage1()").substringBefore("fun retryNextPage")
        assertTrue(refresh.contains("repository.fetchPage(1)"))
        assertTrue(refresh.contains("applyPage1"))
        assertTrue(refresh.contains("isLoadingInitial"))
        assertTrue(refresh.contains("page1RefreshInFlight"))
        assertFalse(refresh.contains("retry()"))
        assertFalse(refresh.contains("loadInitial()"))
        assertFalse(refresh.contains("cachedPage1()"))
        assertFalse(refresh.contains("HomeFeedUiState.Loading"))
        assertFalse(refresh.contains("railExtras = emptyMap()"))
        assertFalse(refresh.contains("savedSlugs.clear()"))
    }

    private fun createViewModel(): HomeFeedViewModel {
        return HomeFeedViewModel(repository, ioDispatcher = ioDispatcher)
    }

    private fun awaitReady(
        viewModel: HomeFeedViewModel,
        minItems: Int = 1,
    ): HomeFeedUiState.Ready {
        ioDispatcher.scheduler.advanceUntilIdle()
        val state = viewModel.state.value
        assertTrue("Expected Ready, was $state", state is HomeFeedUiState.Ready)
        val ready = state as HomeFeedUiState.Ready
        assertTrue("Expected at least $minItems items, was ${ready.items.size}", ready.items.size >= minItems)
        return ready
    }

    private fun enqueuePage(page: Int, hasMore: Boolean, ids: List<String>) {
        server.enqueue(MockResponse().setBody(enqueueBody(page, hasMore, ids)))
    }

    private fun enqueueBody(page: Int, hasMore: Boolean, ids: List<String>): String {
        val items = ids.joinToString(",") { id ->
            """
            {
              "id":"$id",
              "slug":"$id",
              "title":"Title $id",
              "price":1,
              "sellerName":"seller",
              "imageUrl":"thumb-$id.jpg",
              "imageFullUrl":"full-$id.jpg",
              "isFeatured":false,
              "isBumped":false,
              "rating":0,
              "reviewCount":0
            }
            """.trimIndent()
        }
        return """{"page":$page,"hasMore":$hasMore,"items":[$items]}"""
    }

    private fun createClient(): RovexoApiClient {
        val base = server.url("/").toString().trimEnd('/')
        val config = AppConfig(
            environment = AppEnvironment.DEVELOPMENT,
            apiBaseUrl = base,
            authBaseUrl = base,
            publishableAuthKey = "public-anon-key",
        )
        return RovexoApiClient(
            config = config,
            httpClient = RovexoApiClient.createHttpClient(config),
            sessionStore = InMemorySessionStore(),
            networkMonitor = network,
            logger = AppLogger(AppEnvironment.DEVELOPMENT),
            onUnauthorized = {},
        )
    }

    private fun ids(from: Int, to: Int): List<String> = (from..to).map { "id-$it" }

    private fun listing(id: String): HomeListing {
        return HomeListing(
            id = id,
            slug = id,
            title = "Title $id",
            price = 1.0,
            condition = null,
            sellerName = "seller",
            sellerId = null,
            sellerUsername = null,
            sellerAvatar = null,
            sellerVerified = false,
            rating = 0.0,
            reviewCount = 0,
            views = null,
            likes = null,
            imageUrl = "thumb.jpg",
            imageFullUrl = "full.jpg",
            isFeatured = false,
            isBumped = false,
            promotionScore = null,
            homepagePriorityScore = null,
            categoryId = null,
            shippingPrice = null,
            freeDelivery = false,
            stock = null,
        )
    }
}

private class MutableHomeNetwork(
    override var isConnected: Boolean,
) : NetworkStatusProvider
