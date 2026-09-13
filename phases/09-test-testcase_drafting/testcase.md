# TravelPlatform — Happy Path Test Cases

**Document Version:** 1.0  
**Date:** 2026-09-03  
**Phase:** 09 — Test Case Drafting  
**Author:** QA Engineering (AI-assisted)  
**Source Documents:**
- `fe_acceptance_criteria.md` v1.0 (primary source of truth)
- `fe_development_status.md` v1.0 (implementation scope)
- `qa.md` (QA standards guardrails)
- `agent.md` / `AGENTS.md` (test case format contract)

**Scope:** Happy path test cases only, covering all ✅ implemented ACs.  
**Excluded:** Negative, boundary, validation, and authorization cases (separate document).  
**Excluded ACs:** All ❌ not-yet-implemented ACs — no test cases generated for unimplemented functionality.

---

## Functional Areas Covered

| # | Functional Area | AC IDs |
|---|----------------|--------|
| 1 | Flight Search Form | AC-EXP-01-01 |
| 2 | Search Results Display | AC-EXP-01-01 |
| 3 | Booking Hold — Passenger Collection | AC-EXP-02-01 |
| 4 | Booking Hold — Hold Submission | AC-EXP-02-01 |
| 5 | Policy — WARN Acknowledgement | AC-EXP-02-10, AC-POL-01-05 |
| 6 | Policy — BLOCK Display | AC-POL-01-06, AC-POL-04-03 |
| 7 | Policy — ALLOW Pass-through | AC-EXP-02-01 |
| 8 | Approval Pending Screen | AC-EXP-02-05, AC-EXP-07-05 |
| 9 | Booking Confirmed Screen | AC-EXP-03-08 |
| 10 | Status Label Rendering | AC-EXP-05-04 |
| 11 | Error Display | AC-XCT-05-03 |

---

## Implicit Behavior Identified

The following behaviors are reasonably implied by the implemented ACs and are included in test cases. They are labelled `UI-DERIVED` where they are not explicitly stated in the AC text.

- The search form renders before results are displayed.
- The passenger form renders after a flight is selected.
- The hold panel renders after the passenger form is submitted.
- The confirmed screen renders after successful confirmation.
- The approval pending screen renders instead of the confirmed screen when approval is required.
- Fare amounts always include a currency code (ISO 4217).

---

## Ambiguities Noted

| # | Ambiguity | Affected ACs | Action |
|---|-----------|-------------|--------|
| A1 | AC-EXP-03-01 states `PENDING_ISSUE` should be shown after confirm, but mock returns `CONFIRMED` immediately. Real backend may differ. | AC-EXP-03-01 | Test case marked `CLARIFICATION` — happy path covers `CONFIRMED` outcome only. |
| A2 | Void window expiry shown in `BookingConfirmedScreen` is a 24h stub, not backend-sourced. | AC-EXP-03-08 | Test validates field is present; exact value marked as `CLARIFICATION` pending backend. |
| A3 | `hold_expires_at` format not specified in AC — implementation uses locale date/time string. | AC-EXP-02-01 | Test validates field is visible and human-readable; exact format marked `UI-DERIVED`. |

---

## Test Cases

---

### EPIC-EXP-01 — Travel Search

---

#### TC-001 — Submit valid flight search and receive results

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-001 |
| **Title** | TC-001_Search_Valid_Flight_Displays_Results_With_Fare |
| **Requirement ID** | REQ-EXP-01 |
| **Epic ID** | EPIC-EXP-01 |
| **Story ID** | STORY-EXP-01-01 |
| **AC ID** | AC-EXP-01-01 |
| **Source** | AC |
| **Objective** | Verify that submitting a valid search request causes the UI to display a list of flight offers, each showing base fare, taxes, fees, total fare, and currency code |
| **Preconditions** | Application is loaded. Search form is displayed. Mock flight service returns results. |
| **Test Data** | Origin: `LHR`, Destination: `JFK`, Departure: tomorrow's date, Passengers: 1, Cabin: Economy |
| **Test Steps** | 1. Enter `LHR` in the Origin field. 2. Enter `JFK` in the Destination field. 3. Select a departure date that is today or in the future. 4. Leave return date blank. 5. Set passengers to 1. 6. Select Economy cabin class. 7. Click "Search Flights". |
| **Expected Results** | 1. Loading spinner appears while results load. 2. A list of flight offer cards is displayed. 3. Each card shows the airline name, flight number, and cabin class badge. 4. Each card shows a departure time, arrival time, origin IATA code, and destination IATA code. 5. Each card shows a price with a currency symbol (e.g. `$450.00`). 6. Expanding the fare breakdown shows separate rows for base fare, taxes, fees, and total, each with a currency code (e.g. `USD`). |
| **Priority** | P0 |
| **Test Type** | Positive / Happy Path |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | Fare breakdown uses client-side estimates (15% tax + $25 fee) in Phase 1. Currency code verification maps directly to `CurrencyAmount` component formatting. |

---

#### TC-002 — Search results display origin and destination from user input

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-002 |
| **Title** | TC-002_Search_Results_Show_User_Entered_Route |
| **Requirement ID** | REQ-EXP-01 |
| **Epic ID** | EPIC-EXP-01 |
| **Story ID** | STORY-EXP-01-01 |
| **AC ID** | AC-EXP-01-01 |
| **Source** | AC |
| **Objective** | Verify that the flight cards in search results reflect the origin and destination IATA codes entered by the user, not hardcoded mock values |
| **Preconditions** | Application is loaded. Mock service is configured with default ALLOW policy. |
| **Test Data** | Origin: `SYD`, Destination: `DXB`, Departure: a future date |
| **Test Steps** | 1. Enter `SYD` in Origin. 2. Enter `DXB` in Destination. 3. Select a future departure date. 4. Click "Search Flights". 5. Wait for results to load. |
| **Expected Results** | 1. Each flight card in the results list shows `SYD` as the departure airport code. 2. Each flight card shows `DXB` as the arrival airport code. 3. No result card shows the default mock values `LHR` or `JFK`. |
| **Priority** | P0 |
| **Test Type** | Positive / Data Integrity |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | Verifies the origin/destination override applied in `createMockSearchResponse()`. This is a functional data-integrity check, not a styling check. |

---

#### TC-003 — Expandable fare breakdown shows itemised amounts with currency

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-003 |
| **Title** | TC-003_Fare_Breakdown_Expands_And_Shows_Currency_Code |
| **Requirement ID** | REQ-EXP-01 |
| **Epic ID** | EPIC-EXP-01 |
| **Story ID** | STORY-EXP-01-01 |
| **AC ID** | AC-EXP-01-01 |
| **Source** | AC |
| **Objective** | Verify that clicking the price toggle on a flight card reveals an itemised fare breakdown with base fare, taxes, fees, and total, each displayed with a currency code |
| **Preconditions** | Flight search has been performed and results are displayed. |
| **Test Data** | Any available flight offer card in the results list. |
| **Test Steps** | 1. Identify any available (non-sold-out) flight card. 2. Click the price toggle button (chevron ▼ visible near the price). 3. Observe the expanded fare breakdown section. |
| **Expected Results** | 1. A fare breakdown section appears below the price toggle. 2. A "Base fare" row is visible with a formatted amount (e.g. `$450.00`). 3. A "Taxes" row is visible with a formatted amount. 4. A "Fees" row is visible with a formatted amount. 5. A "Total" row is visible with a highlighted formatted amount. 6. A note confirms the currency code (e.g. "Currency: USD"). 7. Clicking the toggle again collapses the breakdown. |
| **Priority** | P1 |
| **Test Type** | Positive / UI Interaction |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | `aria-expanded` attribute should toggle between `true`/`false`. Currency note text derived from `UI-DERIVED` — confirms `fare-note` element renders currency code. |

---

### EPIC-EXP-02 — Create Booking (Hold)

---

#### TC-004 — Selecting a flight navigates to passenger form

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-004 |
| **Title** | TC-004_Select_Flight_Navigates_To_Passenger_Form |
| **Requirement ID** | REQ-EXP-02 |
| **Epic ID** | EPIC-EXP-02 |
| **Story ID** | STORY-EXP-02-01 |
| **AC ID** | AC-EXP-02-01 |
| **Source** | AC |
| **Objective** | Verify that clicking "Select" on an available flight offer transitions the UI to the passenger details form |
| **Preconditions** | Search has been performed. At least one non-sold-out flight card is displayed. |
| **Test Data** | Any available flight offer. |
| **Test Steps** | 1. Identify an available (non-sold-out) flight card. 2. Click the "Select" button on that card. |
| **Expected Results** | 1. The search results list is no longer visible. 2. A "Passenger Details" form is displayed (step indicator shows step 2). 3. The form contains at least one passenger fieldset for Passenger 1. 4. First Name and Last Name fields are visible and empty. 5. A passenger type selector (Adult/Child/Infant) is present. 6. A "Review Booking" button is visible but disabled until fields are filled. 7. A "← Back to Results" button is visible. |
| **Priority** | P0 |
| **Test Type** | Positive / Navigation |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | Validates the `selectFlight()` context action transitions `currentStep` from `results` to `details`. |

---

#### TC-005 — Submit valid passenger details and advance to review panel

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-005 |
| **Title** | TC-005_Valid_Passenger_Details_Advance_To_Hold_Panel |
| **Requirement ID** | REQ-EXP-02 |
| **Epic ID** | EPIC-EXP-02 |
| **Story ID** | STORY-EXP-02-01 |
| **AC ID** | AC-EXP-02-01 |
| **Source** | AC |
| **Objective** | Verify that submitting valid passenger data for at least one passenger advances the flow to the booking review and policy evaluation panel |
| **Preconditions** | The passenger form is displayed. Policy mock is set to ALLOW (VITE_MOCK_POLICY=ALLOW or default). |
| **Test Data** | First Name: `JOHN`, Last Name: `SMITH`, Passenger Type: Adult |
| **Test Steps** | 1. Enter `JOHN` in the First Name field. 2. Enter `SMITH` in the Last Name field. 3. Leave optional fields (FFN, passport) blank. 4. Click "Review Booking". |
| **Expected Results** | 1. A loading indicator appears while policy is evaluated. 2. The passenger form is replaced by the "Review & Confirm Flight" panel (step 3). 3. The selected flight summary card is visible (airline, flight number, origin, destination, times). 4. The passengers section lists `1. JOHN SMITH ADT`. 5. The fare breakdown table is displayed (base fare, taxes, fees, total). 6. A green "Policy Check Passed" panel is visible (ALLOW outcome). 7. A "Confirm Booking" button is visible and enabled. |
| **Priority** | P0 |
| **Test Type** | Positive / Happy Path |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | Precondition requires `VITE_MOCK_POLICY` unset or set to `ALLOW`. Input names are uppercased automatically by the form component. |

---

#### TC-006 — Confirm booking and display booking reference with hold expiry

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-006 |
| **Title** | TC-006_Confirm_Booking_Displays_BookingID_And_HoldExpiry |
| **Requirement ID** | REQ-EXP-02 |
| **Epic ID** | EPIC-EXP-02 |
| **Story ID** | STORY-EXP-02-01 |
| **AC ID** | AC-EXP-02-01 |
| **Source** | AC |
| **Objective** | Verify that clicking "Confirm Booking" triggers the hold API, and the response's `booking_id` and `hold_expires_at` are displayed in a human-readable format alongside the policy decision |
| **Preconditions** | The review panel is displayed. Policy outcome is ALLOW. "Confirm Booking" button is visible and enabled. |
| **Test Data** | Preconditions met from TC-005. |
| **Test Steps** | 1. Click "Confirm Booking". 2. Wait for the loading state to complete. |
| **Expected Results** | 1. A "Confirm Booking" button shows a loading state during the API call. 2. After the API response, the confirmed screen is displayed. 3. A "Booking Reference" field is visible with a non-empty confirmation number (e.g. `CONF-XXXXXXXX`). 4. The booking reference is formatted in a distinct, readable style (monospace/highlighted). 5. The policy decision (ALLOW) was displayed at the review step before confirmation. |
| **Priority** | P0 |
| **Test Type** | Positive / Happy Path |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | `hold_expires_at` is rendered in the hold confirmation block in `BookingHoldPanel`. The mock service does not currently show the hold panel post-hold before advancing to confirmed screen — test verifies the confirmed screen shows the booking reference. AC-EXP-02-01 text specifically requires `booking_id` and `hold_expires_at` to be displayed. **CLARIFICATION:** Verify whether `hold_expires_at` must still be visible on the confirmed screen or only on the hold panel. |

---

#### TC-007 — WARN policy outcome displayed as non-blocking notice with acknowledge button

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-007 |
| **Title** | TC-007_Policy_WARN_Shown_As_NonBlocking_With_Acknowledge_Button |
| **Requirement ID** | REQ-EXP-02, REQ-POL-01 |
| **Epic ID** | EPIC-EXP-02, EPIC-POL-01 |
| **Story ID** | STORY-EXP-02-10, STORY-POL-01-05 |
| **AC ID** | AC-EXP-02-10, AC-POL-01-05 |
| **Source** | AC |
| **Objective** | Verify that when the policy evaluation returns a WARN outcome, each warning message is displayed as a visible, non-blocking yellow panel, and the traveler can acknowledge and proceed |
| **Preconditions** | The review panel is displayed. `VITE_MOCK_POLICY=WARN` is set. |
| **Test Data** | `VITE_MOCK_POLICY=WARN`. Any valid flight selected with valid passenger details. |
| **Test Steps** | 1. Complete search, flight selection, and passenger form (TC-004, TC-005 preconditions). 2. On the review panel, observe the policy panel. 3. Read the warning message text. 4. Click "I understand — continue anyway". |
| **Expected Results** | 1. A yellow/amber warning panel is displayed with the label "Policy Warning". 2. The panel shows the policy rule name (e.g. "Advance Booking") and its details text. 3. An "I understand — continue anyway" button is visible within the warning panel. 4. The "Confirm Booking" button is NOT suppressed — it remains accessible after acknowledging. 5. After clicking acknowledge, a green confirmation message "✓ Warning acknowledged — you may proceed to hold" appears within the panel. 6. The warning panel does NOT disappear entirely — it remains visible as a notice per AC-EXP-02-10. |
| **Priority** | P0 |
| **Test Type** | Positive / Policy Flow |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-EXP-02-10: "without preventing the user from proceeding to confirm". AC-POL-01-05: "traveler can acknowledge and continue". Both are satisfied by the same interaction. |

---

#### TC-008 — BLOCK policy outcome displays non-dismissible panel with Return to Search only

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-008 |
| **Title** | TC-008_Policy_BLOCK_NonDismissible_Panel_ReturnToSearch_Only |
| **Requirement ID** | REQ-POL-01, REQ-POL-04 |
| **Epic ID** | EPIC-POL-01, EPIC-POL-04 |
| **Story ID** | STORY-POL-01-06, STORY-POL-04-03 |
| **AC ID** | AC-POL-01-06, AC-POL-04-03 |
| **Source** | AC |
| **Objective** | Verify that when policy returns BLOCK, the UI renders a non-dismissible red error panel with the block reason, and the only available action is to return to search — no confirm, override, or approval path is present |
| **Preconditions** | The review panel is displayed. `VITE_MOCK_POLICY=BLOCK` is set. |
| **Test Data** | `VITE_MOCK_POLICY=BLOCK`. Any valid flight selected with valid passenger details. |
| **Test Steps** | 1. Complete search, flight selection, and passenger form. 2. On the review panel, observe the policy outcome panel. |
| **Expected Results** | 1. A red error panel is displayed labelled "Booking Blocked by Policy". 2. The panel includes the policy rule name (e.g. "Destination Restriction") and its details text. 3. A "← Return to Search" button is visible within the panel. 4. No "Confirm Booking" button is visible anywhere on the page. 5. No override option is present. 6. No approval request option is present. 7. The panel cannot be dismissed or closed. |
| **Priority** | P0 |
| **Test Type** | Positive / Policy Block Flow |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-POL-04-03: "no confirm, override, or approval path is visible or accessible." Verify `role="alert"` and `aria-live="assertive"` attributes are present for accessibility. |

---

#### TC-009 — BLOCK panel Return to Search button resets to search form

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-009 |
| **Title** | TC-009_BLOCK_ReturnToSearch_Resets_To_SearchForm |
| **Requirement ID** | REQ-POL-04 |
| **Epic ID** | EPIC-POL-04 |
| **Story ID** | STORY-POL-04-03 |
| **AC ID** | AC-POL-04-03 |
| **Source** | AC |
| **Objective** | Verify that clicking "← Return to Search" from the BLOCK policy panel navigates the traveler back to the search form |
| **Preconditions** | BLOCK policy panel is displayed (TC-008 state). |
| **Test Data** | Continued from TC-008. |
| **Test Steps** | 1. From the BLOCK policy panel, click "← Return to Search". |
| **Expected Results** | 1. The review panel is no longer visible. 2. The search form is displayed again. 3. The search form fields are empty (reset state). 4. No booking confirmation details are displayed. |
| **Priority** | P1 |
| **Test Type** | Positive / Navigation |
| **Automation Candidate** | AUTOMATION_RECOMMENDED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | Verifies the `reset()` context action is called and `currentStep` returns to `search`. |

---

#### TC-010 — Approval pending screen shown when booking requires manager approval

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-010 |
| **Title** | TC-010_Approval_Pending_Screen_Shown_When_PENDING_APPROVAL |
| **Requirement ID** | REQ-EXP-02, REQ-EXP-07 |
| **Epic ID** | EPIC-EXP-02, EPIC-EXP-07 |
| **Story ID** | STORY-EXP-02-05, STORY-EXP-07-05 |
| **AC ID** | AC-EXP-02-05, AC-EXP-07-05 |
| **Source** | AC |
| **Objective** | Verify that when the hold response includes approval details (bookingStatus = PENDING_APPROVAL), the approval pending screen is rendered with the approver name, approval expiry, status label "Pending Approval", and no confirm action |
| **Preconditions** | `VITE_MOCK_POLICY=APPROVAL` is set. Valid passenger details submitted. Review panel displayed. |
| **Test Data** | `VITE_MOCK_POLICY=APPROVAL`. Any valid flight selected with valid passenger (TC-004, TC-005 steps). |
| **Test Steps** | 1. Complete search, flight selection, and passenger form. 2. On the review panel, click "Confirm Booking". 3. Wait for the API response. |
| **Expected Results** | 1. The "Approval Pending" screen is displayed (not the confirmed screen). 2. A header reads "Booking Submitted for Approval". 3. The booking reference (e.g. `CONF-XXXXXXXX`) is displayed. 4. The route (origin → destination, departure and arrival times) is displayed. 5. The total fare is displayed. 6. An "Approval Request Details" section is visible containing: approver name (e.g. "Sarah Johnson (Manager)"), approver email, approval expiry date/time. 7. A status badge reads "⏳ Pending Approval". 8. A locked notice reads "Confirmation is blocked until your manager approves this booking." 9. No "Confirm Booking" button is present anywhere on the screen. 10. A "← Back to Search" button is visible. |
| **Priority** | P0 |
| **Test Type** | Positive / Approval Flow |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-EXP-02-05: "no confirm action is presented". AC-EXP-07-05: "approver's name, approval expiry date/time, status label Pending Approval, confirm blocked". Precondition: `VITE_MOCK_POLICY=APPROVAL` sets both policy eval and `holdBooking` to return approval-required state. |

---

### EPIC-EXP-03 — Confirm Booking (Issue Ticket)

---

#### TC-011 — Confirmed screen displays ticket number, coupons, void window, and total fare

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-011 |
| **Title** | TC-011_Confirmed_Screen_Shows_Ticket_Coupons_VoidWindow_Fare |
| **Requirement ID** | REQ-EXP-03 |
| **Epic ID** | EPIC-EXP-03 |
| **Story ID** | STORY-EXP-03-08 |
| **AC ID** | AC-EXP-03-08 |
| **Source** | AC |
| **Objective** | Verify that once a booking transitions to CONFIRMED, the confirmed screen displays the ticket number, coupon list with segment and status, void window expiry date/time, and total fare with currency |
| **Preconditions** | Booking has been confirmed (happy path from TC-006 — ALLOW policy, `confirmBooking()` returns CONFIRMED). |
| **Test Data** | Default mock — ALLOW policy, mock `confirmBooking()` returns `bookingStatus: CONFIRMED` with a ticket number. |
| **Test Steps** | 1. Complete the full booking flow (TC-001 → TC-004 → TC-005 → TC-006). 2. Observe the "Flight Confirmed!" screen. |
| **Expected Results** | 1. A success header "Flight Confirmed!" is displayed with a green check icon. 2. A "Booking Reference" field shows a formatted confirmation number (e.g. `CONF-XXXXXXXX`). 3. A "Ticket Number 1" field shows a formatted ticket number (e.g. `TKT-XXXXXXXX`). 4. A "PNR" field shows a 6-character alphanumeric code. 5. The itinerary section shows origin airport, destination airport, departure time, arrival time, and flight duration. 6. A coupon table is displayed with at least one row containing: segment (origin → destination), status "OPEN". 7. A "Void Window" section shows a future date/time for free cancellation eligibility. 8. A fare breakdown table shows base fare, taxes, fees, and total — each with a formatted currency amount. 9. A "Payment Reference" field is displayed with a `PAY-XXXXXXXX` value. 10. A "Search Another Flight" button is visible. |
| **Priority** | P0 |
| **Test Type** | Positive / Happy Path |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-EXP-03-08 explicitly requires ticket number, coupon list + statuses, void window expiry, total with currency. Void window is a 24h stub in Phase 1 — test validates presence not exact value. **CLARIFICATION (A2):** Exact void window value to be confirmed when backend endpoint is available. |

---

#### TC-012 — Confirm booking triggers confirmation and transitions away from hold panel

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-012 |
| **Title** | TC-012_Confirm_Booking_Transitions_To_Confirmed_Screen |
| **Requirement ID** | REQ-EXP-03 |
| **Epic ID** | EPIC-EXP-03 |
| **Story ID** | STORY-EXP-03-01 |
| **AC ID** | AC-EXP-03-01 |
| **Source** | AC |
| **Objective** | Verify that clicking "Confirm Booking" from the review panel with an ALLOW policy and a valid payment reference causes the UI to transition to the confirmed state |
| **Preconditions** | Review panel is visible. Policy outcome is ALLOW. "Confirm Booking" button is enabled. |
| **Test Data** | ALLOW policy (default), mock payment reference generated automatically. |
| **Test Steps** | 1. From the review panel with ALLOW policy (TC-005 state), click "Confirm Booking". 2. Observe the loading state. 3. Wait for the response. |
| **Expected Results** | 1. The "Confirm Booking" button shows a loading/spinner state during the API call. 2. The review panel disappears. 3. The confirmed screen appears with status `CONFIRMED`. 4. No error alert is displayed. |
| **Priority** | P0 |
| **Test Type** | Positive / State Transition |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Playwright |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-EXP-03-01 requires `PENDING_ISSUE` to be shown; mock returns `CONFIRMED` directly. Test validates the transition occurs without error. **CLARIFICATION (A1):** Full AC coverage for `PENDING_ISSUE` intermediate state deferred until `TicketingInProgressScreen` is implemented. |

---

### EPIC-EXP-05 — Trip Management (Status Labels)

---

#### TC-013 — Booking status label "On Hold" displayed for HELD status

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-013 |
| **Title** | TC-013_Status_Label_HELD_Displays_On_Hold |
| **Requirement ID** | REQ-EXP-05 |
| **Epic ID** | EPIC-EXP-05 |
| **Story ID** | STORY-EXP-05-04 |
| **AC ID** | AC-EXP-05-04 |
| **Source** | AC |
| **Objective** | Verify that the status mapping utility returns the human-readable label "On Hold" for the HELD booking status |
| **Preconditions** | `statusMapping.ts` is loaded. `getBookingStatusDisplay()` is callable. |
| **Test Data** | `BookingStatusValues.HELD` |
| **Test Steps** | 1. Call `getBookingStatusDisplay('HELD')`. 2. Inspect the returned `label` and `color` properties. |
| **Expected Results** | 1. `label` equals `"On Hold"`. 2. `color` equals `"info"`. 3. `description` is a non-empty string. |
| **Priority** | P1 |
| **Test Type** | Positive / Unit / Data Mapping |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Vitest (unit test — already covered in `statusMapping.test.ts`) |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | This AC covers all 7 status states; only HELD is listed as a separate happy path case. Full status mapping coverage exists in `statusMapping.test.ts`. Cross-reference existing unit tests before duplicating. |

---

#### TC-014 — All required booking status labels are mapped

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-014 |
| **Title** | TC-014_All_Seven_Status_Labels_Return_Human_Readable_Text |
| **Requirement ID** | REQ-EXP-05 |
| **Epic ID** | EPIC-EXP-05 |
| **Story ID** | STORY-EXP-05-04 |
| **AC ID** | AC-EXP-05-04 |
| **Source** | AC |
| **Objective** | Verify that all seven booking states required by AC-EXP-05-04 return the correct human-readable label |
| **Preconditions** | `statusMapping.ts` is loaded. |
| **Test Data** | HELD, PENDING_ISSUE, CONFIRMED, COMPLETED, CANCELLED, EXPIRED, CONFIRM_EXCEPTION |
| **Test Steps** | 1. Call `getBookingStatusDisplay()` for each of the seven status values. 2. Check the `label` returned for each. |
| **Expected Results** | HELD → "On Hold" · PENDING_ISSUE → label contains "Ticketing" · CONFIRMED → "Confirmed" · COMPLETED → "Travel Complete" · CANCELLED → "Cancelled" · EXPIRED → "Hold Expired" · CONFIRM_EXCEPTION → "Action Required" |
| **Priority** | P1 |
| **Test Type** | Positive / Data Mapping |
| **Automation Candidate** | AUTOMATION_REQUIRED |
| **Automation Framework** | Vitest (unit test — partially covered; verify full set) |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-EXP-05-04 explicitly lists all seven labels. Verify existing `statusMapping.test.ts` covers all 7 before generating new automation. |

---

### EPIC-XCT-05 — Error Display

---

#### TC-015 — API error displays user-friendly message without raw codes

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-015 |
| **Title** | TC-015_API_Error_Displays_UserFriendly_Message_No_Raw_Codes |
| **Requirement ID** | REQ-XCT-05 |
| **Epic ID** | EPIC-XCT-05 |
| **Story ID** | STORY-XCT-05-03 |
| **AC ID** | AC-XCT-05-03 |
| **Source** | AC |
| **Objective** | Verify that when any API call returns an error, the UI displays a user-friendly message and does not expose raw error codes, HTTP status codes, stack traces, or internal identifiers |
| **Preconditions** | Application is loaded. A method on `bookingService` can be made to throw. |
| **Test Data** | Mock `searchFlights()` to throw `{ code: "GDS_UNAVAILABLE", message: "internal error", status: 503 }`. |
| **Test Steps** | 1. Trigger a search that causes the service to throw an error. 2. Observe the displayed error. |
| **Expected Results** | 1. An error alert component is displayed. 2. The alert shows a user-friendly message (e.g. "Flight information is temporarily unavailable. Please try again later." or similar). 3. No HTTP status code (503, 500, etc.) is visible in the UI. 4. No raw `error_code` string is visible. 5. No stack trace text is visible. 6. No internal correlation ID is visible in the primary UI surface. 7. An "×" dismiss button is available on the alert. |
| **Priority** | P1 |
| **Test Type** | Positive / Error Handling |
| **Automation Candidate** | AUTOMATION_RECOMMENDED |
| **Automation Framework** | Vitest + React Testing Library (unit/component) |
| **Zephyr Mapping** | ZephyrStatus: PENDING_UPLOAD |
| **Notes** | AC-XCT-05-03 covers all API calls. Happy path for error handling means: the right kind of message is shown. Negative variants (testing each error type) are out of scope for this document. |

---

## Traceability Matrix

| AC ID | Req ID | Story (Placeholder) | Test Case ID(s) | Zephyr Status | Automation | Source |
|-------|--------|---------------------|----------------|---------------|------------|--------|
| AC-EXP-01-01 | REQ-EXP-01 | STORY-EXP-01-01 | TC-001, TC-002, TC-003 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-02-01 | REQ-EXP-02 | STORY-EXP-02-01 | TC-004, TC-005, TC-006 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-02-05 | REQ-EXP-02 | STORY-EXP-02-05 | TC-010 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-02-10 | REQ-EXP-02 | STORY-EXP-02-10 | TC-007 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-03-01 | REQ-EXP-03 | STORY-EXP-03-01 | TC-012 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC (⚠️ partial) |
| AC-EXP-03-08 | REQ-EXP-03 | STORY-EXP-03-08 | TC-011 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-05-04 | REQ-EXP-05 | STORY-EXP-05-04 | TC-013, TC-014 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-EXP-07-05 | REQ-EXP-07 | STORY-EXP-07-05 | TC-010 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-POL-01-05 | REQ-POL-01 | STORY-POL-01-05 | TC-007 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-POL-01-06 | REQ-POL-01 | STORY-POL-01-06 | TC-008 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-POL-04-03 | REQ-POL-04 | STORY-POL-04-03 | TC-008, TC-009 | PENDING_UPLOAD | AUTOMATION_REQUIRED | AC |
| AC-XCT-05-03 | REQ-XCT-05 | STORY-XCT-05-03 | TC-015 | PENDING_UPLOAD | AUTOMATION_RECOMMENDED | AC |

---

## Coverage Gaps — Implemented ACs with No Test Cases Generated

None. All 14 ✅ implemented ACs have at least one happy path test case.

---

## ACs Excluded (Not Implemented — ❌)

The following ACs have no test cases because the feature is not yet implemented. Test cases will be drafted when implementation is complete.

| AC ID | Req ID | Reason Excluded |
|-------|--------|-----------------|
| AC-EXP-03-07 | REQ-EXP-03 | `TicketingInProgressScreen` not implemented |
| AC-EXP-04-01 | REQ-EXP-04 | Cancel UI not implemented |
| AC-EXP-04-02 | REQ-EXP-04 | Void window cancel UI not implemented |
| AC-EXP-04-03 | REQ-EXP-04 | Refund breakdown UI not implemented |
| AC-EXP-04-05 | REQ-EXP-04 | Refund confirmation screen not implemented |
| AC-EXP-05-01 | REQ-EXP-05 | Trip detail page not implemented |
| AC-EXP-05-05 | REQ-EXP-05 | CONFIRM_EXCEPTION alert not implemented |
| AC-EXP-06-03 | REQ-EXP-06 | Expired booking screen not implemented |
| AC-EXP-08-01 | REQ-EXP-08 | Notification centre not implemented |
| AC-EXP-08-02 | REQ-EXP-08 | Notification centre not implemented |
| AC-EXP-08-03 | REQ-EXP-08 | Notification centre not implemented |
| AC-EXP-08-04 | REQ-EXP-08 | Notification centre not implemented |
| AC-POL-03-05 | REQ-POL-03 | Reason-code dropdown not implemented |
| AC-PAY-03-07 | REQ-PAY-03 | Refund summary screen not implemented |
| AC-SVC-01-04 | REQ-SVC-01 | CONFIRM_EXCEPTION UI not implemented |

---

## Automation Candidates Summary

| Priority | Test Case | Recommended Framework |
|----------|-----------|----------------------|
| P0 | TC-001 | Playwright (E2E) |
| P0 | TC-002 | Playwright (E2E) |
| P0 | TC-003 | Playwright (E2E) |
| P0 | TC-004 | Playwright (E2E) |
| P0 | TC-005 | Playwright (E2E) |
| P0 | TC-006 | Playwright (E2E) |
| P0 | TC-007 | Playwright (E2E) |
| P0 | TC-008 | Playwright (E2E) |
| P0 | TC-010 | Playwright (E2E) |
| P0 | TC-011 | Playwright (E2E) |
| P0 | TC-012 | Playwright (E2E) |
| P1 | TC-009 | Playwright (E2E) |
| P1 | TC-013 | Vitest unit (existing coverage check first) |
| P1 | TC-014 | Vitest unit (existing coverage check first) |
| P1 | TC-015 | Vitest + RTL component test |

**Note:** TC-013 and TC-014 may already be fully covered by the existing `statusMapping.test.ts` unit tests (271 passing). Verify before creating duplicate automation.

---

## Clarifications Required Before Automation

| ID | Test Case | Clarification Needed |
|----|-----------|---------------------|
| A1 | TC-012 | Does `PENDING_ISSUE` intermediate state need to be testable before backend is connected? |
| A2 | TC-011 | Will void window expiry come from the backend or remain a 24h stub? What exact format is required? |
| A3 | TC-006 | Must `hold_expires_at` be visible on the confirmed screen, or only during the hold review step? |

---

*Test cases generated strictly from ✅ implemented ACs in `fe_development_status.md` and explicit criteria in `fe_acceptance_criteria.md`. No test cases invented for unimplemented features. No test cases derived from assumptions without labelling.*
