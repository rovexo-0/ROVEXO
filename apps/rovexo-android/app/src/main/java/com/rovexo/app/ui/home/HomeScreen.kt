package com.rovexo.app.ui.home

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.TextButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rovexo.app.R
import com.rovexo.app.RovexoApplication
import com.rovexo.app.core.network.NetworkStatus
import com.rovexo.app.core.theme.RovexoTokens
import com.rovexo.app.home.HomeFeedUiState
import com.rovexo.app.home.HomeFeedPerformance
import com.rovexo.app.core.performance.FrameJank
import com.rovexo.app.core.performance.NativePerf
import com.rovexo.app.home.HomeFeedViewModel
import com.rovexo.app.home.HomeSaveNotice
import com.rovexo.app.home.data.HomeFeedRepository
import com.rovexo.app.home.model.HomeCategoryRailChip
import com.rovexo.app.home.model.HomeCategoryRailSsot
import com.rovexo.app.home.model.HomeDiscoveryRailSpec
import com.rovexo.app.home.model.HomeRailResultsSeed
import com.rovexo.app.home.model.HomeViewAllTiming
import com.rovexo.app.browse.model.BrowseTiming
import com.rovexo.app.ui.browse.BrowseScreen
import com.rovexo.app.ui.browse.BrowseViewModel
import com.rovexo.app.ui.home.components.HomeCategoryRail
import com.rovexo.app.ui.home.components.HomeDiscoveryRailRow
import com.rovexo.app.ui.home.components.HomeDiscoveryRailSkeleton
import com.rovexo.app.ui.home.components.homeRailCardWidth
import com.rovexo.app.ui.search.SearchScreen
import com.rovexo.app.ui.sell.SellScreen
import kotlinx.coroutines.flow.distinctUntilChanged

enum class HomeShellDestination {
    Home,
    Browse,
    Search,
    Sell,
    Messages,
    Notifications,
    Profile,
}

internal fun shouldRefreshHomePage1(
    current: HomeShellDestination,
    next: HomeShellDestination,
): Boolean {
    return current == HomeShellDestination.Sell && next == HomeShellDestination.Home
}

internal fun shouldResetBrowseSession(
    current: HomeShellDestination,
    searchReturnTo: HomeShellDestination,
    next: HomeShellDestination,
): Boolean {
    val inBrowseSession = current == HomeShellDestination.Browse ||
        (current == HomeShellDestination.Search && searchReturnTo == HomeShellDestination.Browse)
    return inBrowseSession &&
        next != HomeShellDestination.Browse &&
        next != HomeShellDestination.Search
}

private val InactiveNavTint = Color(0xFF6B7280)
private val SearchFieldShape = RoundedCornerShape(12.dp)
private val SearchFieldHeight = 38.dp
private val SearchPlaceholder = Color(0xFF9CA3AF)
private val HomeBottomNavigationHeight = 64.dp
private const val HOME_CHROME_ANIMATION_MS = 180
private const val HOME_FEED_PLACEHOLDER_COUNT = 4

internal fun resolveHomeChromeVisible(
    firstVisibleItemIndex: Int,
    firstVisibleItemScrollOffset: Int,
    previousIndex: Int,
    previousOffset: Int,
    currentlyVisible: Boolean,
): Boolean {
    if (firstVisibleItemIndex == 0 && firstVisibleItemScrollOffset == 0) {
        return true
    }
    return when {
        firstVisibleItemIndex > previousIndex -> false
        firstVisibleItemIndex < previousIndex -> true
        firstVisibleItemScrollOffset > previousOffset -> false
        firstVisibleItemScrollOffset < previousOffset -> true
        else -> currentlyVisible
    }
}

@Composable
fun HomeScreen(
    networkStatus: NetworkStatus,
    onSignOut: () -> Unit,
    feedRepository: HomeFeedRepository,
) {
    val app = LocalContext.current.applicationContext as RovexoApplication
    val feedViewModel: HomeFeedViewModel = viewModel(
        factory = remember(feedRepository) {
            HomeFeedViewModel.factory(feedRepository, app.container.browseRepository)
        },
    )
    val browseViewModel: BrowseViewModel = viewModel(
        factory = remember(app) { BrowseViewModel.factory(app.container.browseRepository) },
    )
    var destination by rememberSaveable { mutableStateOf(HomeShellDestination.Home) }
    var searchReturnTo by rememberSaveable { mutableStateOf(HomeShellDestination.Home) }
    var chromeVisible by rememberSaveable { mutableStateOf(true) }
    var viewAllSpec by remember { mutableStateOf<HomeDiscoveryRailSpec?>(null) }
    var viewAllSeed by remember { mutableStateOf<HomeRailResultsSeed?>(null) }
    var viewAllSavedSlugs by remember { mutableStateOf<Set<String>>(emptySet()) }
    val activity = LocalContext.current as? Activity
    val focusManager = LocalFocusManager.current
    val feedState by feedViewModel.state.collectAsStateWithLifecycle()
    val saveNotice by feedViewModel.saveNotice.collectAsStateWithLifecycle()
    val feedListState = rememberLazyListState()
    val snackbarHostState = remember { SnackbarHostState() }
    val sessionExpiredMessage = stringResource(R.string.session_expired)
    val saveUnavailableMessage = stringResource(R.string.fail_closed_body)
    val showResults = viewAllSpec != null
    val showChrome = showResults || destination != HomeShellDestination.Home || chromeVisible

    LaunchedEffect(destination) {
        if (destination == HomeShellDestination.Home) {
            searchReturnTo = HomeShellDestination.Home
        }
    }

    LaunchedEffect(feedListState) {
        var previousIndex = feedListState.firstVisibleItemIndex
        var previousOffset = feedListState.firstVisibleItemScrollOffset
        snapshotFlow {
            feedListState.firstVisibleItemIndex to feedListState.firstVisibleItemScrollOffset
        }
            .distinctUntilChanged()
            .collect { (index, offset) ->
                chromeVisible = resolveHomeChromeVisible(
                    firstVisibleItemIndex = index,
                    firstVisibleItemScrollOffset = offset,
                    previousIndex = previousIndex,
                    previousOffset = previousOffset,
                    currentlyVisible = chromeVisible,
                )
                previousIndex = index
                previousOffset = offset
            }
    }

    LaunchedEffect(Unit) {
        HomeFeedPerformance.markHomeOpen()
        NativePerf.mark("HOME_FIRST_FRAME")
        browseViewModel.ensureTree()
    }

    LaunchedEffect(feedState) {
        val ready = feedState as? HomeFeedUiState.Ready
        if (ready != null) {
            if (ready.items.isNotEmpty()) {
                HomeFeedPerformance.markFirstListingRender()
            }
            NativePerf.mark("HOME_READY")
            FrameJank.snapshot("HOME")
        }
    }

    LaunchedEffect(saveNotice) {
        val message = when (saveNotice) {
            HomeSaveNotice.SessionExpired -> sessionExpiredMessage
            HomeSaveNotice.Unavailable -> saveUnavailableMessage
            null -> null
        }
        if (message != null) {
            snackbarHostState.showSnackbar(message)
            feedViewModel.consumeSaveNotice()
        }
    }

    BackHandler {
        when {
            viewAllSpec != null -> {
                viewAllSpec = null
                viewAllSeed = null
                viewAllSavedSlugs = emptySet()
            }
            destination != HomeShellDestination.Home -> {
                if (shouldResetBrowseSession(destination, searchReturnTo, HomeShellDestination.Home)) {
                    browseViewModel.resetSession()
                }
                if (shouldRefreshHomePage1(destination, HomeShellDestination.Home)) {
                    feedViewModel.refreshPage1()
                }
                searchReturnTo = HomeShellDestination.Home
                destination = HomeShellDestination.Home
            }
            else -> activity?.moveTaskToBack(true)
        }
    }

    val onOpenCategory = remember {
        { chip: HomeCategoryRailChip ->
            HomeViewAllTiming.markTap()
            viewAllSeed = null
            viewAllSavedSlugs = feedViewModel.savedSlugsSnapshot()
            viewAllSpec = HomeCategoryRailSsot.listingSpec(chip)
        }
    }
    val onSelectDestination = remember {
        { next: HomeShellDestination ->
            if (next == HomeShellDestination.Browse && destination != HomeShellDestination.Browse) {
                BrowseTiming.markTap()
            }
            if (shouldResetBrowseSession(destination, searchReturnTo, next)) {
                browseViewModel.resetSession()
            }
            viewAllSpec = null
            viewAllSeed = null
            viewAllSavedSlugs = emptySet()
            if (next == HomeShellDestination.Home) {
                searchReturnTo = HomeShellDestination.Home
            }
            if (next == HomeShellDestination.Sell && destination != HomeShellDestination.Sell) {
                NativePerf.mark("SELL_OPEN")
            }
            if (shouldRefreshHomePage1(destination, next)) {
                feedViewModel.refreshPage1()
            }
            destination = next
            if (next == HomeShellDestination.Browse) {
                BrowseTiming.markDestination()
            }
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(RovexoTokens.Background),
        containerColor = RovexoTokens.Background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            if (destination == HomeShellDestination.Home && viewAllSpec == null) {
                HomeHeader(
                    onSearch = { destination = HomeShellDestination.Search },
                    showCategoryRail = showChrome,
                    onOpenCategory = onOpenCategory,
                )
            }
        },
        bottomBar = {
            AnimatedVisibility(
                visible = showChrome,
                enter = slideInVertically(tween(HOME_CHROME_ANIMATION_MS)) { it } +
                    expandVertically(tween(HOME_CHROME_ANIMATION_MS)) +
                    fadeIn(tween(HOME_CHROME_ANIMATION_MS)),
                exit = slideOutVertically(tween(HOME_CHROME_ANIMATION_MS)) { it } +
                    shrinkVertically(tween(HOME_CHROME_ANIMATION_MS)) +
                    fadeOut(tween(HOME_CHROME_ANIMATION_MS)),
            ) {
                HomeBottomNavigation(
                    selected = destination,
                    searchReturnTo = searchReturnTo,
                    onSelect = onSelectDestination,
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(RovexoTokens.Background),
        ) {
            if (networkStatus is NetworkStatus.Disconnected) {
                Text(
                    text = stringResource(R.string.network_disconnected),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = RovexoTokens.SpaceMd, vertical = RovexoTokens.SpaceSm),
                )
            }
            HomeShellContent(
                destination = destination,
                feedState = feedState,
                feedListState = feedListState,
                viewAllSpec = viewAllSpec,
                viewAllSeed = viewAllSeed,
                viewAllSavedSlugs = viewAllSavedSlugs,
                onRetry = feedViewModel::retry,
                onRetryNextPage = feedViewModel::retryNextPage,
                onVisibleItems = feedViewModel::onVisibleItems,
                onToggleSave = feedViewModel::toggleSave,
                onViewAll = { spec ->
                    HomeViewAllTiming.markTap()
                    viewAllSeed = feedViewModel.viewAllSeed(spec)
                    viewAllSavedSlugs = feedViewModel.savedSlugsSnapshot()
                    viewAllSpec = spec
                },
                onCloseViewAll = {
                    viewAllSpec = null
                    viewAllSeed = null
                    viewAllSavedSlugs = emptySet()
                },
                onCloseSearch = { destination = searchReturnTo },
                onOpenSearch = {
                    searchReturnTo = HomeShellDestination.Browse
                    destination = HomeShellDestination.Search
                },
                onSignOut = {
                    focusManager.clearFocus()
                    onSignOut()
                },
            )
        }
    }
}

@Composable
private fun HomeHeader(
    onSearch: () -> Unit,
    showCategoryRail: Boolean,
    onOpenCategory: (HomeCategoryRailChip) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(RovexoTokens.Background)
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(top = RovexoTokens.SpaceSm, bottom = RovexoTokens.SpaceXs),
    ) {
        val searchDescription = stringResource(R.string.home_search_entry)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = RovexoTokens.SpaceMd)
                .height(SearchFieldHeight)
                .clip(SearchFieldShape)
                .border(1.dp, RovexoTokens.Outline, SearchFieldShape)
                .background(RovexoTokens.Surface)
                .clickable(onClick = onSearch)
                .padding(horizontal = RovexoTokens.SpaceMd)
                .semantics { contentDescription = searchDescription },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                painter = painterResource(R.drawable.ic_shell_search),
                contentDescription = null,
                tint = RovexoTokens.Primary,
                modifier = Modifier.size(20.dp),
            )
            Spacer(modifier = Modifier.size(RovexoTokens.SpaceSm))
            Text(
                text = searchDescription,
                color = SearchPlaceholder,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        AnimatedVisibility(
            visible = showCategoryRail,
            enter = slideInVertically(tween(HOME_CHROME_ANIMATION_MS)) { -it } +
                expandVertically(tween(HOME_CHROME_ANIMATION_MS)) +
                fadeIn(tween(HOME_CHROME_ANIMATION_MS)),
            exit = slideOutVertically(tween(HOME_CHROME_ANIMATION_MS)) { -it } +
                shrinkVertically(tween(HOME_CHROME_ANIMATION_MS)) +
                fadeOut(tween(HOME_CHROME_ANIMATION_MS)),
        ) {
            Column {
                Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
                HomeCategoryRail(onOpenCategory = onOpenCategory)
            }
        }
    }
}

@Composable
private fun HomeBottomNavigation(
    selected: HomeShellDestination,
    searchReturnTo: HomeShellDestination,
    onSelect: (HomeShellDestination) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(HomeBottomNavigationHeight)
            .background(RovexoTokens.Background),
    ) {
        HorizontalDivider(color = RovexoTokens.Outline, thickness = 1.dp)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
        ) {
            HomeNavItem(
                selected = selected == HomeShellDestination.Home ||
                    (selected == HomeShellDestination.Search && searchReturnTo == HomeShellDestination.Home),
                icon = R.drawable.ic_shell_home,
                label = stringResource(R.string.home_nav_home),
                onClick = { onSelect(HomeShellDestination.Home) },
            )
            HomeNavItem(
                selected = selected == HomeShellDestination.Browse ||
                    (selected == HomeShellDestination.Search && searchReturnTo == HomeShellDestination.Browse),
                icon = R.drawable.ic_shell_browse,
                label = stringResource(R.string.home_nav_browse),
                onClick = { onSelect(HomeShellDestination.Browse) },
            )
            HomeNavItem(
                selected = selected == HomeShellDestination.Sell,
                icon = R.drawable.ic_shell_sell,
                label = stringResource(R.string.home_nav_sell),
                onClick = { onSelect(HomeShellDestination.Sell) },
            )
            HomeNavItem(
                selected = selected == HomeShellDestination.Messages,
                icon = R.drawable.ic_shell_messages,
                label = stringResource(R.string.home_nav_messages),
                onClick = { onSelect(HomeShellDestination.Messages) },
            )
            HomeNavItem(
                selected = selected == HomeShellDestination.Profile,
                icon = R.drawable.ic_shell_profile,
                label = stringResource(R.string.home_nav_profile),
                onClick = { onSelect(HomeShellDestination.Profile) },
            )
        }
    }
}

@Composable
private fun RowScope.HomeNavItem(
    selected: Boolean,
    icon: Int,
    label: String,
    onClick: () -> Unit,
) {
    val tint = if (selected) RovexoTokens.Primary else InactiveNavTint
    Column(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .clickable(onClick = onClick)
            .semantics { contentDescription = label },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            painter = painterResource(icon),
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(24.dp),
        )
        Text(
            text = label,
            color = tint,
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
        )
    }
}

@Composable
private fun HomeShellContent(
    destination: HomeShellDestination,
    feedState: HomeFeedUiState,
    feedListState: LazyListState,
    viewAllSpec: HomeDiscoveryRailSpec?,
    viewAllSeed: HomeRailResultsSeed?,
    viewAllSavedSlugs: Set<String>,
    onRetry: () -> Unit,
    onRetryNextPage: () -> Unit,
    onVisibleItems: (lastVisibleItemIndex: Int, totalItemsCount: Int) -> Unit,
    onToggleSave: (String) -> Unit,
    onViewAll: (HomeDiscoveryRailSpec) -> Unit,
    onCloseViewAll: () -> Unit,
    onCloseSearch: () -> Unit,
    onOpenSearch: () -> Unit,
    onSignOut: () -> Unit,
) {
    val resultsSpec = viewAllSpec
    if (resultsSpec != null) {
        CategoryResultsScreen(
            spec = resultsSpec,
            seed = viewAllSeed,
            savedSlugs = viewAllSavedSlugs,
            onBack = onCloseViewAll,
            onToggleSave = onToggleSave,
        )
        return
    }
    when (destination) {
        HomeShellDestination.Home -> HomeDiscoveryFeed(
            state = feedState,
            listState = feedListState,
            onRetry = onRetry,
            onRetryNextPage = onRetryNextPage,
            onVisibleItems = onVisibleItems,
            onToggleSave = onToggleSave,
            onViewAll = onViewAll,
        )
        HomeShellDestination.Browse -> BrowseScreen(
            onOpenSearch = onOpenSearch,
        )
        HomeShellDestination.Search -> SearchScreen(onClose = onCloseSearch)
        HomeShellDestination.Sell -> SellScreen()
        HomeShellDestination.Messages -> ShellPlaceholder(
            title = stringResource(R.string.home_placeholder_messages_title),
            body = stringResource(R.string.home_placeholder_messages_body),
        )
        HomeShellDestination.Notifications -> ShellPlaceholder(
            title = stringResource(R.string.home_placeholder_notifications_title),
            body = stringResource(R.string.home_placeholder_notifications_body),
        )
        HomeShellDestination.Profile -> ProfileShellPlaceholder(onSignOut = onSignOut)
    }
}

@Composable
private fun HomeDiscoveryFeed(
    state: HomeFeedUiState,
    listState: LazyListState,
    onRetry: () -> Unit,
    onRetryNextPage: () -> Unit,
    onVisibleItems: (lastVisibleItemIndex: Int, totalItemsCount: Int) -> Unit,
    onToggleSave: (String) -> Unit,
    onViewAll: (HomeDiscoveryRailSpec) -> Unit,
) {
    LaunchedEffect(listState) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.maxOfOrNull { it.index } ?: -1
            last to info.totalItemsCount
        }
            .distinctUntilChanged()
            .collect { (lastVisibleItemIndex, totalItemsCount) ->
                onVisibleItems(lastVisibleItemIndex, totalItemsCount)
            }
    }
    val readyState = state as? HomeFeedUiState.Ready
    val lastVisibleIndex = listState.layoutInfo.visibleItemsInfo.maxOfOrNull { it.index } ?: -1
    val railCount = readyState?.rails?.size ?: 0
    val showNextPageSpinner = readyState != null &&
        readyState.isLoadingNextPage &&
        readyState.items.isNotEmpty() &&
        lastVisibleIndex >= (railCount - 1).coerceAtLeast(0)
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val cardWidth = homeRailCardWidth(maxWidth)
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .semantics { contentDescription = "home-listing-rails" },
            contentPadding = PaddingValues(bottom = RovexoTokens.SpaceLg),
            verticalArrangement = Arrangement.spacedBy(RovexoTokens.SpaceLg),
        ) {
            when (state) {
                HomeFeedUiState.Loading -> {
                    items(
                        items = (0 until HOME_FEED_PLACEHOLDER_COUNT).toList(),
                        key = { index -> "home-feed-skeleton-$index" },
                    ) {
                        HomeDiscoveryRailSkeleton(
                            cardWidth = cardWidth,
                            contentDescription = stringResource(R.string.home_feed_loading),
                        )
                    }
                }
                HomeFeedUiState.Empty -> {
                    item(key = "home-feed-initial-status") {
                        HomeFeedStatus(title = stringResource(R.string.home_feed_empty))
                    }
                }
                is HomeFeedUiState.Error -> {
                    item(key = "home-feed-initial-status") {
                        HomeFeedError(
                            disconnected = state.disconnected,
                            onRetry = onRetry,
                        )
                    }
                }
                is HomeFeedUiState.Ready -> {
                    items(state.rails.filter { it.items.isNotEmpty() }, key = { it.spec.id.name }) { rail ->
                        HomeDiscoveryRailRow(
                            rail = rail,
                            cardWidth = cardWidth,
                            onToggleSave = onToggleSave,
                            onViewAll = onViewAll,
                        )
                    }
                    if (showNextPageSpinner) {
                        item(key = "home-feed-next-status") {
                            HomeFeedNextPageLoading()
                        }
                    } else if (state.nextPageError) {
                        item(key = "home-feed-next-status") {
                            HomeFeedNextPageError(onRetry = onRetryNextPage)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeFeedStatus(
    title: String,
    showProgress: Boolean = false,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = RovexoTokens.SpaceLg),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (showProgress) {
            CircularProgressIndicator(color = RovexoTokens.Primary)
            Spacer(modifier = Modifier.height(RovexoTokens.SpaceMd))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            color = SearchPlaceholder,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun HomeFeedError(
    disconnected: Boolean,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = RovexoTokens.SpaceLg),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = if (disconnected) {
                stringResource(R.string.network_disconnected)
            } else {
                stringResource(R.string.fail_closed_title)
            },
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = RovexoTokens.OnBackground,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
        Text(
            text = stringResource(R.string.home_feed_try_again),
            style = MaterialTheme.typography.bodyMedium,
            color = SearchPlaceholder,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceLg))
        Button(
            onClick = onRetry,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = SearchFieldShape,
        ) {
            Text(stringResource(R.string.retry))
        }
    }
}

@Composable
private fun HomeFeedNextPageLoading() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = RovexoTokens.SpaceMd),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(24.dp),
            strokeWidth = 2.dp,
            color = RovexoTokens.Primary,
        )
    }
}

@Composable
private fun HomeFeedNextPageError(onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = RovexoTokens.SpaceMd),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.home_feed_couldnt_load_more),
            style = MaterialTheme.typography.bodyMedium,
            color = SearchPlaceholder,
            textAlign = TextAlign.Center,
        )
        TextButton(onClick = onRetry) {
            Text(stringResource(R.string.retry))
        }
    }
}

@Composable
private fun ShellPlaceholder(
    title: String,
    body: String,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = RovexoTokens.SpaceLg),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
            color = RovexoTokens.OnBackground,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
        Text(
            text = body,
            style = MaterialTheme.typography.bodyMedium,
            color = SearchPlaceholder,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun ProfileShellPlaceholder(onSignOut: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = RovexoTokens.SpaceLg),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.home_placeholder_profile_title),
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
            color = RovexoTokens.OnBackground,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
        Text(
            text = stringResource(R.string.home_placeholder_profile_body),
            style = MaterialTheme.typography.bodyMedium,
            color = SearchPlaceholder,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceLg))
        Button(
            onClick = onSignOut,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = SearchFieldShape,
        ) {
            Text(stringResource(R.string.sign_out))
        }
    }
}
