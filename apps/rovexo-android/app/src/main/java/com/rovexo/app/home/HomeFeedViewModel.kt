package com.rovexo.app.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.rovexo.app.browse.data.BrowseRepository
import com.rovexo.app.core.error.AppError
import com.rovexo.app.core.performance.NativePerf
import com.rovexo.app.core.network.ApiResult
import com.rovexo.app.core.network.RovexoApiClient
import com.rovexo.app.home.data.HomeFeedRepository
import com.rovexo.app.home.model.HomeDiscoveryRail
import com.rovexo.app.home.model.HomeFeedPage
import com.rovexo.app.home.model.HomeDiscoveryRailId
import com.rovexo.app.home.model.HomeDiscoveryRailSpec
import com.rovexo.app.home.model.HomeDiscoveryRailsSsot
import com.rovexo.app.home.model.HomeListing
import com.rovexo.app.home.model.HomeRailResultsSeed
import com.rovexo.app.home.model.HomeRailResultsSource
import com.rovexo.app.search.model.SearchContract
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

sealed class HomeFeedUiState {
    data object Loading : HomeFeedUiState()
    data class Ready(
        val items: List<HomeListing>,
        val rails: List<HomeDiscoveryRail> = emptyList(),
        val isLoadingNextPage: Boolean = false,
        val nextPageError: Boolean = false,
    ) : HomeFeedUiState()
    data object Empty : HomeFeedUiState()
    data class Error(val disconnected: Boolean) : HomeFeedUiState()
}

sealed class HomeSaveNotice {
    data object SessionExpired : HomeSaveNotice()
    data object Unavailable : HomeSaveNotice()
}

class HomeFeedViewModel(
    private val repository: HomeFeedRepository,
    private val browseRepository: BrowseRepository? = null,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) : ViewModel() {
    private val _state = MutableStateFlow<HomeFeedUiState>(HomeFeedUiState.Loading)
    val state: StateFlow<HomeFeedUiState> = _state.asStateFlow()

    private val _saveNotice = MutableStateFlow<HomeSaveNotice?>(null)
    val saveNotice: StateFlow<HomeSaveNotice?> = _saveNotice.asStateFlow()

    private var loadedItems: List<HomeListing> = emptyList()
    private var currentPage: Int = 0
    private var hasMore: Boolean = false
    private var isLoadingInitial: Boolean = false
    private var isLoadingNextPage: Boolean = false
    private var nextPageError: Boolean = false
    private val nextPageInFlight = AtomicBoolean(false)
    private val page1RefreshInFlight = AtomicBoolean(false)
    private val savedSlugs = LinkedHashSet<String>()
    private val saveInFlight = LinkedHashSet<String>()
    private var savedMutationCount: Int = 0
    private var railExtras: Map<HomeDiscoveryRailId, List<HomeListing>> = emptyMap()

    val loadedItemCount: Int get() = loadedItems.size
    val currentPageNumber: Int get() = currentPage
    val canLoadMore: Boolean get() = hasMore
    val loadingNextPage: Boolean get() = isLoadingNextPage
    val hasNextPageError: Boolean get() = nextPageError

    fun viewAllSeed(spec: HomeDiscoveryRailSpec): HomeRailResultsSeed? {
        return when (val source = spec.source) {
            is HomeRailResultsSource.Feed -> {
                val items = HomeDiscoveryRailsSsot.applyFeedMode(loadedItems, source.mode)
                if (items.isEmpty()) {
                    null
                } else {
                    HomeRailResultsSeed(
                        items = items,
                        hasMore = hasMore,
                        nextPage = currentPage + 1,
                        nextOffset = 0,
                        skipFirstRequest = true,
                    )
                }
            }
            is HomeRailResultsSource.Category -> {
                val extras = railExtras[spec.id].orEmpty()
                if (extras.isEmpty()) {
                    null
                } else {
                    HomeRailResultsSeed(
                        items = extras,
                        hasMore = extras.size >= HomeFeedRepository.CATEGORY_PAGE_SIZE,
                        nextPage = 2,
                        nextOffset = 0,
                        skipFirstRequest = true,
                    )
                }
            }
            is HomeRailResultsSource.Query -> {
                val extras = railExtras[spec.id].orEmpty()
                if (extras.isNotEmpty()) {
                    HomeRailResultsSeed(
                        items = extras,
                        hasMore = extras.size >= SearchContract.PAGE_SIZE,
                        nextPage = 2,
                        nextOffset = SearchContract.PAGE_SIZE,
                        skipFirstRequest = true,
                    )
                } else {
                    val fallback = HomeDiscoveryRailsSsot.listingItemsFor(spec, loadedItems, railExtras)
                    if (fallback.isEmpty()) {
                        null
                    } else {
                        HomeRailResultsSeed(
                            items = fallback,
                            hasMore = true,
                            nextPage = 1,
                            nextOffset = 0,
                            skipFirstRequest = false,
                        )
                    }
                }
            }
        }
    }

    fun savedSlugsSnapshot(): Set<String> = savedSlugs.toSet()

    init {
        loadInitial()
    }

    fun retry() {
        loadInitial()
    }

    fun refreshPage1() {
        if (isLoadingInitial) return
        if (!page1RefreshInFlight.compareAndSet(false, true)) return
        viewModelScope.launch {
            try {
                val result = withContext(ioDispatcher) { repository.fetchPage(1) }
                if (result is ApiResult.Success) {
                    applyPage1(result.value)
                }
            } finally {
                page1RefreshInFlight.set(false)
            }
        }
    }

    fun retryNextPage() {
        if (_state.value !is HomeFeedUiState.Ready) return
        if (loadedItems.isEmpty()) return
        nextPageError = false
        nextPageInFlight.set(false)
        isLoadingNextPage = false
        publishReady()
        loadNextPage()
    }

    fun onVisibleItems(lastVisibleItemIndex: Int, totalItemsCount: Int) {
        if (lastVisibleItemIndex < 0 || loadedItems.isEmpty()) return
        if (shouldPrefetch(lastVisibleItemIndex, loadedItems.size)) {
            loadNextPage()
        }
    }

    fun consumeSaveNotice() {
        _saveNotice.value = null
    }

    fun toggleSave(slug: String) {
        val listingSlug = slug.trim()
        if (listingSlug.isEmpty()) return
        if (_state.value !is HomeFeedUiState.Ready) return
        val current = findListing(listingSlug) ?: return
        if (!saveInFlight.add(listingSlug)) return

        savedMutationCount += 1
        val nextSaved = !current.isSaved
        applySavedSlug(listingSlug, nextSaved)
        loadedItems = overlaySaved(loadedItems)
        railExtras = overlaySavedExtras(railExtras)
        publishReady()

        viewModelScope.launch {
            val result = withContext(ioDispatcher) {
                if (nextSaved) {
                    repository.saveListing(listingSlug)
                } else {
                    repository.unsaveListing(listingSlug)
                }
            }
            when (result) {
                is ApiResult.Success -> Unit
                is ApiResult.Failure -> {
                    applySavedSlug(listingSlug, current.isSaved)
                    loadedItems = overlaySaved(loadedItems)
                    railExtras = overlaySavedExtras(railExtras)
                    _saveNotice.value = if (result.error is AppError.Unauthorized) {
                        HomeSaveNotice.SessionExpired
                    } else {
                        HomeSaveNotice.Unavailable
                    }
                    publishReady()
                }
            }
            saveInFlight.remove(listingSlug)
        }
    }

    fun loadNextPage() {
        if (isLoadingInitial) return
        if (_state.value !is HomeFeedUiState.Ready) return
        if (!hasMore) return
        if (nextPageError) return
        if (isLoadingNextPage) return
        if (!nextPageInFlight.compareAndSet(false, true)) return

        isLoadingNextPage = true
        publishReady()
        val pageToLoad = currentPage + 1
        viewModelScope.launch {
            val result = withContext(ioDispatcher) { repository.fetchPage(pageToLoad) }
            when (result) {
                is ApiResult.Success -> {
                    loadedItems = overlaySaved(mergeUniqueById(loadedItems, result.value.items))
                    currentPage = pageToLoad
                    hasMore = result.value.hasMore
                    nextPageError = false
                }
                is ApiResult.Failure -> {
                    nextPageError = true
                }
            }
            isLoadingNextPage = false
            nextPageInFlight.set(false)
            if (loadedItems.isEmpty()) {
                _state.value = HomeFeedUiState.Empty
            } else {
                publishReady()
            }
        }
    }

    private fun loadInitial() {
        viewModelScope.launch {
            isLoadingInitial = true
            isLoadingNextPage = false
            nextPageError = false
            nextPageInFlight.set(false)
            hasMore = false
            currentPage = 0
            savedSlugs.clear()
            saveInFlight.clear()
            savedMutationCount = 0
            railExtras = emptyMap()
            val cacheStarted = NativePerf.nowMs()
            val cached = withContext(ioDispatcher) { repository.cachedPage1() }
            NativePerf.record("HOME_CACHE_READ_MS", NativePerf.nowMs() - cacheStarted)
            var servedCache = false
            if (cached != null && cached.items.isNotEmpty()) {
                NativePerf.mark("HOME_CACHE_HIT")
                applyPage1(cached)
                servedCache = true
                NativePerf.mark("HOME_FIRST_USABLE")
                NativePerf.mark("HOME_FIRST_USABLE_MS")
                hydrateSaved()
                loadRailExtras()
            } else {
                NativePerf.mark("HOME_CACHE_MISS")
                _state.value = HomeFeedUiState.Loading
            }
            val result = withContext(ioDispatcher) { repository.fetchPage(1) }
            isLoadingInitial = false
            when (result) {
                is ApiResult.Success -> {
                    applyPage1(result.value)
                    NativePerf.mark("HOME_FIRST_USABLE")
                    NativePerf.mark("HOME_FIRST_USABLE_MS")
                    if (loadedItems.isNotEmpty() && !servedCache) {
                        hydrateSaved()
                        loadRailExtras()
                    } else if (loadedItems.isNotEmpty()) {
                        hydrateSaved()
                    }
                }
                is ApiResult.Failure -> {
                    if (_state.value is HomeFeedUiState.Ready) {
                        return@launch
                    }
                    loadedItems = emptyList()
                    currentPage = 0
                    hasMore = false
                    _state.value = HomeFeedUiState.Error(
                        disconnected = result.error is AppError.Disconnected,
                    )
                }
            }
        }
    }

    private fun applyPage1(page: HomeFeedPage) {
        loadedItems = overlaySaved(mergeUniqueById(emptyList(), page.items))
        currentPage = 1
        hasMore = page.hasMore
        nextPageError = false
        isLoadingNextPage = false
        _state.value = if (loadedItems.isEmpty()) {
            HomeFeedUiState.Empty
        } else {
            readyState()
        }
    }

    private fun hydrateSaved() {
        viewModelScope.launch {
            val mutationsAtStart = savedMutationCount
            val result = withContext(ioDispatcher) { repository.fetchSavedSlugs() }
            if (result is ApiResult.Success && mutationsAtStart == savedMutationCount) {
                savedSlugs.clear()
                savedSlugs.addAll(result.value)
                loadedItems = overlaySaved(loadedItems)
                railExtras = overlaySavedExtras(railExtras)
                if (loadedItems.isNotEmpty() && _state.value is HomeFeedUiState.Ready) {
                    publishReady()
                }
            }
        }
    }

    private fun loadRailExtras() {
        val browse = browseRepository ?: return
        viewModelScope.launch {
            val fetched = withContext(ioDispatcher) {
                coroutineScope {
                    RAIL_FETCHES.map { fetch ->
                        async {
                            fetch.id to fetch.load(browse)
                        }
                    }.awaitAll()
                }
            }
            railExtras = overlaySavedExtras(fetched.toMap())
            if (loadedItems.isNotEmpty() && _state.value is HomeFeedUiState.Ready) {
                publishReady()
            }
        }
    }

    private fun findListing(slug: String): HomeListing? {
        loadedItems.firstOrNull { it.slug == slug }?.let { return it }
        railExtras.values.forEach { items ->
            items.firstOrNull { it.slug == slug }?.let { return it }
        }
        return null
    }

    private fun overlaySavedExtras(
        extras: Map<HomeDiscoveryRailId, List<HomeListing>>,
    ): Map<HomeDiscoveryRailId, List<HomeListing>> {
        if (extras.isEmpty()) return extras
        return extras.mapValues { (_, items) -> overlaySaved(items) }
    }

    private fun applySavedSlug(slug: String, saved: Boolean) {
        if (saved) savedSlugs.add(slug) else savedSlugs.remove(slug)
    }

    private fun overlaySaved(items: List<HomeListing>): List<HomeListing> {
        if (items.isEmpty()) return items
        return items.map { item -> item.copy(isSaved = savedSlugs.contains(item.slug)) }
    }

    private fun publishReady() {
        if (loadedItems.isEmpty()) return
        _state.value = readyState()
    }

    private fun readyState(): HomeFeedUiState.Ready {
        return HomeFeedUiState.Ready(
            items = loadedItems,
            rails = HomeDiscoveryRailsSsot.build(loadedItems, railExtras),
            isLoadingNextPage = isLoadingNextPage,
            nextPageError = nextPageError,
        )
    }

    companion object {
        const val PREFETCH_THRESHOLD = 10

        fun factory(
            repository: HomeFeedRepository,
            browseRepository: BrowseRepository? = null,
        ): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeFeedViewModel(repository, browseRepository) as T
                }
            }
        }

        fun factory(apiClient: RovexoApiClient): ViewModelProvider.Factory {
            return factory(HomeFeedRepository(apiClient))
        }

        private val RAIL_FETCHES = HomeDiscoveryRailsSsot.SECTIONS.mapNotNull { spec ->
            when (val source = spec.source) {
                is HomeRailResultsSource.Category -> RailFetch(spec.id) { repo ->
                    repo.categoryListings(source.slug, 1).listingItems()
                }
                is HomeRailResultsSource.Query -> RailFetch(spec.id) { repo ->
                    repo.queryListings(source.query, 0).queryItems()
                }
                is HomeRailResultsSource.Feed -> null
            }
        }
    }
}

private data class RailFetch(
    val id: HomeDiscoveryRailId,
    val load: (BrowseRepository) -> List<HomeListing>,
)

private fun ApiResult<com.rovexo.app.home.model.HomeFeedPage>.listingItems(): List<HomeListing> {
    return (this as? ApiResult.Success)?.value?.items.orEmpty()
}

private fun ApiResult<com.rovexo.app.search.model.SearchPage>.queryItems(): List<HomeListing> {
    return (this as? ApiResult.Success)?.value?.products.orEmpty()
}

internal fun remainingListings(lastVisibleItemIndex: Int, listingCount: Int): Int {
    if (listingCount <= 0) return 0
    return (listingCount - lastVisibleItemIndex).coerceAtLeast(0)
}

internal fun shouldPrefetch(lastVisibleItemIndex: Int, listingCount: Int): Boolean {
    if (listingCount <= 0 || lastVisibleItemIndex < 0) return false
    return remainingListings(lastVisibleItemIndex, listingCount) <= HomeFeedViewModel.PREFETCH_THRESHOLD
}

internal fun mergeUniqueById(
    existing: List<HomeListing>,
    incoming: List<HomeListing>,
): List<HomeListing> {
    if (incoming.isEmpty()) return existing
    val seen = HashSet<String>(existing.size + incoming.size)
    val merged = ArrayList<HomeListing>(existing.size + incoming.size)
    for (item in existing) {
        if (seen.add(item.id)) {
            merged.add(item)
        }
    }
    for (item in incoming) {
        if (seen.add(item.id)) {
            merged.add(item)
        }
    }
    return merged
}
