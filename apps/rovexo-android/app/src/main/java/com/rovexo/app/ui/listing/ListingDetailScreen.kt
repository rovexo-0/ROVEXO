package com.rovexo.app.ui.listing

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.snapping.rememberSnapFlingBehavior
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.rovexo.app.R
import com.rovexo.app.RovexoApplication
import com.rovexo.app.core.theme.RovexoTokens
import com.rovexo.app.demand.DemandBadge
import com.rovexo.app.demand.DemandJson
import com.rovexo.app.home.model.GbpMoneyFormat
import com.rovexo.app.home.model.ListingCardPricing
import com.rovexo.app.listing.model.ListingDescriptionPreview
import com.rovexo.app.listing.model.PublicListingDetail
import com.rovexo.app.listing.report.ListingReportContract
import com.rovexo.app.listing.report.ListingReportNavigator
import com.rovexo.app.listing.report.ListingReportScreen
import com.rovexo.app.listing.report.ListingReportTarget
import com.rovexo.app.ui.home.HomeShellDestination
import com.rovexo.app.ui.home.components.humanizeListingCondition
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

private val Muted = Color(0xFF6B7280)
private val InactiveNavTint = Color(0xFF6B7280)
private val SavedHeartTint = Color(0xFFDC2626)
private val Divider = Color(0xFFE5E7EB)
private val CtaRadius = RoundedCornerShape(10.dp)
private val BottomNavHeight = 64.dp
private val HeaderHeight = 56.dp
private val CtaHeight = 56.dp
private val GalleryRatio = 1f

@Composable
fun ListingDetailScreen(
    slug: String,
    onBack: () -> Unit,
    onOpenShop: (String) -> Unit = {},
) {
    val context = LocalContext.current
    val app = context.applicationContext as RovexoApplication
    val viewModel: ListingDetailViewModel = viewModel(
        key = slug,
        factory = remember(slug, app) {
            ListingDetailViewModel.factory(
                apiClient = app.container.apiClient,
                slug = slug,
                savedRepository = app.container.homeFeedRepository,
                sessionStore = app.container.sessionStore,
            )
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val saved by viewModel.saved.collectAsStateWithLifecycle()
    val ownListing by viewModel.ownListing.collectAsStateWithLifecycle()
    val origin = app.container.config.apiBaseUrl.trimEnd('/')
    var reportTarget by remember(slug) { mutableStateOf<ListingReportTarget?>(null) }
    var reportStack by remember(slug) { mutableStateOf<List<ListingReportScreen>?>(null) }

    BackHandler {
        val stack = reportStack
        if (stack != null) {
            val next = ListingReportNavigator.back(stack)
            if (next.isEmpty()) {
                reportStack = null
                reportTarget = null
            } else {
                reportStack = next
            }
        } else {
            onBack()
        }
    }

    LaunchedEffect(state) {
        if (state is ListingDetailUiState.Success) {
            delay(ListingDetailViewModel.PAGE_VIEW_DWELL_MS)
            viewModel.onSuccessDwellElapsed()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(RovexoTokens.Background)
                .windowInsetsPadding(WindowInsets.statusBars)
                .semantics { contentDescription = "listing-detail-screen" },
        ) {
            val success = state as? ListingDetailUiState.Success
            val listing = success?.listing
            val showCtas = listing != null && shouldShowCommerceCtas(listing, ownListing)
            ListingDetailHeader(
                saved = saved,
                onBack = onBack,
                onFavourite = viewModel::toggleSave,
                onShare = {
                    val shareSlug = listing?.slug ?: slug
                    shareListing(context, listingUrl(origin, shareSlug))
                },
                onReport = {
                    val item = listing ?: return@ListingDetailHeader
                    reportTarget = ListingReportTarget.from(item)
                    reportStack = ListingReportNavigator.start()
                },
            )
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                when (val current = state) {
                    ListingDetailUiState.Loading -> ListingDetailLoading()
                    is ListingDetailUiState.Error -> ListingDetailError(
                        retryable = current.retryable,
                        onRetry = viewModel::retry,
                    )
                    is ListingDetailUiState.Success -> ListingDetailContent(
                        listing = current.listing,
                        onViewShop = {
                            val handle = shopHandle(
                                current.listing.sellerUsername,
                                current.listing.sellerId,
                            )
                            if (handle.isNotEmpty()) onOpenShop(handle)
                        },
                    )
                }
            }
            listing?.takeIf { showCtas }?.let { item ->
                ListingCtaBar(
                    onMakeOffer = { openUrl(context, listingUrl(origin, item.slug)) },
                    onBuyNow = { openUrl(context, listingUrl(origin, item.slug)) },
                )
            }
            ListingDetailBottomNavigation(onSelect = { onBack() })
        }
        val activeTarget = reportTarget
        val activeStack = reportStack
        if (activeTarget != null && activeStack != null) {
            ListingReportFlow(
                target = activeTarget,
                stack = activeStack,
                apiClient = app.container.apiClient,
                onStackChange = { next ->
                    if (next.isEmpty()) {
                        reportStack = null
                        reportTarget = null
                    } else {
                        reportStack = next
                    }
                },
                onClose = {
                    reportStack = null
                    reportTarget = null
                },
                onOpenNotice = {
                    openUrl(context, origin + ListingReportContract.NOTICE_PATH)
                },
            )
        }
    }
}

@Composable
private fun ListingDetailHeader(
    saved: Boolean,
    onBack: () -> Unit,
    onFavourite: () -> Unit,
    onShare: () -> Unit,
    onReport: () -> Unit,
) {
    var menuOpen by remember { mutableStateOf(false) }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(HeaderHeight)
            .background(RovexoTokens.Background)
            .padding(horizontal = 8.dp)
            .semantics { contentDescription = "listing-detail-header" },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HeaderIconButton(
            icon = R.drawable.ic_nav_back,
            contentDescription = stringResource(R.string.browse_back),
            onClick = onBack,
        )
        Spacer(modifier = Modifier.weight(1f))
        HeaderIconButton(
            icon = if (saved) R.drawable.ic_heart_filled else R.drawable.ic_heart_outline,
            contentDescription = stringResource(
                if (saved) R.string.listing_detail_unfavourite else R.string.listing_detail_favourite,
            ),
            tint = if (saved) SavedHeartTint else RovexoTokens.OnBackground,
            onClick = onFavourite,
        )
        Box {
            HeaderIconButton(
                icon = R.drawable.ic_nav_more,
                contentDescription = stringResource(R.string.listing_detail_more),
                onClick = { menuOpen = true },
            )
            DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.listing_detail_share)) },
                    leadingIcon = {
                        Icon(
                            painter = painterResource(R.drawable.ic_sell_share),
                            contentDescription = null,
                            tint = RovexoTokens.OnBackground,
                        )
                    },
                    onClick = {
                        menuOpen = false
                        onShare()
                    },
                )
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.listing_detail_report)) },
                    leadingIcon = {
                        Icon(
                            painter = painterResource(R.drawable.ic_listing_flag),
                            contentDescription = null,
                            tint = RovexoTokens.OnBackground,
                        )
                    },
                    onClick = {
                        menuOpen = false
                        onReport()
                    },
                )
            }
        }
    }
}

@Composable
private fun HeaderIconButton(
    icon: Int,
    contentDescription: String,
    onClick: () -> Unit,
    tint: Color = RovexoTokens.OnBackground,
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painter = painterResource(icon),
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(22.dp),
        )
    }
}

@Composable
private fun ListingDetailLoading() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .semantics { contentDescription = "listing-detail-loading" },
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = RovexoTokens.Primary)
    }
}

@Composable
private fun ListingDetailError(
    retryable: Boolean,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(RovexoTokens.SpaceLg)
            .semantics { contentDescription = "listing-detail-error" },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = stringResource(R.string.fail_closed_title),
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
            color = RovexoTokens.OnBackground,
        )
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
        Text(
            text = stringResource(R.string.fail_closed_body),
            style = MaterialTheme.typography.bodyMedium,
            color = RovexoTokens.OnBackground.copy(alpha = 0.7f),
        )
        if (retryable) {
            Spacer(modifier = Modifier.height(RovexoTokens.SpaceMd))
            Button(onClick = onRetry) {
                Text(text = stringResource(R.string.home_feed_try_again))
            }
        }
    }
}

@Composable
private fun ListingDetailContent(
    listing: PublicListingDetail,
    onViewShop: () -> Unit,
) {
    val gallery = listing.gallery()
    val feeLabel = ListingCardPricing.formatInclRovexoFeeLabel(
        itemPrice = listing.price,
        freeDelivery = listing.freeDelivery,
        shippingPrice = listing.shippingPrice,
    )
    val subtitle = ListingCardPricing.listingSubtitle(listing.colour, listing.material)
    val sellerRating = listing.sellerRating ?: listing.rating
    val sellerReviews = listing.sellerReviewCount ?: listing.reviewCount
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(bottom = RovexoTokens.SpaceMd)
            .semantics { contentDescription = "listing-detail-success" },
    ) {
        ListingGallery(
            title = listing.title,
            gallery = gallery,
            isFeatured = listing.isFeatured,
            showFastDispatch = ListingCardPricing.isFastDispatch(listing.dispatchTimeDays),
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = RovexoTokens.SpaceMd)
                .padding(top = RovexoTokens.SpaceMd),
        ) {
            if (listing.status == "sold") {
                ListingStatusChip(text = stringResource(R.string.listing_detail_sold))
                Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
            } else if (listing.sellerOnHoliday) {
                ListingStatusChip(text = stringResource(R.string.listing_detail_holiday))
                Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
            }
            Text(
                text = listing.title,
                color = RovexoTokens.OnBackground,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    lineHeight = 26.sp,
                ),
            )
            if (DemandJson.showsBadge(listing.demandEligibility)) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = DemandBadge.COPY,
                    color = RovexoTokens.Primary,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                )
            }
            if (!subtitle.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    color = Muted,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = GbpMoneyFormat.format(listing.price),
                color = RovexoTokens.Primary,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 28.sp,
                    lineHeight = 32.sp,
                ),
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 2.dp),
            ) {
                Text(
                    text = feeLabel,
                    color = Muted,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Icon(
                    painter = painterResource(R.drawable.ic_listing_fee_shield),
                    contentDescription = stringResource(R.string.listing_detail_fee_shield),
                    tint = Color.Unspecified,
                    modifier = Modifier.size(24.dp),
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            ListingSellerRow(
                listing = listing,
                rating = sellerRating,
                reviews = sellerReviews,
                onViewShop = onViewShop,
            )
            ListingDescription(text = listing.description)
            ListingSectionDivider()
            ListingDetailsSection(listing = listing)
            ListingSectionDivider()
        }
    }
}

@Composable
private fun ListingGallery(
    title: String,
    gallery: List<String>,
    isFeatured: Boolean,
    showFastDispatch: Boolean,
) {
    val listState = rememberLazyListState()
    val page by remember { derivedStateOf { listState.firstVisibleItemIndex } }
    val total = gallery.size.coerceAtLeast(1)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(GalleryRatio)
            .background(RovexoTokens.SurfaceVariant),
    ) {
        if (gallery.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(
                    painter = painterResource(R.drawable.ic_listing_image_placeholder),
                    contentDescription = title,
                    tint = RovexoTokens.Outline,
                    modifier = Modifier.size(48.dp),
                )
            }
        } else {
            LazyRow(
                state = listState,
                flingBehavior = rememberSnapFlingBehavior(lazyListState = listState),
                modifier = Modifier.fillMaxSize(),
            ) {
                itemsIndexed(gallery) { _, url ->
                    AsyncImage(
                        model = url,
                        contentDescription = title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillParentMaxWidth()
                            .fillMaxHeight()
                            .background(RovexoTokens.SurfaceVariant),
                    )
                }
            }
        }
        Column(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            if (isFeatured) {
                GalleryBadge(
                    text = stringResource(R.string.listing_detail_featured),
                    background = RovexoTokens.Primary,
                )
            }
            if (showFastDispatch) {
                GalleryBadge(
                    text = stringResource(R.string.listing_detail_fast_dispatch),
                    background = Color(0xFF111827),
                )
            }
        }
        if (gallery.isNotEmpty()) {
            Text(
                text = stringResource(R.string.listing_detail_pagination, page + 1, total),
                color = Color.White,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(12.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color(0xB30F172A))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
    }
    if (gallery.size > 1) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            gallery.forEachIndexed { index, _ ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(
                            if (index == page) RovexoTokens.OnBackground else Color(0xFFD4D4D8),
                        ),
                )
            }
        }
    }
}

@Composable
private fun GalleryBadge(text: String, background: Color) {
    Text(
        text = text,
        color = Color.White,
        style = MaterialTheme.typography.labelSmall.copy(
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.4.sp,
        ),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(background)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

@Composable
private fun ListingSectionDivider() {
    HorizontalDivider(
        color = Divider,
        modifier = Modifier
            .padding(top = 8.dp, bottom = 20.dp)
            .semantics { contentDescription = "listing-detail-section-divider" },
    )
}

@Composable
private fun ListingDetailsSection(listing: PublicListingDetail) {
    val rows = ListingDetailRows(listing)
    if (rows.isEmpty()) return
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = "listing-detail-details" },
    ) {
        Text(
            text = stringResource(R.string.listing_detail_details),
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
        )
        Spacer(modifier = Modifier.height(4.dp))
        rows.forEachIndexed { index, row ->
            ListingDetailAttributeRow(row = row)
            if (index != rows.lastIndex) {
                HorizontalDivider(color = Divider)
            }
        }
    }
}

@Composable
private fun ListingDetailRows(listing: PublicListingDetail): List<ListingDetailAttribute> {
    val rows = ArrayList<ListingDetailAttribute>(8)
    listing.categoryLabel?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_category),
                value = value,
                showChevron = true,
            ),
        )
    }
    listing.brand?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_brand),
                value = value,
                showChevron = true,
            ),
        )
    }
    humanizeListingCondition(listing.condition)?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_condition),
                value = value,
                showChevron = true,
            ),
        )
    }
    listing.material?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_material),
                value = value,
                showChevron = false,
            ),
        )
    }
    listing.colour?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_colour),
                value = value,
                showChevron = false,
            ),
        )
    }
    listing.size?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_size),
                value = value,
                showChevron = false,
            ),
        )
    }
    listingUploadedLabel(listing.createdAt)?.let { value ->
        rows.add(
            ListingDetailAttribute(
                label = stringResource(R.string.listing_detail_uploaded),
                value = value,
                showChevron = false,
            ),
        )
    }
    rows.add(
        ListingDetailAttribute(
            label = stringResource(R.string.listing_detail_dispatch),
            value = ListingCardPricing.dispatchLabel(listing.dispatchTimeDays),
            showChevron = false,
        ),
    )
    return rows
}

@Composable
private fun ListingDetailAttributeRow(row: ListingDetailAttribute) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 48.dp)
            .padding(vertical = 12.dp)
            .semantics { contentDescription = "${row.label} ${row.value}" },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = row.label,
            color = Muted,
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = row.value,
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        if (row.showChevron) {
            Icon(
                painter = painterResource(R.drawable.ic_nav_chevron),
                contentDescription = null,
                tint = Muted,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

private data class ListingDetailAttribute(
    val label: String,
    val value: String,
    val showChevron: Boolean,
)

@Composable
private fun ListingSellerRow(
    listing: PublicListingDetail,
    rating: Double,
    reviews: Int,
    onViewShop: () -> Unit,
) {
    val ratingLabel = if (rating > 0.0) {
        String.format(Locale.UK, "%.1f", rating)
    } else {
        "0.0"
    }
    val reviewLabel = if (reviews > 0) " ($reviews)" else ""
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (!listing.sellerAvatar.isNullOrEmpty()) {
            AsyncImage(
                model = listing.sellerAvatar,
                contentDescription = listing.sellerName,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(RovexoTokens.SurfaceVariant),
            )
        } else {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(RovexoTokens.SurfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = listing.sellerName.take(1).uppercase(Locale.UK),
                    color = RovexoTokens.OnBackground,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                )
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = listing.sellerName,
                color = RovexoTokens.OnBackground,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(R.drawable.ic_listing_star),
                    contentDescription = null,
                    tint = Color.Unspecified,
                    modifier = Modifier.size(14.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = ratingLabel + reviewLabel,
                    color = Muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .clickable(onClick = onViewShop)
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .semantics { contentDescription = "View Shop" },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = stringResource(R.string.listing_detail_view_shop),
                color = RovexoTokens.Primary,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            )
            Icon(
                painter = painterResource(R.drawable.ic_nav_chevron),
                contentDescription = null,
                tint = RovexoTokens.Primary,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

@Composable
private fun ListingDescription(text: String) {
    val body = text.trim()
    if (body.isEmpty()) return
    val preview = remember(body) { ListingDescriptionPreview.of(body) }
    var expanded by remember(body) { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .padding(top = 4.dp, bottom = 8.dp)
            .semantics { contentDescription = "listing-detail-description" },
    ) {
        Text(
            text = stringResource(R.string.listing_detail_description),
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (expanded) body else preview.collapsedText,
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 22.sp),
            modifier = if (preview.canExpand) {
                Modifier.clickable { expanded = !expanded }
            } else {
                Modifier
            },
        )
        if (preview.canExpand) {
            Text(
                text = stringResource(R.string.listing_detail_description_more),
                color = RovexoTokens.Primary,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                modifier = Modifier
                    .padding(top = 6.dp)
                    .clickable { expanded = !expanded }
                    .semantics { contentDescription = "more" },
            )
        }
    }
}

@Composable
private fun ListingCtaBar(
    onMakeOffer: () -> Unit,
    onBuyNow: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth().background(RovexoTokens.Background)) {
        HorizontalDivider(color = Divider)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = RovexoTokens.SpaceMd, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(CtaHeight)
                .clip(CtaRadius)
                .border(1.5.dp, RovexoTokens.Primary, CtaRadius)
                .background(RovexoTokens.Background)
                .clickable(onClick = onMakeOffer)
                .semantics { contentDescription = "Make an Offer" },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = stringResource(R.string.listing_detail_make_offer),
                color = RovexoTokens.Primary,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
            )
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .height(CtaHeight)
                .clip(CtaRadius)
                .background(RovexoTokens.Primary)
                .clickable(onClick = onBuyNow)
                .semantics { contentDescription = "Buy Now" },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = stringResource(R.string.listing_detail_buy_now),
                color = RovexoTokens.OnPrimary,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
            )
        }
        }
    }
}

@Composable
private fun ListingDetailBottomNavigation(
    onSelect: (HomeShellDestination) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(BottomNavHeight)
            .background(RovexoTokens.Background),
    ) {
        HorizontalDivider(color = RovexoTokens.Outline, thickness = 1.dp)
        Row(modifier = Modifier.fillMaxWidth().weight(1f)) {
            ListingNavItem(
                selected = true,
                icon = R.drawable.ic_shell_home,
                label = stringResource(R.string.home_nav_home),
                onClick = { onSelect(HomeShellDestination.Home) },
            )
            ListingNavItem(
                selected = false,
                icon = R.drawable.ic_shell_browse,
                label = stringResource(R.string.home_nav_browse),
                onClick = { onSelect(HomeShellDestination.Browse) },
            )
            ListingNavItem(
                selected = false,
                icon = R.drawable.ic_shell_sell,
                label = stringResource(R.string.home_nav_sell),
                onClick = { onSelect(HomeShellDestination.Sell) },
            )
            ListingNavItem(
                selected = false,
                icon = R.drawable.ic_shell_messages,
                label = stringResource(R.string.home_nav_messages),
                onClick = { onSelect(HomeShellDestination.Messages) },
            )
            ListingNavItem(
                selected = false,
                icon = R.drawable.ic_shell_profile,
                label = stringResource(R.string.home_nav_profile),
                onClick = { onSelect(HomeShellDestination.Profile) },
            )
        }
    }
}

@Composable
private fun RowScope.ListingNavItem(
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
private fun ListingStatusChip(text: String) {
    Text(
        text = text,
        color = RovexoTokens.OnPrimary,
        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(RovexoTokens.Primary)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

private fun shouldShowCommerceCtas(listing: PublicListingDetail, ownListing: Boolean): Boolean {
    if (ownListing) return false
    if (listing.sellerOnHoliday) return false
    if (listing.status == "sold") return false
    if (listing.availability == "out_of_stock") return false
    if (listing.stock <= 0) return false
    return true
}

private fun listingUrl(origin: String, slug: String): String {
    return "$origin/listing/${Uri.encode(slug.trim())}"
}

private fun shopHandle(username: String?, sellerId: String): String {
    val handle = username?.trim()?.lowercase().orEmpty()
    return handle.ifEmpty { sellerId.trim() }
}

private fun openUrl(context: android.content.Context, url: String) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}

private fun shareListing(context: android.content.Context, url: String) {
    runCatching {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, url)
        }
        context.startActivity(Intent.createChooser(send, context.getString(R.string.listing_detail_share)))
    }
}

internal fun listingUploadedLabel(
    createdAt: String?,
    nowMillis: Long = System.currentTimeMillis(),
): String? {
    val createdMillis = parseIsoToMillis(createdAt) ?: return null
    val delta = nowMillis - createdMillis
    if (delta < 0L) return null
    val minutes = delta / 60_000L
    val hours = minutes / 60L
    val days = hours / 24L
    return when {
        minutes < 1L -> "Just now"
        minutes < 60L -> if (minutes == 1L) "1 minute ago" else "$minutes minutes ago"
        hours < 24L -> if (hours == 1L) "1 hour ago" else "$hours hours ago"
        days < 7L -> if (days == 1L) "1 day ago" else "$days days ago"
        else -> formatUploadedDate(createdMillis)
    }
}

internal fun parseIsoToMillis(createdAt: String?): Long? {
    val raw = createdAt?.trim().orEmpty()
    if (raw.isEmpty()) return null
    val match = ISO_INSTANT_REGEX.matchEntire(raw) ?: return null
    val fraction = match.groupValues[7]
    val millis = when {
        fraction.isEmpty() -> 0
        else -> fraction.padEnd(3, '0').take(3).toIntOrNull() ?: 0
    }
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    calendar.clear()
    calendar.set(Calendar.YEAR, match.groupValues[1].toInt())
    calendar.set(Calendar.MONTH, match.groupValues[2].toInt() - 1)
    calendar.set(Calendar.DAY_OF_MONTH, match.groupValues[3].toInt())
    calendar.set(Calendar.HOUR_OF_DAY, match.groupValues[4].toInt())
    calendar.set(Calendar.MINUTE, match.groupValues[5].toInt())
    calendar.set(Calendar.SECOND, match.groupValues[6].toInt())
    calendar.set(Calendar.MILLISECOND, millis)
    return calendar.timeInMillis
}

private fun formatUploadedDate(millis: Long): String {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    calendar.timeInMillis = millis
    val months = arrayOf(
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    )
    val day = calendar.get(Calendar.DAY_OF_MONTH)
    val month = months[calendar.get(Calendar.MONTH)]
    val year = calendar.get(Calendar.YEAR)
    return "$day $month $year"
}

private val ISO_INSTANT_REGEX = Regex(
    "^(\\d{4})-(\\d{2})-(\\d{2})[T ](\\d{2}):(\\d{2}):(\\d{2})(?:\\.(\\d+))?(?:Z|[+-]\\d{2}:?\\d{2})?$",
)
