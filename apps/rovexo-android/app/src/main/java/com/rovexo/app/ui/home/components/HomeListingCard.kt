package com.rovexo.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.rovexo.app.R
import com.rovexo.app.core.theme.RovexoTokens
import com.rovexo.app.demand.DemandBadge
import com.rovexo.app.demand.DemandJson
import com.rovexo.app.home.model.GbpMoneyFormat
import com.rovexo.app.home.model.HomeListing
import com.rovexo.app.home.model.ListingCardPricing
import java.util.Locale

private val CardShape = RoundedCornerShape(RovexoTokens.Radius)
private val SavedHeartTint = Color(0xFFDC2626)

@Composable
fun HomeListingCard(
    listing: HomeListing,
    modifier: Modifier = Modifier,
    onToggleSave: (String) -> Unit = {},
    onOpenListing: (String) -> Unit = {},
) {
    val preferred = listing.preferredImageUrl()
    val fallback = listing.fallbackImageUrl()
    var imageSrc by remember(listing.id, preferred, fallback) { mutableStateOf(preferred) }
    var showPlaceholder by remember(listing.id) { mutableStateOf(preferred.isEmpty()) }
    val meta = listingMetaLine(listing.size, listing.condition)
    val inclLabel = ListingCardPricing.formatInclLabel(
        itemPrice = listing.price,
        freeDelivery = listing.freeDelivery,
        shippingPrice = listing.shippingPrice,
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onOpenListing(listing.slug) },
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 5f)
                .clip(CardShape)
                .background(RovexoTokens.SurfaceVariant),
            contentAlignment = Alignment.Center,
        ) {
            if (!showPlaceholder && imageSrc.isNotEmpty()) {
                AsyncImage(
                    model = imageSrc,
                    contentDescription = listing.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                    onError = {
                        if (imageSrc == preferred && fallback.isNotEmpty()) {
                            imageSrc = fallback
                        } else {
                            showPlaceholder = true
                        }
                    },
                )
            } else {
                Icon(
                    painter = painterResource(R.drawable.ic_listing_image_placeholder),
                    contentDescription = null,
                    tint = RovexoTokens.Outline,
                    modifier = Modifier.size(40.dp),
                )
            }
            ListingBadges(
                isFeatured = listing.isFeatured,
                isBumped = listing.isBumped,
                inDemand = DemandJson.showsBadge(listing.demandEligibility),
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(RovexoTokens.SpaceXs),
            )
            SaveHeartButton(
                saved = listing.isSaved,
                onClick = { onToggleSave(listing.slug) },
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(RovexoTokens.SpaceXs),
            )
        }
        Spacer(modifier = Modifier.height(RovexoTokens.SpaceSm))
        Text(
            text = listing.title,
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        if (meta.isNotEmpty()) {
            Text(
                text = meta,
                color = RovexoTokens.OnBackground.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodySmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Text(
            text = GbpMoneyFormat.format(listing.price),
            color = RovexoTokens.OnBackground,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = inclLabel,
                color = RovexoTokens.Primary,
                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Icon(
                painter = painterResource(R.drawable.ic_listing_incl_shield),
                contentDescription = null,
                tint = RovexoTokens.Primary,
                modifier = Modifier.size(12.dp),
            )
        }
    }
}

@Composable
private fun SaveHeartButton(
    saved: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val description = stringResource(
        if (saved) R.string.home_listing_unsave else R.string.home_listing_save,
    )
    Box(
        modifier = modifier
            .size(32.dp)
            .border(1.dp, RovexoTokens.Outline, CircleShape)
            .clip(CircleShape)
            .background(RovexoTokens.Surface)
            .clickable(onClick = onClick)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painter = painterResource(
                if (saved) R.drawable.ic_heart_filled else R.drawable.ic_heart_outline,
            ),
            contentDescription = null,
            tint = if (saved) SavedHeartTint else RovexoTokens.OnBackground,
            modifier = Modifier.size(18.dp),
        )
    }
}

@Composable
private fun ListingBadges(
    isFeatured: Boolean,
    isBumped: Boolean,
    inDemand: Boolean,
    modifier: Modifier = Modifier,
) {
    if (!isFeatured && !isBumped && !inDemand) return
    Column(modifier = modifier) {
        if (isFeatured) {
            BadgeChip(text = stringResource(R.string.home_badge_featured))
        }
        if (isBumped) {
            if (isFeatured) Spacer(modifier = Modifier.height(4.dp))
            BadgeChip(text = stringResource(R.string.home_badge_boost))
        }
        if (inDemand) {
            if (isFeatured || isBumped) Spacer(modifier = Modifier.height(4.dp))
            BadgeChip(text = DemandBadge.COPY)
        }
    }
}

@Composable
private fun BadgeChip(text: String) {
    Text(
        text = text,
        color = RovexoTokens.OnPrimary,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(RovexoTokens.Primary)
            .padding(horizontal = 6.dp, vertical = 2.dp),
    )
}

internal fun listingMetaLine(size: String?, condition: String?): String {
    val sizeLabel = size?.trim()?.takeIf { it.isNotEmpty() }
    val conditionLabel = humanizeListingCondition(condition)
    return listOfNotNull(sizeLabel, conditionLabel).joinToString(" · ")
}

internal fun humanizeListingCondition(raw: String?): String? {
    val text = raw.orEmpty().replace(Regex("[_-]+"), " ").trim()
    if (text.isEmpty() || text.equals("unknown", ignoreCase = true)) return null
    return text.replaceFirstChar { char ->
        if (char.isLowerCase()) char.titlecase(Locale.UK) else char.toString()
    }
}
