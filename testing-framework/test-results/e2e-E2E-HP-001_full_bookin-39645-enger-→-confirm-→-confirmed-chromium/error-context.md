# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\E2E-HP-001_full_booking_happy_path.spec.ts >> E2E-HP-001 | Full booking happy path — search → select → passenger → confirm → confirmed
- Location: tests\e2e\E2E-HP-001_full_booking_happy_path.spec.ts:30:1

# Error details

```
Error: locator.fill: Error: Element is not an <input>, <textarea> or [contenteditable] element
Call log:
  - waiting for getByTestId('input-origin')
    - locator resolved to <select id="origin" aria-invalid="false" data-testid="input-origin" class="search-form-select ">…</select>
    - fill("LHR")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "TravelPlatform home" [ref=e6] [cursor=pointer]:
          - img "IGS TravelPlatform" [ref=e7]
          - generic [ref=e8]: IGS TravelPlatform
        - navigation "Primary navigation" [ref=e9]:
          - button "Search Flights" [ref=e10] [cursor=pointer]
          - button "My Trips" [ref=e11] [cursor=pointer]
          - button "Support" [ref=e12] [cursor=pointer]
        - generic [ref=e13]:
          - button "Sign In" [ref=e14] [cursor=pointer]
          - button "Sign Up" [ref=e15] [cursor=pointer]
    - main [ref=e16]:
      - generic [ref=e17]:
        - region "Welcome to TravelPlatform" [ref=e18]:
          - generic [ref=e19]:
            - heading "Discover Your Next Adventure" [level=1] [ref=e20]
            - paragraph [ref=e21]: Search and book flights to over 5,000 destinations worldwide with transparent pricing and flexible booking options.
        - main [ref=e22]:
          - region "Flight search" [ref=e23]:
            - generic [ref=e24]:
              - heading "Search Flights" [level=2] [ref=e26]
              - generic [ref=e27]:
                - generic [ref=e28]:
                  - generic [ref=e29]: From*
                  - combobox "Fromrequired" [ref=e30] [cursor=pointer]:
                    - option "Select origin" [selected]
                - generic [ref=e31]:
                  - generic [ref=e32]: To*
                  - combobox "Torequired" [ref=e33] [cursor=pointer]:
                    - option "Select destination" [selected]
              - generic [ref=e34]:
                - generic [ref=e36]:
                  - generic [ref=e37]:
                    - text: Departure
                    - generic "required" [ref=e38]: "*"
                  - textbox "Departure required" [ref=e39]
                - generic [ref=e41]:
                  - generic [ref=e42]: Return
                  - textbox "Return" [ref=e43]
                - generic [ref=e44]:
                  - generic [ref=e45]: Cabin Class
                  - combobox "Cabin Class" [ref=e46] [cursor=pointer]:
                    - option "Economy" [selected]
                    - option "Premium Economy"
                    - option "Business"
                    - option "First Class"
              - generic [ref=e48]:
                - generic [ref=e49]: Passengers
                - generic [ref=e50]:
                  - button "Remove passenger" [disabled] [ref=e51]: −
                  - generic [ref=e52]: "1"
                  - button "Add passenger" [ref=e53] [cursor=pointer]: +
              - generic [ref=e54]:
                - button "Search Flights" [ref=e55] [cursor=pointer]
                - button "Clear Form" [ref=e56] [cursor=pointer]
              - status "Search information" [ref=e57]:
                - generic [ref=e58]: ✓ Best price guarantee
                - generic [ref=e59]: ✓ Free cancellation on selected flights
                - generic [ref=e60]: ✓ Secure payment
          - complementary "Quick search links" [ref=e61]:
            - heading "Popular Routes" [level=3] [ref=e62]
            - generic [ref=e63]:
              - button "LHR → JFK London → New York" [ref=e64] [cursor=pointer]:
                - generic [ref=e65]: LHR → JFK
                - generic [ref=e66]: London → New York
              - button "JFK → LHR New York → London" [ref=e67] [cursor=pointer]:
                - generic [ref=e68]: JFK → LHR
                - generic [ref=e69]: New York → London
              - button "LAX → SIN Los Angeles → Singapore" [ref=e70] [cursor=pointer]:
                - generic [ref=e71]: LAX → SIN
                - generic [ref=e72]: Los Angeles → Singapore
              - button "SIN → LAX Singapore → Los Angeles" [ref=e73] [cursor=pointer]:
                - generic [ref=e74]: SIN → LAX
                - generic [ref=e75]: Singapore → Los Angeles
    - generic "Notifications" [ref=e76]:
      - heading "Notifications" [level=2] [ref=e78]
      - generic [ref=e79]:
        - button "All" [ref=e80] [cursor=pointer]
        - button "Unread" [ref=e81] [cursor=pointer]
      - list "Notification list" [ref=e82]:
        - status [ref=e83]:
          - generic [aria-hidden] [ref=e84]: 📬
          - paragraph [ref=e85]: No notifications
    - contentinfo [ref=e86]:
      - generic [ref=e87]:
        - generic [ref=e88]:
          - heading "TravelPlatform" [level=4] [ref=e89]
          - paragraph [ref=e90]: Your trusted partner for flight bookings worldwide. Transparent pricing, flexible options, and 24/7 support.
        - generic [ref=e91]:
          - heading "Company" [level=4] [ref=e92]
          - list [ref=e93]:
            - listitem [ref=e94]:
              - link "About Us" [ref=e95] [cursor=pointer]:
                - /url: "#about"
            - listitem [ref=e96]:
              - link "Careers" [ref=e97] [cursor=pointer]:
                - /url: "#careers"
            - listitem [ref=e98]:
              - link "Press" [ref=e99] [cursor=pointer]:
                - /url: "#press"
            - listitem [ref=e100]:
              - link "Contact" [ref=e101] [cursor=pointer]:
                - /url: "#contact"
        - generic [ref=e102]:
          - heading "Support" [level=4] [ref=e103]
          - list [ref=e104]:
            - listitem [ref=e105]:
              - link "Help Center" [ref=e106] [cursor=pointer]:
                - /url: "#help"
            - listitem [ref=e107]:
              - link "FAQ" [ref=e108] [cursor=pointer]:
                - /url: "#faq"
            - listitem [ref=e109]:
              - link "Refunds" [ref=e110] [cursor=pointer]:
                - /url: "#refunds"
            - listitem [ref=e111]:
              - link "Contact Support" [ref=e112] [cursor=pointer]:
                - /url: "#support"
        - generic [ref=e113]:
          - heading "Legal" [level=4] [ref=e114]
          - list [ref=e115]:
            - listitem [ref=e116]:
              - link "Terms of Service" [ref=e117] [cursor=pointer]:
                - /url: "#terms"
            - listitem [ref=e118]:
              - link "Privacy Policy" [ref=e119] [cursor=pointer]:
                - /url: "#privacy"
            - listitem [ref=e120]:
              - link "Cookie Policy" [ref=e121] [cursor=pointer]:
                - /url: "#cookies"
            - listitem [ref=e122]:
              - link "Accessibility" [ref=e123] [cursor=pointer]:
                - /url: "#accessibility"
      - generic [ref=e124]:
        - paragraph [ref=e125]: © 2026 TravelPlatform. All rights reserved.
        - generic [ref=e126]:
          - button "Change language" [ref=e127] [cursor=pointer]: 🌐 English
          - button "Change currency" [ref=e128] [cursor=pointer]: 💵 USD
  - text: ✈
```

# Test source

```ts
  1   | /**
  2   |  * SearchPage — Page Object Model
  3   |  *
  4   |  * Covers: SearchForm + SearchResults components
  5   |  * Traceability: REQ-EXP-01, AC-EXP-01-01
  6   |  * Test Cases: TC-001, TC-002, TC-003, TC-004
  7   |  */
  8   | 
  9   | import { type Page, type Locator, expect } from '@playwright/test';
  10  | 
  11  | export class SearchPage {
  12  |   readonly page: Page;
  13  | 
  14  |   // ── Form locators ────────────────────────────────────────────────────────
  15  |   readonly form: Locator;
  16  |   readonly originInput: Locator;
  17  |   readonly destinationInput: Locator;
  18  |   readonly departureDateInput: Locator;
  19  |   readonly returnDateInput: Locator;
  20  |   readonly cabinSelect: Locator;
  21  |   readonly passengerCount: Locator;
  22  |   readonly addPassengerBtn: Locator;
  23  |   readonly removePassengerBtn: Locator;
  24  |   readonly searchBtn: Locator;
  25  |   readonly clearFormBtn: Locator;
  26  | 
  27  |   // ── Results locators ─────────────────────────────────────────────────────
  28  |   readonly searchResults: Locator;
  29  |   readonly flightList: Locator;
  30  | 
  31  |   constructor(page: Page) {
  32  |     this.page = page;
  33  | 
  34  |     this.form              = page.getByTestId('search-form');
  35  |     this.originInput       = page.getByTestId('input-origin');
  36  |     this.destinationInput  = page.getByTestId('input-destination');
  37  |     this.departureDateInput= page.getByTestId('input-departure');
  38  |     this.returnDateInput   = page.getByTestId('input-return');
  39  |     this.cabinSelect       = page.getByTestId('select-cabin');
  40  |     this.passengerCount    = page.getByTestId('passenger-count');
  41  |     this.addPassengerBtn   = page.getByTestId('btn-add-passenger');
  42  |     this.removePassengerBtn= page.getByTestId('btn-remove-passenger');
  43  |     this.searchBtn         = page.getByTestId('btn-search');
  44  |     this.clearFormBtn      = page.getByTestId('btn-clear-form');
  45  |     this.searchResults     = page.getByTestId('search-results');
  46  |     this.flightList        = page.getByTestId('flight-list');
  47  |   }
  48  | 
  49  |   /** Navigate to app root */
  50  |   async goto() {
  51  |     await this.page.goto('/');
  52  |     await expect(this.form).toBeVisible();
  53  |   }
  54  | 
  55  |   /**
  56  |    * Fill and submit the search form.
  57  |    * departureDate and returnDate must be ISO date strings (YYYY-MM-DD).
  58  |    */
  59  |   async search({
  60  |     origin,
  61  |     destination,
  62  |     departureDate,
  63  |     returnDate,
  64  |     cabin = 'ECONOMY',
  65  |   }: {
  66  |     origin: string;
  67  |     destination: string;
  68  |     departureDate: string;
  69  |     returnDate?: string;
  70  |     cabin?: string;
  71  |   }) {
  72  |     // origin and destination are free-text IATA inputs (e.g. "LHR", "JFK")
> 73  |     await this.originInput.fill(origin);
      |                            ^ Error: locator.fill: Error: Element is not an <input>, <textarea> or [contenteditable] element
  74  |     await this.destinationInput.fill(destination);
  75  |     await this.departureDateInput.fill(departureDate);
  76  |     if (returnDate) {
  77  |       await this.returnDateInput.fill(returnDate);
  78  |     }
  79  |     await this.cabinSelect.selectOption(cabin);
  80  |     await this.searchBtn.click();
  81  |   }
  82  | 
  83  |   /** Wait for results list to be visible */
  84  |   async waitForResults() {
  85  |     await expect(this.searchResults).toBeVisible({ timeout: 15000 });
  86  |     await expect(this.flightList).toBeVisible();
  87  |   }
  88  | 
  89  |   /** Return all flight cards */
  90  |   flightCards() {
  91  |     return this.flightList.getByTestId('flight-card');
  92  |   }
  93  | 
  94  |   /** Return the Select button for a specific offerId */
  95  |   selectBtnForOffer(offerId: string) {
  96  |     return this.page.getByTestId(`btn-select-flight-${offerId}`);
  97  |   }
  98  | 
  99  |   /** Click the first available (non-disabled) Select button */
  100 |   async selectFirstAvailableFlight() {
  101 |     const cards = this.flightList.getByTestId('flight-card');
  102 |     const count = await cards.count();
  103 |     for (let i = 0; i < count; i++) {
  104 |       const btn = cards.nth(i).getByRole('button', { name: 'Select' });
  105 |       const disabled = await btn.isDisabled();
  106 |       if (!disabled) {
  107 |         await btn.click();
  108 |         return;
  109 |       }
  110 |     }
  111 |     throw new Error('No available (non-sold-out) flight found in results');
  112 |   }
  113 | 
  114 |   /** Open fare breakdown for the nth flight card (0-indexed) */
  115 |   async openFareBreakdown(cardIndex = 0) {
  116 |     const card = this.flightList.getByTestId('flight-card').nth(cardIndex);
  117 |     const toggle = card.locator('.price-toggle');
  118 |     await toggle.click();
  119 |     await expect(card.locator('.fare-breakdown')).toBeVisible();
  120 |   }
  121 | 
  122 |   /** Return the heading showing results count */
  123 |   resultsHeading() {
  124 |     return this.searchResults.locator('h2.search-results-title');
  125 |   }
  126 | 
  127 |   /** Verify a flight card shows the expected origin and destination codes */
  128 |   async expectRouteOnCard(cardIndex: number, origin: string, destination: string) {
  129 |     const card = this.flightList.getByTestId('flight-card').nth(cardIndex);
  130 |     await expect(card.locator('.airport').first()).toHaveText(origin);
  131 |     await expect(card.locator('.airport').last()).toHaveText(destination);
  132 |   }
  133 | }
  134 | 
```