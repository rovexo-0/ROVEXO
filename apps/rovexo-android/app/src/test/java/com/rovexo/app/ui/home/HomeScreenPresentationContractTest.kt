package com.rovexo.app.ui.home

import com.rovexo.app.navigation.AppRoute
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class HomeScreenPresentationContractTest {
    private fun read(path: String): String = File(path).readText()

    private val home = read("src/main/java/com/rovexo/app/ui/home/HomeScreen.kt")
    private val navigation = read("src/main/java/com/rovexo/app/navigation/AppNavigation.kt")
    private val routing = read("src/main/java/com/rovexo/app/navigation/AuthRouting.kt")
    private val routes = read("src/main/java/com/rovexo/app/navigation/AppRoute.kt")
    private val theme = read("src/main/java/com/rovexo/app/core/theme/RovexoTheme.kt")
    private val strings = read("src/main/res/values/strings.xml")

    @Test
    fun homeExistsExactlyOnceAsAuthenticatedDestination() {
        assertTrue(File("src/main/java/com/rovexo/app/ui/home/HomeScreen.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreen2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomePage.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/Homepage.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/RovexoHome.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/LegacyHome.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreenNew.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreenOld.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreenV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/InfiniteHomeScreen.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/MarketplaceFeedScreen.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/DiscoveryFeedScreen.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/NativeHome.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/MarketplaceHome.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/DiscoveryHome.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/home/HomeFeedV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/home/HomeFeedViewModelV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/authenticated/AuthenticatedPlaceholderScreen.kt").exists())
        assertTrue(navigation.contains("HomeScreen("))
        assertFalse(navigation.contains("AuthenticatedPlaceholderScreen"))
        assertEquals(1, Regex("fun HomeScreen\\(").findAll(home).count())
    }

    @Test
    fun authenticatedRouteResolvesToHomeAndUnauthenticatedToLogin() {
        assertTrue(routing.contains("is AuthState.Authenticated -> AppRoute.Authenticated"))
        assertTrue(routing.contains("AuthState.Unauthenticated"))
        assertTrue(routing.contains("else -> AppRoute.Login"))
        assertTrue(routing.contains("fun signOutDestination(): String = AppRoute.Login"))
        assertEquals("authenticated", AppRoute.Authenticated)
        assertEquals("login", AppRoute.Login)
        assertTrue(navigation.contains("composable(AppRoute.Authenticated)"))
        assertTrue(navigation.contains("onSignOut = authViewModel::signOut"))
        assertTrue(navigation.contains("popUpTo(navController.graph.id) { inclusive = true }"))
        assertFalse(routes.contains("HomeScreen2"))
    }

    @Test
    fun homeIsNotBehindLoginInBackStack() {
        assertTrue(navigation.contains("popUpTo(navController.graph.id) { inclusive = true }"))
        assertTrue(home.contains("BackHandler"))
        assertTrue(home.contains("moveTaskToBack(true)"))
        assertFalse(home.contains("AppRoute.Login"))
        assertFalse(home.contains("navController.navigate(AppRoute.Login)"))
    }

    @Test
    fun homepageStartsWithSearchBarWithoutTopHeaderLogo() {
        assertTrue(home.contains("HomeHeader"))
        assertFalse(home.contains("R.string.app_name"))
        assertTrue(strings.contains("<string name=\"app_name\">ROVEXO</string>"))
        assertTrue(home.contains("home_search_entry"))
        assertTrue(strings.contains("<string name=\"home_search_entry\">Search on ROVEXO</string>"))
        assertTrue(home.contains("ic_shell_search"))
        assertTrue(home.contains("HomeCategoryRail"))
        assertFalse(home.contains("fun HeaderIconButton"))
        assertFalse(home.contains("onMessages"))
        assertFalse(home.contains("onNotifications"))
        assertFalse(home.contains("onAccount"))
        assertFalse(home.contains("Discover on ROVEXO"))
        assertTrue(File("src/main/res/drawable/ic_shell_search.xml").exists())
        val header = home.substringAfter("private fun HomeHeader(").substringBefore("private fun HomeBottomNavigation(")
        assertFalse(header.contains("R.string.app_name"))
        assertFalse(header.contains("titleLarge"))
        assertFalse(header.contains("height(48.dp)"))
        assertFalse(header.contains("ic_shell_messages"))
        assertFalse(header.contains("ic_shell_notifications"))
        assertFalse(header.contains("ic_shell_profile"))
        assertTrue(header.contains("HomeCategoryRail"))
        assertTrue(header.contains("home_search_entry"))
        assertTrue(header.contains("SearchFieldHeight"))
        assertTrue(home.contains("SearchFieldHeight = 38.dp"))
        assertTrue(header.contains("verticalAlignment = Alignment.CenterVertically"))
        assertTrue(header.contains("Modifier.size(20.dp)"))
        assertTrue(header.indexOf("home_search_entry") < header.indexOf("HomeCategoryRail("))
        assertFalse(header.contains("ic_shell_camera"))
        assertFalse(header.contains("height(42.dp)"))
        assertFalse(header.contains("height(40.dp)"))
        assertFalse(header.contains("height(36.dp)"))
        assertTrue(header.contains("RovexoTokens.SpaceSm"))
        assertTrue(header.contains("RovexoTokens.SpaceXs"))
    }

    @Test
    fun categoryRailIsHorizontalCatalogMasterDiscovery() {
        val rail = read("src/main/java/com/rovexo/app/ui/home/components/HomeCategoryRail.kt")
        val ssot = read("src/main/java/com/rovexo/app/home/model/HomeCategoryRailSsot.kt")
        assertTrue(home.contains("HomeCategoryRail"))
        assertTrue(rail.contains("LazyRow"))
        assertTrue(rail.contains("RailChipHeight = 36.dp"))
        assertFalse(rail.contains("RailChipHeight = 40.dp"))
        assertTrue(rail.contains("height(RailChipHeight)"))
        assertTrue(rail.contains("onOpenCategory"))
        assertEquals(1, Regex("fun HomeCategoryRail\\(").findAll(rail).count())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/HomeCategoryRailV2.kt").exists())
        assertFalse(rail.contains("rememberSaveable"))
        assertFalse(ssot.contains("ALL_ID"))
        assertTrue(ssot.contains("womens-fashion"))
        assertTrue(ssot.contains("Women's Fashion"))
        assertTrue(ssot.contains("vehicle-parts"))
        assertFalse(ssot.contains("\"vehicles\""))
        assertFalse(home.contains("Discover on ROVEXO"))
        assertFalse(rail.contains("HomeFeedViewModel"))
        assertFalse(rail.contains("/api/homepage/feed"))
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/CategoryHomeScreen.kt").exists())
    }

    @Test
    fun bottomNavigationExistsWithHomeActiveAccent() {
        assertTrue(home.contains("mutableStateOf(HomeShellDestination.Home)"))
        assertTrue(home.contains("HomeBottomNavigation"))
        assertTrue(home.contains("HomeBottomNavigationHeight = 64.dp"))
        assertTrue(home.contains("height(HomeBottomNavigationHeight)"))
        assertFalse(home.contains("NavigationBar("))
        assertFalse(home.contains("NavigationBarItem"))
        assertTrue(home.contains("home_nav_home"))
        assertTrue(home.contains("home_nav_browse"))
        assertTrue(home.contains("home_nav_sell"))
        assertTrue(home.contains("home_nav_messages"))
        assertTrue(home.contains("home_nav_profile"))
        assertTrue(strings.contains("<string name=\"home_nav_home\">Home</string>"))
        assertTrue(strings.contains("<string name=\"home_nav_browse\">Browse</string>"))
        assertTrue(strings.contains("<string name=\"home_nav_search\">Search</string>"))
        assertTrue(strings.contains("<string name=\"home_nav_sell\">Sell</string>"))
        assertTrue(strings.contains("<string name=\"home_nav_messages\">Messages</string>"))
        assertTrue(strings.contains("<string name=\"home_nav_profile\">Profile</string>"))
        assertTrue(home.contains("RovexoTokens.Primary"))
        assertTrue(home.contains("if (selected) RovexoTokens.Primary else InactiveNavTint"))
        assertTrue(theme.contains("Color(0xFF9333EA)"))
        assertTrue(home.contains("RovexoTokens.Background"))
        assertTrue(theme.contains("Color(0xFFFFFFFF)"))
        assertFalse(home.contains("HomeTheme"))
        assertFalse(home.contains("MarketplaceTheme"))
        assertFalse(home.contains("HomeColors"))
        assertFalse(home.contains("HomeTypography"))
        val bottom = home.substringAfter("private fun HomeBottomNavigation(").substringBefore("private fun RowScope.HomeNavItem(")
        assertTrue(bottom.contains("HomeBottomNavigationHeight"))
        assertTrue(bottom.contains("ic_shell_browse"))
        assertTrue(bottom.contains("home_nav_browse"))
        assertFalse(bottom.contains("ic_shell_search"))
        assertFalse(bottom.contains("home_nav_search"))
        assertFalse(bottom.contains("WindowInsets.navigationBars"))
        assertFalse(bottom.contains("windowInsetsPadding(WindowInsets.navigationBars)"))
        assertFalse(bottom.contains("systemBarsPadding"))
        assertFalse(bottom.contains("safeDrawingPadding"))
        assertFalse(home.contains("SYSTEM_UI_FLAG_IMMERSIVE"))
        assertFalse(home.contains("home_footer"))
        assertFalse(home.contains("Copyright"))
        assertEquals(1, Regex("private fun HomeBottomNavigation\\(").findAll(home).count())
        assertEquals(1, Regex("rememberLazyListState\\(").findAll(home).count())
        val mainActivity = read("src/main/java/com/rovexo/app/MainActivity.kt")
        assertTrue(mainActivity.contains("enableEdgeToEdge()"))
        assertTrue(mainActivity.contains("hide(WindowInsetsCompat.Type.navigationBars())"))
        assertTrue(mainActivity.contains("BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE"))
        assertTrue(mainActivity.contains("setDecorFitsSystemWindows(window, false)"))
        assertFalse(mainActivity.contains("SYSTEM_UI_FLAG_IMMERSIVE"))
        assertFalse(mainActivity.contains("Type.statusBars()"))
    }

    @Test
    fun chromeHidesTogetherOnForwardScrollAndShowsAtTop() {
        assertTrue(home.contains("fun resolveHomeChromeVisible("))
        assertTrue(home.contains("AnimatedVisibility("))
        assertTrue(home.contains("slideInVertically"))
        assertTrue(home.contains("slideOutVertically"))
        assertTrue(home.contains("HOME_CHROME_ANIMATION_MS = 180"))
        assertTrue(home.contains("showCategoryRail = showChrome"))
        assertTrue(home.contains("visible = showChrome"))
        assertTrue(home.contains("firstVisibleItemIndex"))
        assertTrue(home.contains("firstVisibleItemScrollOffset"))
        assertEquals(1, Regex("rememberLazyListState\\(").findAll(home).count())
        assertTrue(resolveHomeChromeVisible(0, 0, 0, 0, currentlyVisible = false))
        assertFalse(resolveHomeChromeVisible(1, 10, 0, 0, currentlyVisible = true))
        assertFalse(resolveHomeChromeVisible(0, 40, 0, 10, currentlyVisible = true))
        assertTrue(resolveHomeChromeVisible(0, 10, 0, 40, currentlyVisible = false))
        assertTrue(resolveHomeChromeVisible(0, 0, 2, 80, currentlyVisible = false))
        assertTrue(resolveHomeChromeVisible(1, 10, 2, 0, currentlyVisible = false))
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeBottomNavigation.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeBottomNavigationV2.kt").exists())
        val listingCard = read("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt")
        assertTrue(listingCard.contains("fun HomeListingCard("))
        val viewModel = read("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt")
        assertTrue(viewModel.contains("PREFETCH_THRESHOLD = 10"))
        assertFalse(home.contains("scale("))
    }

    @Test
    fun discoverOnRovexoTitleIsRemoved() {
        assertFalse(home.contains("Discover on ROVEXO"))
        assertFalse(home.contains("home_discover_title"))
        assertFalse(strings.contains("Discover on ROVEXO"))
        assertTrue(home.contains("home_search_entry"))
        assertTrue(home.contains("LazyColumn"))
        assertTrue(home.contains("HomeDiscoveryRailRow"))
        assertFalse(home.contains("LazyVerticalGrid"))
        assertFalse(home.contains("GridCells.Fixed(2)"))
        val railRow = read("src/main/java/com/rovexo/app/ui/home/components/HomeDiscoveryRailRow.kt")
        assertTrue(railRow.contains("HomeListingCard("))
        assertEquals(1, Regex("fun HomeScreen\\(").findAll(home).count())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreenV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/Homepage.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomePage.kt").exists())
    }

    @Test
    fun hasNoFakeListingsOrMarketplaceData() {
        assertFalse(home.contains("home_discover_title"))
        assertFalse(home.contains("Discover on ROVEXO"))
        assertFalse(home.contains("home-discover-title"))
        assertTrue(home.contains("HomeDiscoveryFeed"))
        assertTrue(home.contains("LazyColumn"))
        assertTrue(home.contains("HomeDiscoveryRailRow"))
        assertTrue(home.contains("HomeDiscoveryRailSkeleton"))
        assertFalse(home.contains("LazyVerticalGrid"))
        assertFalse(home.contains("GridCells.Fixed(2)"))
        assertTrue(home.contains("HomeFeedUiState.Loading"))
        assertTrue(home.contains("HomeFeedUiState.Empty"))
        assertTrue(home.contains("HomeFeedUiState.Error"))
        assertTrue(home.contains("home_feed_loading"))
        assertTrue(home.contains("home_feed_empty"))
        assertTrue(home.contains("fail_closed_title"))
        assertFalse(strings.contains("home_discover_title"))
        assertFalse(strings.contains("Discover on ROVEXO"))
        assertTrue(strings.contains("<string name=\"home_feed_empty\">No listings available right now.</string>"))
        assertFalse(strings.contains("Marketplace content will be connected in the next pass."))
        assertFalse(home.contains("fake listing", ignoreCase = true))
        assertFalse(home.contains("seedDemo"))
        assertFalse(home.contains("canonical-demo"))
        assertFalse(home.contains("placeholder product"))
        assertFalse(home.contains("/api/saved"))
        assertFalse(home.contains("page=2"))
        assertFalse(home.contains("Page 1"))
        assertFalse(home.contains("Page 2"))
        assertFalse(home.contains("Page 3"))
        assertFalse(home.contains("pagination"))
        assertFalse(home.contains("LoginWaveLayer"))
        assertFalse(home.contains("SplashScreen"))
        assertFalse(home.contains("rx_primary_emblem"))
    }

    @Test
    fun doesNotModifyAuthArchitecture() {
        assertTrue(home.contains("onSignOut"))
        assertFalse(home.contains("AuthRepository"))
        assertFalse(home.contains("AuthViewModel"))
        assertFalse(home.contains("EncryptedSessionStore"))
        assertFalse(home.contains("signIn("))
        assertFalse(home.contains("signUp("))
        val login = read("src/main/java/com/rovexo/app/ui/login/LoginScreen.kt")
        assertTrue(login.contains("fun LoginScreen("))
        val register = read("src/main/java/com/rovexo/app/ui/register/CreateAccountScreen.kt")
        assertTrue(register.contains("fun CreateAccountScreen("))
    }

    @Test
    fun infiniteFeedIsContinuousWithoutVisiblePagination() {
        assertTrue(home.contains("rememberLazyListState()"))
        assertTrue(home.contains("state = listState"))
        assertTrue(home.contains("snapshotFlow"))
        assertTrue(home.contains("onVisibleItems"))
        assertTrue(home.contains("retryNextPage"))
        assertTrue(home.contains("HomeDiscoveryRailRow"))
        assertTrue(home.contains("LazyColumn"))
        assertFalse(home.contains("LazyVerticalGrid"))
        assertFalse(home.contains("GridCells.Fixed(2)"))
        assertTrue(home.contains("HomeFeedNextPageLoading"))
        assertTrue(home.contains("showNextPageSpinner"))
        assertTrue(home.contains("lastVisibleIndex >= (railCount - 1).coerceAtLeast(0)"))
        assertFalse(home.contains("if (state.isLoadingNextPage) {"))
        assertTrue(home.contains("HomeFeedNextPageError"))
        assertTrue(home.contains("home_feed_couldnt_load_more"))
        assertTrue(home.contains("HomeFeedPerformance.markFirstListingRender"))
        assertTrue(strings.contains("Couldn\\'t load more") || strings.contains("Couldn't load more"))
        val listingCard = read("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt")
        assertTrue(listingCard.contains("fun HomeListingCard("))
        assertTrue(listingCard.contains("AsyncImage"))
        assertFalse(listingCard.contains("/_next/image"))
        assertFalse(listingCard.contains("crossfade(true)"))
        val railRow = read("src/main/java/com/rovexo/app/ui/home/components/HomeDiscoveryRailRow.kt")
        assertTrue(railRow.contains("HomeListingCard("))
        assertTrue(railRow.contains("LazyRow"))
        assertTrue(railRow.contains("homeRailCardWidth"))
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/HomeListingCardV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/RailCard.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/FashionCard.kt").exists())
        assertFalse(home.contains("HomeScreenV2"))
        assertFalse(home.contains("InfiniteHomeScreen"))
        assertFalse(home.contains("page complete", ignoreCase = true))
        assertFalse(strings.contains("Page 1"))
        assertFalse(strings.contains("Page 2"))
        val viewModel = read("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt")
        assertTrue(viewModel.contains("PREFETCH_THRESHOLD = 10"))
        assertTrue(viewModel.contains("fun remainingListings"))
        assertTrue(viewModel.contains("shouldPrefetch"))
        assertTrue(viewModel.contains("fun loadNextPage()"))
        assertTrue(viewModel.contains("mergeUniqueById"))
        assertTrue(viewModel.contains("nextPageInFlight"))
        assertEquals(1, Regex("class HomeFeedViewModel\\(").findAll(viewModel).count())
        assertEquals(1, Regex("fun HomeScreen\\(").findAll(home).count())
        val card = read("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt")
        assertTrue(card.contains("fun HomeListingCard("))
        assertTrue(card.contains("onToggleSave"))
        assertTrue(card.contains("ic_heart_outline"))
        assertTrue(card.contains("ListingCardPricing.formatInclLabel"))
        assertTrue(home.contains("onToggleSave"))
        assertTrue(home.contains("feedViewModel::toggleSave"))
        assertFalse(card.contains("formatRatingLabel"))
        assertFalse(card.contains("5.5%"))
        assertFalse(File("src/main/java/com/rovexo/app/home/FavoritesRepository.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/home/SaveRepository.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/home/SavedListingsRepository.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/home/FavoriteEngine.kt").exists())
    }

    @Test
    fun homepageRailsReuseCanonicalCardAndExactHeadings() {
        val ssot = read("src/main/java/com/rovexo/app/home/model/HomeDiscoveryRailsSsot.kt")
        val railRow = read("src/main/java/com/rovexo/app/ui/home/components/HomeDiscoveryRailRow.kt")
        assertEquals(
            listOf(
                "✨ Just Listed",
                "👗 Vintage Finds",
                "♻️ Pre-Loved",
                "💰 Great Value",
                "👟 Fashion",
                "🏠 Home",
                "⚽ Sports",
                "📱 Electronics",
                "🎮 Gaming",
                "🚗 Motors",
            ),
            Regex("icon = \"(.+)\",\\s+title = \"(.+)\"").findAll(ssot).map { match ->
                "${match.groupValues[1]} ${match.groupValues[2]}"
            }.toList(),
        )
        assertFalse(ssot.contains("Trending Today"))
        assertFalse(ssot.contains("TRENDING"))
        assertFalse(railRow.contains("No listings available right now."))
        assertTrue(home.contains("it.items.isNotEmpty()"))
        assertTrue(ssot.contains("VIEW_ALL_LABEL = \"View all →\""))
        assertTrue(railRow.contains("HomeListingCard("))
        assertTrue(railRow.contains("HomeDiscoveryRailsSsot.VIEW_ALL_LABEL"))
        assertTrue(railRow.contains("CARD_SPAN"))
        assertEquals(1, Regex("fun HomeListingCard\\(").findAll(read("src/main/java/com/rovexo/app/ui/home/components/HomeListingCard.kt")).count())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/HomeScreenV2.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/TrendingCard.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/VintageCard.kt").exists())
        assertFalse(File("src/main/java/com/rovexo/app/ui/home/components/CategoryCard.kt").exists())
        assertTrue(home.contains("BrowseScreen("))
        assertTrue(home.contains("onOpenSearch = onOpenSearch"))
        assertTrue(home.contains("CategoryResultsScreen("))
        assertTrue(home.contains("HomeViewAllTiming.markTap()"))
        assertFalse(home.contains("launch = browseLaunch"))
        assertFalse(home.contains("browseLaunch = BrowseLaunch.Root"))
        assertFalse(home.contains("HomeShellDestination.Browse -> SearchScreen"))
        assertTrue(home.contains("resetSession()"))
        assertTrue(home.contains("shouldResetBrowseSession"))
        assertTrue(
            shouldResetBrowseSession(
                HomeShellDestination.Browse,
                HomeShellDestination.Home,
                HomeShellDestination.Home,
            ),
        )
        assertTrue(
            shouldResetBrowseSession(
                HomeShellDestination.Browse,
                HomeShellDestination.Home,
                HomeShellDestination.Profile,
            ),
        )
        assertFalse(
            shouldResetBrowseSession(
                HomeShellDestination.Browse,
                HomeShellDestination.Home,
                HomeShellDestination.Browse,
            ),
        )
        assertFalse(
            shouldResetBrowseSession(
                HomeShellDestination.Home,
                HomeShellDestination.Home,
                HomeShellDestination.Browse,
            ),
        )
        assertTrue(
            shouldResetBrowseSession(
                HomeShellDestination.Search,
                HomeShellDestination.Browse,
                HomeShellDestination.Home,
            ),
        )
        assertFalse(
            shouldResetBrowseSession(
                HomeShellDestination.Browse,
                HomeShellDestination.Home,
                HomeShellDestination.Search,
            ),
        )
        val feedViewModel = read("src/main/java/com/rovexo/app/home/HomeFeedViewModel.kt")
        assertTrue(feedViewModel.contains("when (val source = spec.source)"))
        assertFalse(feedViewModel.contains("categoryListings(\"womens-fashion\""))
        assertFalse(feedViewModel.contains("queryListings(\"vintage\""))
    }

    @Test
    fun sellToHomeRefreshesPage1AndOtherTabsDoNot() {
        assertTrue(shouldRefreshHomePage1(HomeShellDestination.Sell, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Home, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Browse, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Search, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Messages, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Profile, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Notifications, HomeShellDestination.Home))
        assertFalse(shouldRefreshHomePage1(HomeShellDestination.Sell, HomeShellDestination.Browse))
        val back = home.substringAfter("BackHandler {").substringBefore("val onOpenCategory")
        assertTrue(back.contains("shouldRefreshHomePage1(destination, HomeShellDestination.Home)"))
        assertTrue(back.contains("feedViewModel.refreshPage1()"))
        val select = home.substringAfter("val onSelectDestination").substringBefore("Scaffold(")
        assertTrue(select.contains("shouldRefreshHomePage1(destination, next)"))
        assertTrue(select.contains("feedViewModel.refreshPage1()"))
        val refreshBeforeAssign = select.indexOf("shouldRefreshHomePage1(destination, next)")
        val assignDestination = select.indexOf("destination = next")
        assertTrue(refreshBeforeAssign >= 0)
        assertTrue(assignDestination > refreshBeforeAssign)
        assertFalse(select.contains("feedViewModel.retry()"))
        assertFalse(select.contains("loadInitial()"))
        assertFalse(back.contains("feedViewModel.retry()"))
        assertFalse(back.contains("loadInitial()"))
    }
}
