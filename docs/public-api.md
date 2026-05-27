# Percorso Capitale — Public API for the AI Training Agent

Stable, machine-readable read-only endpoints designed for an external AI agent that needs
to learn from a user's financial state on Percorso Capitale.

All endpoints share the same authentication, error format, and conventions.

---

## 1. Authentication

Every request **must** include both headers:

| Header           | Value                                          |
|------------------|------------------------------------------------|
| `X-API-Key`      | Master API key (provided out-of-band).         |
| `X-User-Email`   | The email of the Percorso Capitale user whose data you want to read. |

Example:

```bash
curl -s "https://<host>/api/public/dashboard" \
  -H "X-API-Key: $PERCORSO_MASTER_KEY" \
  -H "X-User-Email: user@example.com"
```

If either header is missing or invalid → `401 Unauthorized`.
If the email does not match an existing user → `404 Not Found`.

---

## 2. Conventions

- Base URL: same origin as the app.
- All responses are JSON. Encoding: UTF-8.
- Money fields are returned as strings (Postgres `decimal`) **or** numbers depending on the
  endpoint; the doc for each field is explicit. Always parse with `parseFloat`.
- Dates are ISO `YYYY-MM-DD` (local, no timezone).
- Read-only: no public POST/PUT/DELETE endpoints are exposed.
- Errors:
  ```json
  { "message": "human-readable description" }
  ```
- Backward compatibility: when a field name appears both in a normalized shape and as a
  legacy flat field, **both are kept**. New consumers should prefer the normalized shape.

---

## 3. Endpoints

### 3.1 `GET /api/public/dashboard`

Full dashboard snapshot (net worth, liquidity, monthly cashflow, etc.). Shape is the same
as the internal `/api/dashboard-unified`.

---

### 3.2 `GET /api/public/account-architecture`

The user's 6-account architecture (Conto di Ingresso, Pila, Circolante, Emergenze,
Investimenti, Accantonamenti) with real-time portfolio valuation that is **resilient** to
Finnhub failures.

**Response shape:**

```jsonc
{
  "id": 27,
  "userId": 16,
  "monthlyIncome": "2500.00",
  "autoDistributionEnabled": false,
  "distributionDay": 2,

  // NEW: normalized array — prefer this for new consumers
  "accounts": [
    {
      "key": "income" | "wealth" | "operating" | "emergency" | "investment" | "savings",
      "name": "Conto di Ingresso",
      "bankName": "Intesa Sanpaolo",
      "iban": "IT...",
      "balance": "1200.00",
      "monthlyAllocation": "500.00" | null,
      "extras": {
        // emergency  → { "targetAmount": "5000.00" }
        // investment → { "priceSource": "realtime"|"fallback"|"mixed",
        //                "realtimeCount": N, "fallbackCount": N, "instrumentsCount": N }
        // savings    → { "subAccounts": [ { id, name, targetAmount, currentAmount, monthlyAllocation } ] }
      }
    }
  ],
  "subAccounts": [ /* same as savings.extras.subAccounts */ ],

  "meta": {
    "totalBalance": "1234.56",
    "portfolioPriceSource": "realtime" | "fallback" | "mixed",
    "accountsCount": 6,
    "subAccountsCount": 2
  },

  // BACK-COMPAT: flat per-account fields (deprecated; use accounts[] above)
  "incomeAccountName": "...", "incomeAccountIban": "...", "incomeAccountBalance": "...",
  "wealthAccountName": "...", "wealthMonthlyAllocation": "...",
  ...
}
```

**Notes:**
- `accounts[4].balance` (investment) is the recomputed portfolio market value.
- If Finnhub is down, the endpoint **never throws**: it falls back to each investment's
  `averagePrice`/`currentPrice` and reports `priceSource: "fallback"` (or `"mixed"`).

```bash
curl -s "https://<host>/api/public/account-architecture" \
  -H "X-API-Key: $KEY" -H "X-User-Email: $EMAIL" | jq '.accounts'
```

---

### 3.3 `GET /api/public/transactions`

Complete transaction history with **rich server-side filters** and **pre-paginated
aggregates**. There is no silent cap: omitting `limit` returns every matching row.

**Query parameters (all optional):**

| Param            | Type      | Description                                                          |
|------------------|-----------|----------------------------------------------------------------------|
| `startDate`      | `YYYY-MM-DD` | Inclusive lower bound on `date`.                                  |
| `endDate`        | `YYYY-MM-DD` | Inclusive upper bound on `date`.                                  |
| `type`           | string    | `income`, `expense`, `investment`, `goal_contribution`, `goal_refund`, `transfer`. |
| `category`       | string    | Exact match on transaction `category`.                              |
| `subcategory`    | string    | Exact match on `subcategory`.                                       |
| `accountType`    | string    | `income` / `wealth` / `operating` / `emergency` / `investment` / `savings` / `custom_<id>`. |
| `budgetCategory` | string    | `needs` / `wants` / `savings`.                                      |
| `merchant`       | string    | Case-insensitive substring against `merchant` + `description`.      |
| `minAmount`      | number    | `amount >= minAmount`.                                              |
| `maxAmount`      | number    | `amount <= maxAmount`.                                              |
| `limit`          | integer   | Max rows returned. Omit = unlimited.                                |
| `offset`         | integer   | Pagination offset (default `0`).                                    |
| `legacy`         | `1` / `true` | Return a bare array instead of the `{data, meta}` envelope (back-compat). |

**Default response shape (no `legacy`):**

```jsonc
{
  "data": [ /* Transaction[] */ ],
  "meta": {
    "total": 1247,
    "returned": 100,
    "offset": 0,
    "limit": 100,
    "period": { "from": "2024-01-03", "to": "2026-05-27" },
    "totals": {
      "income": 45230.10,
      "expense": 31200.55,
      "investment": 4000.00,
      "goalContribution": 600.00,
      "goalRefund": 0,
      "transfer": 0,
      "net": 14029.55
    },
    "byType":           { "expense": { "count": 980, "total": 31200.55 }, ... },
    "byCategory":       { "Alimentari e Spesa": { "count": 211, "total": 4120.30 }, ... },
    "byAccount":        { "operating":         { "count": 540, "total": 18230.10 }, ... },
    "byBudgetCategory": { "needs":             { "count": 612, "total": 21430.10 }, ... },
    "filters": { /* echo of the query params actually applied */ }
  }
}
```

Aggregates are computed **on the full filtered set** before pagination, so they remain
accurate even if you page through results.

```bash
# Tutte le spese di alimentari nel 2025
curl -s "https://<host>/api/public/transactions?type=expense&category=Alimentari%20e%20Spesa&startDate=2025-01-01&endDate=2025-12-31" \
  -H "X-API-Key: $KEY" -H "X-User-Email: $EMAIL" | jq '.meta.totals'
```

---

### 3.4 `GET /api/public/budget-settings`

The 50/30/20 configuration plus pre-computed euro budgets.

```jsonc
{
  "id": 8,
  "userId": 16,
  "needsPercentage": "50.00",
  "wantsPercentage": "30.00",
  "savingsPercentage": "20.00",
  "monthlyIncome": "2500.00",
  "customCategories": [ /* user-defined splits, if any */ ],
  "createdAt": "...",
  "updatedAt": "...",

  "computed": {
    "monthlyIncome":   2500,
    "needsBudget":     1250.00,
    "wantsBudget":      750.00,
    "savingsBudget":    500.00,
    "totalPercentage":  100,
    "isValid":          true
  }
}
```

Returns `null` if the user has never configured a budget.

---

### 3.5 `GET /api/public/category-budgets`

Per-category budget rows with **current-month spent**, remaining, and utilization.

**Query:** `?month=YYYY-MM` (default: current month).

```jsonc
{
  "data": [
    {
      "id": 25,
      "userId": 16,
      "category": "Alimentari e Spesa",
      "subcategory": null,
      "monthlyBudget": "400.00",
      "budgetType": "expense",
      "isActive": true,

      "currentMonthSpent": 312.45,
      "remaining": 87.55,
      "utilizationPct": 78.11,
      "transactionsCount": 19
    }
  ],
  "meta": {
    "month": "2026-05",
    "periodStart": "2026-05-01",
    "periodEnd":   "2026-05-31",
    "totalBudget":  1850.00,
    "totalSpent":   1322.10,
    "count": 12
  }
}
```

---

## 4. Operational notes for the training agent

1. **Idempotency:** every endpoint is a pure `GET`; safe to retry.
2. **Rate limiting:** there is no hard limiter today, but please stay under ~5 req/s per
   user. Prefer cached responses on your side.
3. **Pagination over fetching everything:** when ingesting a long-tenure user, page
   transactions in chunks of 500–1000 using `limit` + `offset`, but trust `meta.totals`
   instead of summing pages yourself.
4. **Portfolio valuations:** if `meta.portfolioPriceSource !== "realtime"`, do not use the
   investment-account balance for training labels — note it as `stale`.
5. **Backward compatibility:** flat per-account fields on `/account-architecture` and
   `legacy=1` on `/transactions` will continue to work; do **not** rely on them being
   removed.

---

## 5. Versioning

This document describes the public API as of **2026-05-27**. Breaking changes will be
announced before being shipped. Additive changes (new fields, new endpoints) may appear
at any time — make sure your client tolerates unknown fields.
