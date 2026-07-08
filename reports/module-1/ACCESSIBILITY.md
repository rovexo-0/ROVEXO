# Module 1 — Accessibility Report

## Module 1 improvements

- Category capsules remain keyboard-focusable links with `:focus-visible` outline
- Search camera button removed — reduces confusing disabled control for screen readers
- Category rail retains `aria-label="Categories"`

## Existing platform accessibility (unchanged)

- `ThemeProvider` respects system preference
- Bottom nav uses `aria-current` for active tab
- ListingCard favourite buttons have aria labels
- Form inputs use associated labels in settings/appearance

## Not run in Module 1

- axe-core automated scan
- VoiceOver / TalkBack manual pass
- WCAG contrast audit across dark mode tokens

## Recommendation

Run axe on homepage + search + appearance settings before production deploy.
