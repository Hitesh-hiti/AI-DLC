# TravelPlatform Web Frontend

React + TypeScript + Vite flight booking frontend with a typed REST API layer.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `VITE_USE_MOCK_API=false` to use the backend API.

## REST API contract

The UI keeps its existing `IFlightBookingService` interface. The HTTP implementation maps it to:

| Operation | Method | Endpoint |
|---|---|---|
| Destination search | GET | `/destinations/search` |
| Flight search | POST | `/flights/search` |
| Hold booking | POST | `/bookings/holds` |
| Confirm booking | POST | `/bookings/{bookingId}/confirm` |
| Booking detail | GET | `/bookings/{bookingId}` |
| List bookings | GET | `/bookings` |
| Cancel booking | POST | `/bookings/{bookingId}/cancel` |
| Evaluate policy | POST | `/policies/evaluate` |
| Approval decision | POST | `/approvals/{approvalId}/decision` |
| Generate PNR | POST | `/bookings/{bookingId}/pnr` |
| Payment approval | POST | `/bookings/{bookingId}/payment-approval` |

Successful responses may be either the typed payload directly or the existing `{ success, data, error }` envelope. Errors are converted to the existing `ApiError` model and handled by `mapApiError`.

Authentication uses an optional `auth_token` value from browser local storage and sends it as `Authorization: Bearer <token>`.

## Validation

```bash
npm test
npm run build
npm run lint
```
