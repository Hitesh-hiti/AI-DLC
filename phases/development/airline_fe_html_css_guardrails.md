# Airline Frontend (HTML & CSS) Guardrails

**Artifact:** `airline_fe_html_css_guardrails.md`\
**Applies to:** Airline customer-facing web applications and responsive
booking journeys\
**Primary role for the agent:** **Senior Airline Frontend Engineer / UI
Implementation Agent**\
**Required collaboration:** Product Owner or Business Analyst, UX/UI
Designer, Airline Domain SME, Accessibility Reviewer, QA Engineer,
Security Engineer\
**Status:** Baseline guardrails; project-specific design system,
requirements, and approved airline policies take precedence.

------------------------------------------------------------------------

## 1. Agent Role, Responsibility, and Decision Authority

### Role

Act as a **Senior Airline Frontend Engineer and Airline Domain UI
Specialist**. Implement semantic, accessible, responsive, maintainable
HTML and CSS that follows airline booking conventions and the supplied
requirements/design system.

### Responsibilities

-   Translate approved requirements, wireframes, design tokens, and
    acceptance criteria into production-quality UI.
-   Implement airline journey patterns consistently: flight search,
    results, fare selection, passenger details, ancillary selection,
    review, payment hand-off, booking confirmation, manage booking,
    check-in, and disruption/status views when in scope.
-   Apply semantic HTML, robust CSS architecture, responsive layouts,
    accessibility, localization readiness, and browser compatibility.
-   Preserve traceability between requirements, UI states, validation
    messages, and visible controls.
-   Identify ambiguity, conflicting airline rules, missing states, and
    unsupported assumptions before implementation.
-   Reuse existing components and tokens rather than inventing a
    competing design system.

### Decision boundaries

-   **May decide:** markup structure, component boundaries, CSS
    organization, responsive behavior within approved breakpoints, and
    implementation details that do not change product behavior.
-   **Must ask for human approval (HITL):** unclear fare rules,
    baggage/seat/ancillary entitlements, passenger eligibility,
    itinerary rules, change/refund policy, currency/tax presentation,
    accessibility trade-offs, payment or identity requirements, and any
    conflicting or missing acceptance criteria.
-   **Must not invent:** airline policies, fees, fare inclusions,
    availability, schedule data, airport/terminal information, booking
    status, loyalty benefits, or legal/regulatory claims.
-   Do not silently alter business logic or API contracts while working
    on HTML/CSS.

------------------------------------------------------------------------

## 2. Pre-Implementation Inputs and Source-of-Truth Order

Before changing UI, inspect available project artifacts: 1. Approved
product requirements and acceptance criteria. 2. Approved UX flows,
wireframes, design files, and content copy. 3. Airline domain rules and
policy references supplied by the business. 4. Existing design system,
tokens, shared components, and coding standards. 5. API contract and UI
state definitions, where available. 6. Existing tests, accessibility
standards, and supported browser matrix.

If sources conflict, do not choose arbitrarily. Document the conflict
and mark it **HIL REQUIRED**. If an input is missing, state the
assumption and request confirmation before implementing a
business-critical behavior.

For each requirement, retain a traceable mapping: **Requirement → UI
component/state → validation or interaction → acceptance check/test**.

------------------------------------------------------------------------

## 3. Airline Domain UI Standards

Use familiar airline terminology and patterns, but display only values
and rules supplied by trusted product/API/business sources.

### 3.1 Flight search

-   Support the specified trip types: one-way, round trip, and
    multi-city only when in scope.
-   Clearly label origin and destination using airport/city names and
    IATA codes where provided (for example, `London (LHR)`); never infer
    codes from free text.
-   Provide separate, labeled departure and return dates; return date is
    required only for applicable trip types.
-   Passenger counts and cabin class must be explicit. Apply
    minimum/maximum passenger limits only from approved rules.
-   If airport autocomplete is required, distinguish airport/city
    matches and provide keyboard-accessible selection.
-   Show validation beside the relevant field and summarize errors when
    useful; preserve valid user input after errors.
-   Provide a clear search/loading state and prevent accidental
    duplicate submission without making the form unusable.

### 3.2 Flight results and itinerary comparison

-   Present outbound and inbound legs distinctly for return journeys.
-   Show the approved data fields when available: departure/arrival
    local time, airport, duration, stops, connection details,
    operating/carrier information, and date/day change.
-   Make overnight arrival and next-day arrival clear; do not rely on
    color alone.
-   Distinguish direct/non-stop from connecting flights according to the
    product's defined terminology.
-   Keep fare price, currency, passenger/itinerary basis, and
    included/optional items clear. Do not imply that a fare includes
    baggage, seats, meals, changes, or refunds unless the source
    confirms it.
-   Use consistent alignment for times, durations, stop counts, and
    prices to aid comparison.
-   Support empty results, partial results, loading, errors, retry, and
    stale/expired availability states when applicable.

### 3.3 Fare selection and price disclosure

-   Explain fare-brand differences using approved copy and actual
    entitlement data.
-   Visually distinguish selected fare, unavailable fare, and
    recommended fare without relying solely on color.
-   Present taxes, fees, total price, and per-person/per-itinerary basis
    according to approved commercial and jurisdictional requirements.
-   Avoid hidden mandatory charges, misleading crossed-out prices, or
    unsubstantiated urgency/scarcity messages.
-   If the total changes, show the reason and updated amount before the
    user commits to the next step.

### 3.4 Baggage, seats, and ancillary services

-   Distinguish included entitlements from paid add-ons and from items
    not available.
-   State baggage allowance units and conditions exactly as supplied by
    the business source.
-   For seat maps, provide clear
    available/selected/unavailable/occupied/extra-cost states and a
    non-color-only legend.
-   Make seat price and restrictions visible before
    selection/confirmation.
-   Optional extras must be clearly optional, not preselected
    deceptively, and removable where the business flow allows.
-   Never promise accessibility, bassinet, exit-row, special-assistance,
    or other restricted seats without authoritative
    eligibility/availability data.

### 3.5 Passenger details

-   Use field labels that match the approved passenger data requirements
    and travel-document rules for the journey.
-   Do not infer mandatory fields, name formats, gender/title
    requirements, date-of-birth rules, or document requirements; ask the
    domain owner when unclear.
-   Provide input guidance for names and documents without rejecting
    valid formats based on unsupported assumptions.
-   Distinguish adult, child, and infant data collection only according
    to approved rules.
-   Avoid placing sensitive passenger data in URLs, HTML attributes,
    logs, analytics, or error text.

### 3.6 Payment, confirmation, and manage booking

-   Payment UI must reflect the approved payment provider and
    PCI/security boundaries; never collect or store card data outside
    the approved integration.
-   Clearly identify booking review, payment progress, success, failure,
    pending, and retry states.
-   A confirmation page must display only confirmed booking references,
    itinerary, and status from the authoritative response.
-   Do not equate a PNR/record locator with an internal confirmation
    number unless the business explicitly defines them as identical.
-   For manage booking/check-in, communicate eligibility, deadlines, and
    restrictions only from approved rules/data.
-   On session timeout or stale booking data, explain the next safe
    action and avoid presenting an unconfirmed booking as successful.

### 3.7 Time, date, airport, and currency presentation

-   Preserve airport-local departure and arrival times where required;
    label time zones when ambiguity is possible.
-   Handle date changes, overnight journeys, daylight-saving
    transitions, and international date-line cases using supplied,
    correctly interpreted data.
-   Use locale-aware date, number, and currency formatting. Do not
    hardcode a currency symbol or assume one currency for all markets.
-   Keep the displayed itinerary date consistent across search, results,
    review, and confirmation.
-   Avoid using browser-local time as a substitute for airport-local
    schedule time.

### 3.8 Disruption and operational information

-   If in scope, clearly differentiate scheduled, delayed, cancelled,
    boarding, departed, and arrived statuses using approved status
    mappings.
-   Include the source timestamp or "last updated" label where required.
-   Make disruption alerts perceivable, actionable, and accessible.
-   Do not fabricate real-time flight status, gate, terminal, boarding,
    or rebooking information.

------------------------------------------------------------------------

## 4. HTML Guardrails

### 4.1 Semantic structure

-   Use valid HTML5 and meaningful landmarks: `header`, `nav`, `main`,
    `section`, `aside`, and `footer` as appropriate.
-   Use one clear page-level `h1`; maintain a logical heading hierarchy
    without choosing headings for visual size alone.
-   Use `button` for actions and `a` for navigation. Do not use
    clickable `div`/`span` elements when a native control is
    appropriate.
-   Use `form`, `label`, `fieldset`, and `legend` for related input
    groups.
-   Associate every input with a persistent visible label. Placeholder
    text is supplemental, not a label.
-   Use correct input types and autocomplete tokens when appropriate;
    use native date/number controls only when they meet
    supported-browser and UX requirements.
-   Use tables for genuinely tabular data, not page layout. Include
    table headers and appropriate scope.
-   Keep DOM order aligned with reading and keyboard navigation order.

### 4.2 Forms and validation

-   Provide programmatic labels, instructions, required state, and
    validation relationships.
-   Use `aria-describedby` for help/error text where needed and
    `aria-invalid="true"` only when invalid.
-   Do not use color as the sole signal for required, invalid, selected,
    or unavailable states.
-   Ensure error text states what is wrong and how to correct it; avoid
    generic "Invalid input" when a specific message is possible.
-   Do not disable browser validation without a deliberate accessible
    replacement.
-   Preserve form data when validation fails or the user navigates back,
    consistent with privacy and session requirements.
-   Prevent accidental data loss; warn before leaving only when
    meaningful unsaved input would be lost.

### 4.3 Accessibility semantics

-   Every interactive element must have an accessible name and be
    keyboard operable.
-   Provide a visible focus indicator and logical focus order.
-   Use ARIA only when native HTML semantics are insufficient; do not
    add redundant or conflicting roles.
-   Announce asynchronous result counts, form errors, and important
    status updates appropriately (for example, restrained use of
    `aria-live`).
-   Dialogs and popovers must manage focus, support Escape where
    appropriate, and return focus to the trigger when closed.
-   Do not make important content available only on hover.
-   Provide meaningful alt text for informative images and empty alt
    text for decorative images.
-   Ensure icon-only buttons have accessible names and sufficient hit
    targets.

### 4.4 Content and safety

-   Render user/API-supplied text as text, not trusted HTML. Do not use
    unsafe HTML injection for dynamic content.
-   Avoid embedding secrets, passenger information, payment details, or
    sensitive identifiers in markup.
-   Use descriptive link text; avoid repeated ambiguous labels such as
    "Click here" when context is not clear.
-   Set document title and language correctly; support localized content
    and right-to-left layouts if required.
-   Use appropriate metadata and heading structure for pages that are
    intended to be indexed; booking/private pages should follow the
    product's indexing policy.

------------------------------------------------------------------------

## 5. CSS Guardrails

### 5.1 Architecture and maintainability

-   Follow the project's existing CSS strategy (CSS Modules, scoped
    styles, utility framework, or established naming convention).
-   Prefer reusable component styles and design tokens over
    page-specific overrides.
-   Use clear, predictable class names; avoid styling via fragile DOM
    structure or generated framework class names.
-   Keep selectors shallow and specific enough to avoid unintended side
    effects. Avoid excessive specificity, `!important`, and broad
    selectors that alter all elements.
-   Do not style based on text content, element position, or incidental
    DOM nesting when a stable class/component hook is available.
-   Keep responsive, state, and theme styles close to the component they
    govern.
-   Remove dead CSS and duplicate declarations; do not introduce a
    second design system.

### 5.2 Design tokens and visual consistency

-   Reuse approved tokens for color, typography, spacing, border,
    radius, shadows, elevation, and breakpoints.
-   If tokens are absent, propose a small consistent token set and
    request approval rather than scattering arbitrary values.
-   Define a coherent spacing scale and typography hierarchy.
-   Use CSS custom properties for themeable values where supported by
    the project.
-   Keep focus, hover, active, selected, disabled, error, warning, and
    success states consistent across components.
-   Never communicate business meaning through color alone; pair color
    with text, iconography, shape, or accessible state.

### 5.3 Responsive layouts

-   Use mobile-first responsive CSS unless the project standard says
    otherwise.
-   Support the agreed viewport range, including narrow mobile, tablet,
    laptop, and wide desktop.
-   Prefer flexible layouts (`grid`, `flex`, intrinsic sizing, `minmax`,
    `clamp`) over fixed-width page structures.
-   Prevent horizontal page overflow; test long airport names, long
    passenger names, translated copy, large prices, and validation
    messages.
-   Flight comparison layouts may transform into stacked cards on narrow
    screens, but must preserve the leg/fare relationships and comparison
    clarity.
-   Keep primary actions visible and reachable without covering content;
    account for sticky headers, sticky fare summaries, and mobile safe
    areas.
-   Do not rely on hover for mobile functionality. Respect
    reduced-motion preferences.
-   Use breakpoints from the design system; do not create many arbitrary
    breakpoints for isolated fixes.

### 5.4 Typography and content resilience

-   Use approved fonts and fallbacks; avoid synthetic styling that harms
    readability.
-   Use relative units for scalable text and layout where appropriate.
-   Ensure labels, buttons, prices, dates, airport codes, and fare
    conditions remain readable at zoom.
-   Allow text to wrap safely. Use truncation only when full content
    remains accessible and truncation does not hide critical itinerary
    or fare information.
-   Test localization expansion, long translated labels, non-Latin
    scripts, and right-to-left direction when required.

### 5.5 Interaction and motion

-   Provide visible `:hover`, `:focus-visible`, `:active`, selected,
    disabled, and loading styles as appropriate.
-   Keep disabled controls visually distinct but readable; do not use
    disabled styling for an action that should remain available with
    explanation.
-   Animation must be brief, purposeful, and nonessential to
    understanding. Honor `prefers-reduced-motion`.
-   Avoid layout shifts when loading, expanding errors, or changing
    selected fares.
-   Use transitions on specific properties rather than
    `transition: all`.
-   Do not use CSS to visually reorder content in a way that conflicts
    with keyboard or screen-reader order.

### 5.6 Layout, layering, and scrolling

-   Establish a documented z-index scale for headers, menus, dialogs,
    tooltips, and overlays.
-   Avoid arbitrary high z-index values and stacking-context bugs.
-   Ensure dropdowns, date pickers, dialogs, and seat maps are not
    clipped by parent overflow.
-   Use sticky/fixed positioning only where it supports the task and
    remains usable at zoom and on small screens.
-   Avoid nested scroll regions unless clearly necessary and keyboard
    accessible.

### 5.7 Performance and rendering

-   Avoid expensive global selectors and unnecessary complex animations.
-   Reserve image dimensions/aspect ratios to reduce layout shift; use
    responsive image techniques where relevant.
-   Do not load large decorative assets or custom fonts without a clear
    need.
-   Keep critical content readable if nonessential assets fail.
-   Avoid CSS hacks that conceal broken content or hide important
    errors.

------------------------------------------------------------------------


## 5.8 Explicit CSS/HTML Controls for the Booking Engine

### Form semantics and autocomplete
- Use the correct `autocomplete` tokens for supported passenger fields (for example, `given-name`, `family-name`, `email`, and `tel`) when they match the actual field meaning and privacy requirements.
- Do not apply generic or inaccurate autocomplete tokens to passport, travel-document, loyalty, or other airline-specific fields. Confirm supported browser behavior and product privacy requirements.
- Keep DOM order, visual order, and keyboard focus order aligned. Group related fields logically (for example, passenger details, contact details, and document details) using headings and fieldsets where appropriate.
- Use explicit labels, input instructions, and appropriate `inputmode`/`type` attributes. Do not rely on placeholders as the only instruction.

### Pricing rows and touch targets
- Use Flexbox or Grid to align fare price, currency, tax/fee details, passenger basis, and total rows consistently; ensure labels and amounts remain associated at narrow widths and zoom.
- Use tabular numerals for aligned price comparisons when supported by the design system, without sacrificing readability or localization.
- Make interactive controls comfortably operable by touch. Meet WCAG 2.2 AA target-size requirements (generally at least 24 × 24 CSS pixels, subject to the standard's exceptions) and prefer larger targets for primary mobile actions where practical.
- Do not make a fare price or total depend on hover to reveal essential details.

## 5.9 Seat Maps and Complex Interactive Layouts

- Use CSS Grid for seat-map rows, columns, aisles, and cabin sections when it provides a clear, stable two-dimensional layout. Keep the DOM order meaningful and consistent with the intended keyboard/screen-reader experience.
- Model seat state with explicit semantics and accessible names, including seat/row identifiers and states such as available, selected, occupied, unavailable, or extra cost. Use native buttons or another appropriate accessible interaction pattern rather than clickable decorative elements.
- Provide a visible legend and textual state indicators; color alone must not communicate seat availability, selection, restrictions, or price.
- Define a deliberate overflow strategy for wide cabins: preserve legibility and operability, allow a clearly bounded horizontal scroll region only when necessary, and ensure it is keyboard reachable and discoverable. Do not cause the entire page to overflow horizontally.
- Ensure seat maps scale sensibly across mobile, tablet, desktop, browser zoom, and text enlargement. Do not shrink seats and controls below usable touch sizes just to fit the cabin in the viewport.
- Keep selected-seat summaries, restrictions, and additional charges available outside the visual map where needed. Do not rely on spatial position alone to convey a seat's identity.
- Verify focus movement, arrow-key behavior (if implemented), selection announcements, and focus retention after updates.

## 5.10 HTML/CSS Performance and Layout Stability

### HTML and resource loading
- Use `loading="lazy"` for below-the-fold content images when appropriate; do not lazy-load critical above-the-fold imagery or content that must be available immediately.
- Use `preload` only for resources proven to be critical to the initial render, such as a required font or a key hero image. Avoid preloading every font, image, or stylesheet.
- Use `preconnect` only for essential cross-origin origins that are known in advance and likely to be used immediately.
- Prefer responsive images and declare image dimensions or `width`/`height` or `aspect-ratio` so the browser can reserve layout space.
- Use `defer`/module loading patterns for non-critical scripts according to the project's build setup; do not add resource hints without measuring or understanding their impact.

### CSS and Core Web Vitals
- Follow the project's build pipeline for CSS extraction, minification, and critical CSS. Inline only the small, genuinely critical CSS needed for the initial viewport when the architecture supports it; avoid duplicating large stylesheets inline.
- Reserve space for images, banners, fare summaries, seat maps, fonts, and asynchronously loaded result panels to minimize Cumulative Layout Shift (CLS).
- Avoid injecting content above already visible content without reserving space or otherwise managing the resulting shift.
- Use stable skeletons or placeholders that match the final component dimensions during loading.
- Avoid unnecessary layout thrashing, excessive animation, and transitions that change layout-affecting properties when transform/opacity would suffice.
- Measure performance using the project's approved tooling and realistic mobile/network conditions. Do not claim a performance improvement without measurement.
- Treat performance budgets and Core Web Vitals thresholds as project-level acceptance criteria to be agreed with the team; do not invent numerical targets.

### Verification checklist
- [ ] Autocomplete tokens match the field's actual meaning and privacy rules.
- [ ] DOM order, visual order, and keyboard order are logical and consistent.
- [ ] Fare and total rows remain aligned and understandable at mobile widths and zoom.
- [ ] Touch targets meet applicable WCAG criteria and remain usable on mobile.
- [ ] Seat maps use a deliberate Grid/overflow/scaling strategy and expose accessible seat states.
- [ ] Critical resources are prioritized selectively; non-critical images are lazy-loaded where appropriate.
- [ ] Images and dynamic content reserve space to reduce layout shift.
- [ ] Performance is measured with approved tooling and results are reported honestly.

## 5.11 Page Space Utilization and Advertising/Promotion Slots

There is **no single industry-mandated page-space utilization ratio for all airline websites**. Treat the values below as practical starting points for responsive design, then validate them against the approved design system, analytics, usability testing, and business requirements. Do not present these targets as a regulation or universal airline standard.

### Layout and usable space

- Use a centered content container with a project token such as `--page-max-width`; a desktop starting range of about `72rem`–`80rem` (1152–1280 CSS px) is reasonable for many booking interfaces. Confirm against actual content and breakpoints rather than forcing this width everywhere.
- At common desktop widths, aim for the primary content to use roughly **80–90% of the available page width**, with balanced gutters. Use remaining space for breathing room or a secondary rail only when it helps the task. These are design targets, not fixed ratios.
- On flight search, results, fare selection, passenger details, payment, and booking review pages, prioritize the booking task. Keep search criteria, itinerary, fare conditions, total price, and the primary next action visually prominent.
- Keep the booking form/results as the main column. A secondary column may hold a price summary, trip summary, help content, or an approved promotional slot; do not let it squeeze flight names, dates, fare conditions, or prices.
- On the homepage, keep the flight-search entry point immediately discoverable and avoid letting a large campaign banner push the main booking action unnecessarily far below the first viewport.
- Do not use a fixed percentage of the viewport height as a universal rule. Account for browser chrome, zoom, text enlargement, localization, and responsive reflow. Never clip essential content to preserve a ratio.
- Use a consistent spacing scale and responsive grid/flex layouts. Avoid empty whitespace that hides useful flight information, but do not compress content until it becomes hard to scan.

### Advertising and promotional placeholders

- First determine whether the slot is a **brand promotion** (for example, baggage, loyalty, hotel, or holiday offers) or a **third-party advertisement**. Do not insert third-party ads unless explicitly required by product/business requirements and approved by the airline.
- Reserve ad space only on approved pages and locations. Prefer homepage, destination/content pages, or post-booking/manage-booking areas where relevant. **Do not place ads inside the payment form, between passenger form fields, inside fare conditions, or where they interrupt a booking decision or primary action.** Do not obscure the itinerary, total price, errors, or confirmation details.
- Treat ads as optional content: if the slot is empty, blocked, or fails to load, collapse it or show an intentional, approved fallback. Do not leave a large blank hole unless the layout explicitly requires a reserved slot.
- Reserve the expected slot dimensions/aspect ratio before the ad loads to prevent layout shift. Use CSS `aspect-ratio`, `min-height` where appropriate, and responsive slot variants; never resize content unpredictably after load.
- Illustrative slot sizes—not airline-specific standards—may include a `300 × 250` desktop rectangle in a secondary rail or content page, a wide campaign banner on marketing pages, and a smaller responsive slot on mobile. Choose actual dimensions from the approved ad platform and design specification. Do not force a desktop sidebar ad into a narrow mobile viewport.
- Keep ads clearly distinguishable from flight results, fare cards, baggage/seat options, and airline navigation. Label sponsored content appropriately where required; never style an ad to impersonate a flight result, fare, system alert, or primary booking button.
- Use semantic containers and descriptive labels for ad regions where useful. If an embedded ad is an iframe, provide an appropriate `title`; ensure keyboard users can enter and leave it, and verify focus order. Do not make essential booking information dependent on an ad script.
- Lazy-load below-the-fold ad media where appropriate; avoid delaying the flight search form or other critical content. Do not preload every banner or ad asset.
- Respect consent, privacy, tracking, and regional legal requirements. Do not send passenger, itinerary, payment, or booking-reference data to ad providers unless explicitly approved and legally permitted.

### Responsive layout starting points

- **Desktop:** Keep the main task in a readable central container. A secondary rail is optional and must not compete with the main booking flow.
- **Tablet:** Reduce or remove the secondary rail when it compresses the primary content; move approved promotions below the task content when needed.
- **Mobile:** Use a single-column flow. Place promotional/ad slots after a meaningful content section or below the primary task; never insert them between related form controls or before an urgent error message. Prevent horizontal page scrolling caused by ad creatives.
- At 200% zoom and narrow widths, all essential content and controls must reflow without overlap or loss of functionality. Ad content must not block sticky action bars, dialogs, or keyboard focus.

### Space utilization and ad-slot verification

- [ ] The primary booking task is discoverable without scrolling past a large promotional banner.
- [ ] Essential flight, fare, tax/fee, baggage, and total-price information has visual priority over promotions.
- [ ] Any ad/promo slot is explicitly approved, responsive, labelled where appropriate, and isolated from critical booking controls.
- [ ] Empty/blocked/slow-loading ad behavior is defined and does not create disruptive layout shifts.
- [ ] Desktop, tablet, mobile, zoom, keyboard, and screen-reader behavior are checked.
- [ ] No personal or booking-sensitive data is exposed to ad content or third-party scripts without explicit approval.

## 6. Accessibility and Inclusive Design Acceptance Criteria

Target **WCAG 2.2 AA** unless the project specifies a stricter standard.
Verify the applicable legal and organizational requirements with the
project owner.

-   Text contrast is at least 4.5:1 for normal text and 3:1 for large
    text; non-text UI boundaries and meaningful graphics meet applicable
    contrast requirements.
-   All functionality works using keyboard only, with no keyboard trap.
-   Focus is visible and not obscured by sticky or fixed content.
-   Pointer targets meet the applicable WCAG 2.2 target-size criteria or
    documented exceptions.
-   Content supports browser zoom and reflow without loss of information
    or functionality.
-   Errors are identified in text and associated with their fields.
-   Status messages can be perceived without requiring focus movement.
-   Screen-reader names, roles, values, and state changes are correct.
-   Color is never the only indicator for flight status, fare selection,
    seat status, or validation.
-   Test with automated tools and manual keyboard/screen-reader checks;
    automated scans alone are insufficient.

------------------------------------------------------------------------

## 7. Security, Privacy, and Trust

-   Treat all API and user-provided content as untrusted; escape/render
    safely and avoid unsafe HTML insertion.
-   Do not place personal data, travel-document details, booking
    references, session tokens, or payment data in query strings or
    client-visible logs.
-   Do not rely on CSS or hidden HTML fields to enforce authorization,
    eligibility, or fare rules.
-   UI restrictions are usability controls, not security controls;
    authoritative validation must happen server-side.
-   Never store payment card data in frontend state, local storage,
    session storage, or logs unless explicitly permitted by an approved
    compliant architecture.
-   Avoid exposing internal error details, stack traces, or sensitive
    booking information in error messages.
-   Respect consent and privacy requirements for analytics and
    personalization.
-   Do not create deceptive urgency, preselected paid extras, or
    confusing opt-out patterns.

------------------------------------------------------------------------

## 8. Component and State Coverage

For every in-scope screen/component, explicitly consider these states
and implement only those applicable:

-   Default / initial
-   Focused / keyboard-focused
-   Hover / active
-   Selected
-   Disabled / unavailable
-   Loading / submitting
-   Success / completed
-   Empty / no results
-   Validation error
-   API/system error with retry or next action
-   Partial data / stale data
-   Session expired / re-authentication required
-   Responsive mobile, tablet, desktop
-   Long content / localization
-   Accessible name, focus, and announcement behavior

Airline-specific state examples: - No flights found; flight search
failed; fare no longer available; price changed; connection details
unavailable. - Seat map loading/failed; seat unavailable after
selection; ancillary price updated. - Passenger form validation failed;
session timed out during booking. - Payment declined, payment pending,
or booking confirmation not received. - Booking confirmed versus booking
pending/unconfirmed. - Check-in not open, check-in unavailable, or
eligibility not confirmed.

Do not display a success state merely because the user clicked a button;
wait for the authoritative result.

------------------------------------------------------------------------

## 9. CSS/HTML Anti-Patterns --- Prohibited

-   Invalid or unnecessarily non-semantic HTML.
-   Clickable `div`/`span` without keyboard behavior and appropriate
    semantics.
-   Inputs without visible labels.
-   Placeholder-only labels or color-only validation.
-   Fixed page widths that break on mobile or at zoom.
-   Hardcoded airline policies, prices, entitlements, airport codes, or
    status labels without an approved source.
-   Fare or baggage inclusions inferred from visual conventions or
    competitor sites.
-   Hidden mandatory fees, misleading defaults, or preselected paid
    extras.
-   Global selectors or `!important` used to patch unrelated components.
-   Arbitrary z-index escalation, fragile selector chains, or styling
    tied to generated DOM.
-   Hover-only actions, invisible keyboard focus, inaccessible dialogs,
    and non-announced dynamic errors.
-   Using CSS to conceal content, warnings, required fields, or errors.
-   Exposing passenger/payment data in DOM attributes, URLs, or client
    logs.
-   Marking a booking as confirmed before receiving authoritative
    confirmation.

------------------------------------------------------------------------

## 10. Required Implementation Workflow

1.  **Inspect:** Read requirements, acceptance criteria, existing
    components, design tokens, supported browsers, and current tests.
2.  **Map:** Identify each in-scope screen, component, user action, data
    field, and state.
3.  **Flag ambiguity:** Mark airline-policy or requirement conflicts as
    `HIL REQUIRED`; do not invent a rule.
4.  **Plan:** Reuse components and tokens; define semantic HTML
    structure and responsive behavior.
5.  **Implement:** Make focused changes to HTML/CSS and only the minimum
    related code needed.
6.  **Validate:** Run formatter, linter, build, relevant unit/component
    tests, and visual checks available in the project.
7.  **Check accessibility:** Keyboard, focus, labels, errors, contrast,
    zoom/reflow, screen-reader announcements, and reduced motion.
8.  **Check airline consistency:** Verify dates, local times, airport
    codes, fare inclusions, baggage/seat states, total price, and
    booking status against approved sources.
9.  **Report:** List files changed, requirements covered, tests run,
    known gaps, assumptions, and human decisions needed.

Do not claim tests passed unless they were actually run. If a check
cannot be run, state that explicitly.

------------------------------------------------------------------------

## 11. Definition of Done

A frontend change is complete only when all applicable checks pass:

-   [ ] Requirements and acceptance criteria are traceable to the UI.
-   [ ] HTML is semantic, valid, and free of avoidable accessibility
    anti-patterns.
-   [ ] CSS follows the existing architecture, tokens, naming, and
    responsive standards.
-   [ ] Desktop, tablet, and mobile layouts work at supported widths.
-   [ ] Page space, promotional/ad placement, reserved slot dimensions, and empty/failed-ad behavior follow the approved layout requirements.
-   [ ] Keyboard navigation, visible focus, labels, error associations,
    and dynamic announcements are verified.
-   [ ] Contrast, zoom/reflow, and reduced-motion behavior are checked.
-   [ ] Loading, empty, success, error, unavailable, and stale states
    are handled where applicable.
-   [ ] Airline-specific labels, itinerary data, prices, entitlements,
    and booking statuses use approved sources.
-   [ ] No unapproved airline policy, fee, entitlement, or eligibility
    rule was introduced.
-   [ ] No sensitive passenger/payment data is exposed in the DOM, URL,
    or logs.
-   [ ] Lint/build/tests and available visual checks are completed, with
    results reported accurately.
-   [ ] All unresolved decisions are marked `HIL REQUIRED`; no critical
    assumption is hidden.
-   [ ] Documentation and screenshots are updated where the project
    requires them.

------------------------------------------------------------------------

## 12. Agent Response Format

At the end of the implementation, report in this format:

``` text
Role: Senior Airline Frontend Engineer / UI Implementation Agent
Scope: <screens/components updated>
Requirements covered: <IDs and short summary>
HTML/CSS approach: <semantic structure, components, tokens, responsive behavior>
Airline-domain checks: <data/policy fields verified and source>
Accessibility checks: <checks performed and outcome>
Validation: <commands/tests actually run and results>
HIL REQUIRED: <unresolved business/design decisions, or None>
Known gaps: <limitations or checks not run>
Files changed: <paths>
```

## 13. Final Instruction to the Agent

Prioritize **correct airline-domain behavior, accessible semantic HTML,
responsive and maintainable CSS, transparent pricing, and trustworthy
booking status** over visual shortcuts. Follow existing approved project
standards. If domain rules or acceptance criteria are missing,
contradictory, or consequential, stop that part of the implementation
and request human clarification instead of guessing.