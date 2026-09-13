---
name: mobile-ux
description: >
  Apply this skill whenever building or designing any user interface that will be used
  on mobile devices. Triggers include: any app, PWA, or web interface; any time a modal,
  popup, overlay, notification, or interstitial is being designed or built; any time
  content is injected dynamically into a page; any time a new screen or flow is being
  added. Key phrases: "popup", "modal", "overlay", "notification", "interstitial",
  "onboarding step", "prompt", "card", "banner", "splash". Also apply at the START of
  any new app build to establish mobile-first principles from day one.
---

# Mobile UX Principles

## The core rule

**If it's important enough to show, it gets its own page.**

Never inject important content below the fold and hope the user scrolls. On mobile, content below the initial viewport effectively does not exist. Users will not scroll to find a notification prompt, an explanation, a cultural note, or a personal message. If you need them to see it, give it a dedicated full-screen page with its own navigation.

---

## Rule 1 — No important content below the fold

Content injected dynamically into an existing page almost always lands below the fold on mobile. This includes:

- Notification permission prompts
- Onboarding explanations
- Cultural context cards
- Personal messages or notes
- Tutorial steps
- Confirmation screens

**The fix:** make these their own page. Full viewport, centered content, clear CTA to advance. The user arrives, reads, taps, moves on.

**Wrong:**
```javascript
// Injecting content into an existing page after load
setTimeout(() => {
  document.getElementById('some-container').innerHTML = importantContent;
}, 1500);
```

**Right:**
```javascript
// Navigate to a dedicated page
function showImportantContent() {
  go('p-important-content');
}
```

---

## Rule 2 — Every popup is a page

Modals, overlays, and popups are often used to avoid creating a new page. On desktop this is fine. On mobile it creates problems:

- Content gets clipped by keyboard
- Scroll behaviour inside modals is unreliable
- Users can't orient themselves (no back button, no URL change)
- Critical content may appear off-screen

**Default to pages, not popups.** The only exceptions are:
- Confirmation dialogs ("are you sure?") — single line, no scrolling needed
- Phrase detail cards tapped deliberately by the user — they know where they are

Everything else — prompts, explanations, multi-step flows, personal messages — gets its own page.

---

## Rule 3 — Thumb reach design

On mobile, the thumb controls everything. Design all primary interactions for the bottom 60% of the screen.

- **Primary CTAs** (continue, confirm, submit): bottom of screen, full width or large pill
- **Destructive actions** (delete, skip, cancel): top of screen or behind an extra tap
- **Navigation**: bottom tabs or bottom-anchored buttons
- **Content**: centered vertically in the viewport, not pushed to the top

Never put the primary action at the top of a long-scroll page. The user has to read, then scroll back up, then tap. That friction kills completion rates.

---

## Rule 4 — One thing per screen

Each screen should have one job. If a screen is trying to:
- Show information AND collect input
- Explain something AND ask for permission
- Display a list AND prompt an action

...it should be split into two screens.

Single-purpose screens are faster to understand, easier to navigate back from, and far less likely to have content fall below the fold.

---

## Rule 5 — No scroll-dependent flows

If completing a flow requires the user to scroll, the flow will break for a significant portion of users. Design flows so that:

- Every required element is visible without scrolling
- If scrolling is unavoidable, the page has a sticky CTA at the bottom
- Long content (like terms, explanations, or long lists) gets its own dedicated scrollable page — not injected into a flow page

---

## Rule 6 — Generous tap targets

Minimum tap target size: **44×44px** (Apple HIG standard). In practice:

- Buttons: minimum 44px height, prefer 48-52px
- List items: minimum 44px height
- Icon buttons: 44×44px minimum, with invisible tap area padding if needed
- Never rely on small text links for primary actions

---

## Rule 7 — Keyboard awareness

On mobile, the software keyboard takes up 40-50% of the screen when open. Design input flows knowing this:

- Input fields should be in the top half of the screen so they remain visible when keyboard opens
- Submit buttons should be above the keyboard or sticky at the bottom
- Never put essential context (instructions, labels) above an input field where it will scroll off when the keyboard opens
- Test every input flow with the keyboard open

---

## Rule 8 — PWA-specific rules

Progressive Web Apps installed to home screen have additional constraints:

- No browser chrome (no back button, no URL bar) — your app must provide its own navigation
- Links that open in a new tab will leave the PWA context — use in-app navigation
- Magic links and OAuth redirects open in the browser, not the PWA — avoid these auth patterns
- Service workers must be hosted files, not blob URLs
- The status bar area at the top may overlay content — use `viewport-fit=cover` and safe area insets

---

## Checklist — use before building any new screen or flow

- [ ] Does any important content appear below the fold on a 375px wide screen?
- [ ] Am I injecting content into an existing page instead of navigating to a new one?
- [ ] Is the primary CTA reachable without scrolling?
- [ ] Does every tap target meet the 44px minimum?
- [ ] Does the flow work with the keyboard open?
- [ ] If this is a PWA, does any step open the browser?
- [ ] Does each screen have one clear job?
- [ ] Is there a clear way to go back or exit at every step?

---

## Applied examples

| Pattern | Wrong | Right |
|---------|-------|-------|
| Notification prompt | Injected below course content, appears after 1.5s delay | Dedicated full-screen page shown before course loads |
| Phonics explanation | Rendered inside a card that may be below fold | Own page with full viewport, one sound per screen |
| Cultural context | Appended to unit completion card | Full-screen interstitial with "got it →" CTA |
| Personal message | Overlaid on top of existing page | Own page, centered, unhurried |
| Quiz exit | No exit option visible | Subtle back button top-left, always visible |
| Onboarding step | Long scrollable form | One question per screen, progress indicator |

