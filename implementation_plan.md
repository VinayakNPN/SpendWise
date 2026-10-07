# Financial App Refinement & Implementation Plan

## 0. Purpose

This document supersedes the existing `implementation_plan.md`.

The application is already feature-rich enough that the next work must be done as a controlled product refinement and architecture upgrade rather than as one large redesign. The implementation agent must execute this document phase-by-phase, verify each phase, commit it, and only then continue.

Primary product goal:

> Turn the current finance tracker into a private, local-first personal financial command center that makes transaction capture effortless, account balances trustworthy, financial data complete, and everyday interactions polished.

The application should become especially strong at one thing:

> **Knowing whether the user's financial ledger is complete and accurate without requiring the user to remember everything manually.**

Do not attempt the entire roadmap in one pass.

---

# 1. Current Product Baseline

## 1.1 Existing technical foundation

Current repository characteristics:

- React Native + Expo
- TypeScript
- SQLite via `expo-sqlite`
- React Navigation bottom tabs
- React Query for database-backed queries/mutations
- React Context based app store
- React Native Reanimated is already available
- local-first data model
- Groq-based AI integration
- push notification support

Important current source areas:

```text
App.tsx
src/screens/
src/components/
src/services/database.ts
src/services/groq.ts
src/services/notifications.ts
src/state/AppStore.tsx
src/state/types.ts
src/state/queries.ts
src/utils/finance.ts
src/utils/theme.ts
app.json
```

## 1.2 Existing implementation-plan problem

The current implementation plan starts with income/category/budget work and then proposes automatic recurring expense creation.

That ordering is no longer appropriate.

The new implementation order must prioritize:

1. UI/interaction stability
2. secure global privacy behavior
3. financial domain correctness
4. proper transaction/account architecture
5. transaction capture and reconciliation
6. navigation/UI refinement
7. advanced intelligence
8. release hardening

Do not revive the old automatic-recurring-expense behavior.

---

# 2. Product Principles

Every implementation decision must follow these rules.

### Principle A — Ledger first

A budget is not a transaction.

A recurring plan is not a completed payment.

A projection is not current wealth.

An income event is not an asset.

A transfer between accounts is not an expense.

### Principle B — Local-first by default

Financial data should remain on-device unless the user explicitly enables a feature that requires cloud processing.

### Principle C — Never silently fabricate financial events

The application must never automatically create a completed transaction merely because a category is fixed, a budget exists, or a recurring payment is expected.

Expected payments must remain expected/pending until confirmed.

### Principle D — Capture should be faster than manual entry

Normal manual entry should take seconds.

Receipt sharing should take even less.

### Principle E — Every automated decision must be reviewable

Detected transactions, OCR results, categorization and duplicate detection must expose enough information for the user to confirm or correct the result.

### Principle F — Destructive financial operations should be reversible

Deletes should use undo/soft-delete semantics where practical.

### Principle G — Financial calculations must be deterministic

AI can explain calculations. AI must not replace the calculation engine.

### Principle H — Small-screen usability is a first-class requirement

The application must work correctly with:

- keyboard open
- keyboard closed
- small Android screens
- large Android screens
- iPhone-class screens
- long category names
- long merchant names
- large amounts
- large transaction lists
- system font scaling

---

# 3. UI/UX Audit From The Screen Recording

The recording covers the major application surfaces:

```text
Home
→ Expenses
→ Category filtering
→ AI Coach
→ Goal Planner
→ Investment Planner
→ Settings
→ Accounts/Balances
→ Category Budgets
```

The existing visual language is coherent, but several interaction patterns make the product feel like a collection of screens instead of one financial system.

## 3.1 Home

Observed strengths:

- clear financial hierarchy
- recognizable green primary action color
- useful spending/category information
- visually understandable cards
- bottom navigation is easy to recognize

Problems to address:

- too much dashboard content competes for attention
- AI forecast has more visual prominence than financial completeness
- account balances do not feel like the central source of truth
- there is no obvious "transactions needing review" state
- no global privacy/masking control
- no direct answer to "how much can I safely spend?"
- cards consume substantial vertical space
- the user must interpret several metrics to understand current cash position

Future Home hierarchy:

```text
1. Safe to Spend
2. Accounts and available cash
3. Needs Review / Financial Inbox
4. Upcoming obligations
5. Current-month spending
6. Secondary insights
7. AI explanations
```

## 3.2 Expenses / Activity

Observed strengths:

- category filters are understandable
- transaction history is visible
- search is easy to recognize
- transaction totals are visible
- category chips are convenient

Problems:

- the add form occupies a large amount of vertical space
- history is pushed down by the form
- transaction rows have an immediately visible destructive red delete affordance
- rows do not look like rich financial records
- no account/source is displayed
- no transaction status is displayed
- no receipt/reference/source metadata is shown
- no transfer/income/refund distinction exists
- category names such as `Personal living expense` and `Rakhi expense` are too verbose for primary category chips
- list rows should not need a trash button permanently occupying valuable space
- no transaction-detail screen is available for deeper inspection
- no grouping by date such as Today / Yesterday / Earlier

Recommended direction:

```text
Activity
[ Search ]

Needs review
2 transactions

Today
transaction
transaction

Yesterday
transaction
transaction

Earlier
...
```

Use a floating `+` or compact add control rather than permanently occupying the top of the page with the complete form.

## 3.3 Quick Add

The existing quick-add area is a good concept but needs to become the primary low-friction capture surface.

Required improvements:

- amount-first interaction
- keyboard-safe layout
- large numeric keyboard for amount
- merchant/name field with sensible focus behavior
- category selection with horizontal scrolling or compact grid
- account selector
- date/time selector
- optional note
- receipt attachment
- transaction type
- save button that stays reachable while the keyboard is open
- auto-focus rules
- error handling without moving the entire form unexpectedly

## 3.4 Keyboard behavior

This is a P0 usability issue.

Current implementation already imports `KeyboardAvoidingView`, but this must be tested rather than assumed to be correct.

Required behavior:

1. User taps an input.
2. Keyboard opens.
3. The focused input remains visible.
4. The current input never becomes hidden behind the keyboard.
5. The submit/save action remains accessible or the form scrolls automatically to it.
6. Bottom navigation must not overlap the keyboard.
7. User can scroll the form while keyboard is visible.
8. Keyboard dismissal should not jump the screen back to an unexpected scroll position.
9. Tapping outside editable fields should dismiss the keyboard where appropriate.
10. Switching between fields must preserve scroll position intelligently.

Android configuration must be explicitly tested with the Expo keyboard layout configuration.

The implementation should prefer:

- `KeyboardAvoidingView`
- appropriate `behavior` per platform
- a scrollable content container
- measured keyboard offset where needed
- `tabBarHideOnKeyboard: true`
- Android `softwareKeyboardLayoutMode` chosen intentionally and verified on the actual target device

Do not solve this by applying arbitrary `marginBottom` values.

## 3.5 Amount input animation

Add subtle feedback while entering an amount.

Desired behavior:

```text
0
→ 5
→ 50
→ 500
→ 5,000
```

The numeric display may:

- slightly scale/fade on value change
- animate formatting transitions
- animate the currency label very subtly
- remain visually stable during rapid typing

Do not use:

- large bouncing animations
- spring overshoot that makes numbers difficult to read
- animated layout shifts that move the keyboard
- expensive per-keystroke rerenders across the whole screen

Use Reanimated only around the amount display/input region.

Target:

- animation duration ~100–180ms
- ease-out or controlled spring
- no animation if the user is rapidly typing multiple digits unless it remains imperceptible
- respect reduced-motion accessibility settings

## 3.6 Touch feedback

All important tappable controls should provide immediate feedback.

Required:

- subtle pressed opacity/scale
- clear selected state
- minimum touch target around 44–48dp
- icon-only controls must have sufficient invisible hit area
- delete should have stronger confirmation/undo
- segmented chips must not rely only on color to communicate selected state

Avoid:

- large scale-down effects
- delayed feedback
- controls that look disabled when merely unfocused

## 3.7 Forms

Current forms contain many large rounded fields.

Refine them by:

- reducing unnecessary vertical spacing
- using consistent field heights
- using clear labels above fields
- using semantic keyboard types
- showing validation near the field
- preserving entered values after validation failure
- disabling save only for genuinely invalid states
- showing inline loading state when a save is asynchronous
- avoiding full-screen Alert dialogs for routine validation

Amount fields:

```text
keyboardType = numeric/decimal
```

Name/merchant:

```text
keyboardType = default
returnKeyType = next
```

Notes:

```text
multiline where appropriate
```

## 3.8 Long text handling

The app must gracefully support:

- `Personal living expense`
- long merchant names
- long account names
- long goal titles

Rules:

- primary title: one or two lines maximum
- secondary metadata: one line where possible
- truncate with ellipsis
- category chips should scroll horizontally instead of forcing layout overflow
- transaction detail page can show full text

## 3.9 Empty states

Every major screen needs a proper empty state.

Examples:

```text
No transactions yet
Add your first expense

No goals yet
Create a goal

No investments yet
Add your first investment

No transactions need review
You're fully caught up
```

Empty states must not look like errors.

## 3.10 Loading states

Use skeleton or stable loading placeholders instead of layout popping.

Do not show a spinner that replaces the entire screen for short local SQLite operations.

Prefer:

- button-level loading
- list skeletons only on initial load
- optimistic UI only when rollback is reliable

---

# 4. Phase 0 — Establish a Safe Baseline

## Objective

Create a reliable checkpoint before making architectural or visual changes.

### Tasks

- [ ] Create a dedicated feature branch.
- [ ] Verify current app boots on the target Android device.
- [ ] Capture screenshots of every current screen.
- [ ] Record a baseline video of the same flows used in the supplied recording.
- [ ] Run TypeScript/type checks.
- [ ] Run the current test/lint commands if available.
- [ ] Verify SQLite database initialization.
- [ ] Export a real backup of current user data.
- [ ] Keep the current `implementation_plan.md` in git history before replacing it.

### Acceptance criteria

- Existing application still launches.
- Existing database opens.
- Existing financial records remain readable.
- Baseline backup exists.
- No behavior is changed in this phase.

### Commit

```text
chore: establish stable baseline before finance refactor
```

---

# 5. Phase 1 — Create a Small Design System

## Objective

Stop repeating ad-hoc colors, spacing, radii, typography and input styles across screens.

### Tasks

- [ ] Audit `src/utils/theme.ts`.
- [ ] Create semantic color tokens.
- [ ] Create spacing tokens.
- [ ] Create typography tokens.
- [ ] Create border-radius tokens.
- [ ] Create elevation/shadow tokens.
- [ ] Create standard field sizes.
- [ ] Create primary/secondary/destructive button primitives.
- [ ] Create standard card primitive.
- [ ] Create standard chip primitive.
- [ ] Create standard section heading.
- [ ] Create standard icon-button primitive.
- [ ] Create standard amount-text component.
- [ ] Create standard empty-state component.
- [ ] Create standard inline-error component.
- [ ] Create standard loading button.
- [ ] Centralize success/error colors.

### Visual rules

Primary green should remain the core accent unless branding phase explicitly changes it.

Do not introduce gradients everywhere.

Do not introduce multiple unrelated accent colors just because each category has a color.

### Acceptance criteria

- Existing screens can consume common components.
- Typography and spacing are visually consistent.
- No functional behavior is changed.

---

# 6. Phase 2 — Interaction and Keyboard Foundation

## Objective

Fix the highest-frequency UX problems before redesigning the screens.

## 6.1 Global keyboard behavior

- [ ] Define a reusable `KeyboardSafeScreen` component.
- [ ] Define a reusable `KeyboardAwareForm` component where required.
- [ ] Ensure scroll view can move the focused field above the keyboard.
- [ ] Hide bottom tabs when keyboard is visible.
- [ ] Verify Android behavior on a real device.
- [ ] Verify iOS behavior if an iOS build is supported.
- [ ] Avoid nested scroll views unless absolutely required.
- [ ] Ensure keyboard dismissal works consistently.
- [ ] Preserve scroll offset after keyboard dismissal.

## 6.2 Input focus

- [ ] Define logical focus order.
- [ ] `Name → Amount → Category → Account → Note`.
- [ ] Set `returnKeyType` appropriately.
- [ ] Allow the user to tap directly into any field.
- [ ] Do not unexpectedly autofocus every form.

## 6.3 Amount input

- [ ] Use numeric keyboard.
- [ ] Preserve raw numeric state internally.
- [ ] Format display for Indian numbering.
- [ ] Do not format in a way that makes cursor positioning unusable.
- [ ] Validate positive values.
- [ ] Reject malformed values.
- [ ] Support decimal currency if the ledger is later extended.
- [ ] Add subtle amount-change animation.

## 6.4 Press feedback

- [ ] Add pressed-state animation to buttons.
- [ ] Add pressed-state opacity to cards.
- [ ] Keep animation under ~180ms.
- [ ] Do not animate every list row continuously.

## Acceptance tests

Manually verify every form with:

- keyboard closed
- keyboard open
- first field
- middle field
- last field
- long text
- amount with 5–7 digits
- validation failure
- save
- cancel
- keyboard dismissal

---

# 7. Phase 3 — Global Privacy Mode

## Objective

Implement the Eye icon and make it a real system feature.

## 7.1 State

Add a global preference:

```ts
privacyMode: boolean
```

## 7.2 Amount rendering

Create one formatting path:

```ts
formatMoney(amount, { masked })
```

Do not individually implement masking in every screen.

## 7.3 Mask all financial values

Mask:

- [ ] account balances
- [ ] total balance
- [ ] net worth
- [ ] expenses
- [ ] income
- [ ] budget values
- [ ] goal values
- [ ] debt balances
- [ ] investment values
- [ ] forecast values
- [ ] transaction totals
- [ ] AI-generated monetary values where rendered by the UI

## 7.4 Eye icon

Place a global Eye icon in the primary app header.

States:

```text
Visible
Hidden
```

Use an eye-open / eye-off icon.

Do not use a navigation action for this.

## 7.5 Privacy persistence

Decide whether privacy mode persists across app launches.

Preferred:

- persist user preference
- optionally provide "Hide automatically when app leaves foreground"

## 7.6 App background protection

Optional but recommended:

- [ ] blur sensitive content when app becomes inactive
- [ ] restore content on foreground
- [ ] test Android recent-apps screenshot behavior

## 7.7 Biometric lock

Prepare the preference model now.

Actual biometric implementation can be a later phase if it requires additional native work.

---

# 8. Phase 4 — Financial Domain Model Refactor

## Objective

Move from a simple expense list to a proper financial ledger.

This is the most important engineering phase.

## 8.1 Replace "expense-only thinking"

Introduce transaction types:

```text
EXPENSE
INCOME
TRANSFER
REFUND
ADJUSTMENT
INVESTMENT_CONTRIBUTION
INVESTMENT_WITHDRAWAL
```

Do not remove the existing expense data abruptly.

## 8.2 Transaction schema

Target conceptual fields:

```text
id
type
amountMinor
currency
accountId
fromAccountId
toAccountId
categoryId
merchant
description
occurredAt
createdAt
updatedAt
source
sourcePayload
externalReference
receiptUri
fingerprint
status
confidence
note
isDeleted
```

Use integer minor currency units (`paise`) rather than floating-point money for financial calculations.

## 8.3 Categories

Categories become stable entities.

Transaction records should refer to `categoryId`, not duplicate category names.

## 8.4 Accounts

Accounts represent real money containers:

```text
BANK
WALLET
UPI_LITE
CASH
INVESTMENT
```

The exact enum can be expanded later.

SBI, BOI and UPI Lite must be separate accounts.

## 8.5 Transfers

A transfer:

```text
SBI → UPI Lite ₹5,000
```

must create two account movements but zero expense.

## 8.6 Refunds

Refunds should either:

- link to original transaction
- or create a separate refund transaction with a `relatedTransactionId`

## 8.7 Reconciliation support

Add:

```text
openingBalance
balanceAdjustment
lastReconciledAt
```

at account level or via a separate balance/reconciliation table.

## 8.8 Migration

Write explicit migrations.

Do not rely on many `ALTER TABLE ... catch` statements as the permanent migration system.

Migration stages should be versioned:

```text
001_initial
002_accounts
003_categories
004_transactions
005_transaction_sources
...
```

## Acceptance criteria

Existing expense records are migrated without loss.

Each migrated expense has:

```text
type = EXPENSE
accountId = null or user-selected legacy account
categoryId = resolved category
```

Legacy records must remain visible.

---

# 9. Phase 5 — Account-Centric Balance Engine

## Objective

Make SBI/BOI/UPI Lite balances useful and trustworthy.

## 9.1 Balance calculation

Target:

```text
Current balance =
opening balance
+ income
+ transfers in
+ refunds
+ adjustments
- expenses
- transfers out
- investment contributions
```

## 9.2 Remove manual balance as the source of truth

Manual balance may be retained only as:

```text
opening balance
```

or:

```text
reconciliation adjustment
```

Do not silently overwrite a calculated balance.

## 9.3 Accounts screen

Create a dedicated Accounts experience:

```text
Accounts

SBI
₹*****

BOI
₹*****

UPI Lite
₹*****

Total liquid balance
₹*****
```

Show:

- account type
- current balance
- last activity
- recent change
- optional institution icon

## 9.4 Account detail

Account detail should show:

```text
Current balance
Opening balance
Money in
Money out
Transfers
Recent activity
Reconcile
```

## 9.5 Reconcile account

User enters actual bank balance:

```text
App balance: ₹38,240
Actual SBI balance: ₹37,740
Difference: -₹500
```

The app explains likely reasons before offering an adjustment.

---

# 10. Phase 6 — Transaction Capture UX

## Objective

Make manual transaction creation exceptionally fast.

## 10.1 New Add Transaction bottom sheet

Prefer a bottom sheet/modal flow instead of permanently reserving most of the Activity screen for the form.

Fields:

```text
Amount
Merchant
Category
Paid from
Date
Note
Receipt
```

## 10.2 Amount-first flow

When the user opens Add Transaction:

1. amount is the primary field
2. numeric keyboard opens
3. amount remains visible
4. category/account selection remains reachable after keyboard is opened
5. save CTA is always reachable

## 10.3 Smart defaults

- last-used account
- last-used category
- current date/time
- merchant memory
- sensible transaction type default

## 10.4 Merchant memory

Add a local mapping:

```text
merchant_normalized
categoryId
accountId
confidence
usageCount
lastUsedAt
```

Example:

```text
Swiggy → Food
Uber → Transport
Amazon → Shopping
```

## 10.5 Duplicate detection

Before saving:

```text
Possible duplicate

₹487
Zomato
21 Aug
UPI Lite

Existing transaction looks similar.

[Keep Both]
[Use Existing]
```

Never silently reject a legitimate transaction.

---

# 11. Phase 7 — Android Share-to-App Receipt Capture

## Objective

Implement the user's highest-priority workflow.

Target flow:

```text
Payment
↓
Receipt/notification
↓
Android Share
↓
Finance app
↓
Extract details
↓
Choose category
↓
Choose account
↓
Confirm
```

## 11.1 Share receiver

Support at minimum:

```text
text/plain
image/*
application/pdf
```

Test:

- UPI receipt text
- screenshot
- image receipt
- PDF receipt
- malformed share payload

## 11.2 Intake model

Create:

```text
CaptureCandidate
```

containing:

```text
sourceType
rawText
imageUri
fileUri
detectedAmount
detectedMerchant
detectedDate
detectedTime
detectedReference
detectedAccountHint
confidence
```

## 11.3 Parser

Parsing must be deterministic where possible.

Handle common Indian transaction patterns:

```text
Paid ₹340 to Swiggy
INR 340
debited Rs.340
UPI Ref ...
```

Do not build a universal parser initially.

Support multiple parser strategies with confidence scoring.

## 11.4 Review screen

Show:

```text
₹340

Swiggy

Food
UPI Lite

21 Aug · 11:42 AM

Source: Shared receipt

[Save Transaction]
```

Category chips should be pulled directly from the user's configured categories.

## 11.5 Receipt attachment

Store a local URI or managed file reference.

Do not upload receipts to a cloud AI service by default.

## 11.6 Source labeling

Every captured transaction should show:

```text
Source:
Manual
Shared receipt
Notification
Imported statement
```

This is important for reconciliation.

---

# 12. Phase 8 — Financial Inbox

## Objective

Create the system that solves forgotten transactions.

## 12.1 Inbox states

```text
DETECTED
PENDING_REVIEW
CONFIRMED
IGNORED
DUPLICATE
```

## 12.2 Inbox UI

Home should surface:

```text
Needs review
2 transactions
```

Tap → Financial Inbox.

Example row:

```text
₹420
Amazon
21 Aug
SBI

Confidence 96%

[Add]
```

## 12.3 Review actions

- Add
- Edit
- Ignore
- Mark duplicate
- Attach receipt
- Change account
- Change category

## 12.4 Capture source priority

Later support:

```text
Share
Notification
Statement import
Manual
```

Do not implement all four in one phase.

---

# 13. Phase 9 — Reconciliation & Completeness

## Objective

Make the application detect when it is missing transactions.

## 13.1 Coverage score

Example:

```text
Transaction coverage
94%

29 recorded
31 detected

2 need review
```

This is a major product differentiator.

## 13.2 Balance drift

For each account:

```text
Ledger balance
Actual balance
Difference
```

## 13.3 Missing transaction detection

Compare:

- notification candidates
- imported statements
- receipt fingerprints
- account balances
- transaction dates
- merchant patterns

## 13.4 Statement import

Later support:

- CSV
- Excel
- bank statement formats

Import should always preview before commit.

## 13.5 Reconciliation report

Show:

```text
Account: SBI

Expected: ₹37,740
Actual: ₹37,240
Difference: ₹500

Possible causes:
1. Missing transaction
2. Duplicate transaction
3. Transfer missing
4. Balance adjustment needed
```

---

# 14. Phase 10 — Recurring Payments and Upcoming Obligations

## Objective

Replace unsafe auto-generated expenses with expected events.

## 14.1 Recurring payment model

Example:

```text
Rent
₹10,265
Monthly
Due: 5th
Account: SBI
Category: Housing
```

## 14.2 States

```text
UPCOMING
DUE
PAID
SKIPPED
OVERDUE
```

## 14.3 Expected transaction

A recurring schedule creates:

```text
Expected payment
```

not:

```text
Completed expense
```

## 14.4 Confirmation

When paid:

```text
Mark as paid
```

creates the real transaction.

## 14.5 Upcoming section

Home:

```text
Upcoming

Rent     ₹10,265
SIP       ₹3,000
```

This feeds the Safe-to-Spend calculation.

---

# 15. Phase 11 — Home Dashboard Redesign

## Objective

Rebuild Home around actionable financial state rather than widget density.

Recommended hierarchy:

```text
Header
Eye icon
Privacy state

Safe to Spend

Accounts

Needs Review

Upcoming

Month-to-date

Secondary insights
```

## 15.1 Safe to Spend

Base model:

```text
Liquid cash
- upcoming obligations
- planned investments
- goal allocations
- debt payments
- safety buffer
= safe discretionary amount
```

Name the calculation clearly.

Do not call a simple daily budget calculation "AI".

## 15.2 Account summary

Show each account and total liquid balance.

## 15.3 Needs review

Show this only when there are unresolved items.

## 15.4 Upcoming

Show the next 3–5 expected payments.

## 15.5 Secondary analytics

Keep:

- spending categories
- budget health
- trends
- no-spend streak

but reduce visual prominence.

---

# 16. Phase 12 — Activity Screen Redesign

## Objective

Make transactions the primary object.

## Layout

```text
Activity

[ Search transactions... ]

[All] [Expenses] [Income] [Transfers] [Pending]

Needs review

Today
...

Yesterday
...

Earlier
...
```

## Transaction row

Recommended information:

```text
Merchant/title
Category · Account · Time
Amount
Status/source indicator
```

No permanent trash button.

## Interaction

Tap row → transaction detail.

Swipe:

```text
Edit
Delete
```

or:

```text
More
```

Use undo after deletion.

## Search

Search across:

- merchant
- description
- notes
- category
- account
- transaction reference

---

# 17. Phase 13 — Transaction Detail

Create a dedicated screen.

Sections:

```text
Amount

Merchant
Category
Account
Date/time

Transaction type

Reference

Source

Receipt

Notes
```

Actions:

```text
Edit
Duplicate
Delete
Move to another account
Mark duplicate
```

If captured automatically:

```text
Detection confidence
Parser/source information
```

should be accessible.

---

# 18. Phase 14 — Goals, Debt and Investments

## 18.1 Goals

A goal should connect to actual allocations.

Model:

```text
Target
Current allocated amount
Account
Monthly contribution
Expected completion
```

Avoid manually typing `savedAmount` unless it represents an actual allocation or transaction.

## 18.2 Debt

Track:

```text
Principal
Outstanding
Interest
Minimum payment
Due date
Payment schedule
Next payment
Estimated payoff
```

## 18.3 Investments

Separate:

```text
Current portfolio value
```

from:

```text
Projected future value
```

Current value belongs in net worth.

Future projection belongs in planning.

---

# 19. Phase 15 — Fix Financial Calculations

## 19.1 Net worth

Correct model:

```text
Cash assets
+ current investment values
+ other current assets
- outstanding liabilities
```

Do not add income as an asset.

Do not use future projected investment value as current net worth.

## 19.2 Spending

Use transaction types.

Do not include:

- transfers
- investment movements
- excluded adjustments

in spending totals unless intentionally configured.

## 19.3 Budget

Distinguish:

```text
budgeted
spent
committed
remaining
```

## 19.4 Safe to Spend

Safe-to-spend must be deterministic and explainable.

## 19.5 Date handling

Store timestamps consistently.

Render according to the user's local timezone.

Do not group days using naive UTC string slicing.

---

# 20. Phase 16 — Settings Refactor

Split Settings into logical groups.

Recommended:

```text
Money
  Accounts
  Categories
  Budget

Planning
  Goals
  Debt
  Recurring payments
  Investments

Security
  Privacy mode
  App lock
  Biometrics
  Background privacy

Data
  Backup
  Restore
  Export
  Import

Notifications
  Reminders
  Upcoming payments

AI & Privacy
  AI mode
  Cloud processing
  Local-only mode

Appearance
  Theme
  Compact mode
```

Do not leave every financial control in one long scroll.

---

# 21. Phase 17 — Backup, Restore and Security

## Objective

Make the local-first claim technically credible.

## 21.1 Backup

Current JSON export should become a versioned backup format.

Include:

```text
schemaVersion
createdAt
appVersion
transactions
accounts
categories
budgets
goals
debts
investments
preferences
merchant mappings
recurring schedules
```

## 21.2 Restore

Before restore:

- validate schema
- validate required fields
- validate numeric ranges
- validate relationships
- show backup metadata
- require confirmation

Restore should be transactional.

## 21.3 Encryption

Consider encrypted backup using a modern authenticated encryption scheme such as AES-GCM.

Key material should be protected using platform secure storage:

- Android Keystore
- iOS Keychain

Do not hardcode an encryption key.

## 21.4 Sensitive app data

Evaluate Android backup behavior because financial data should not be unintentionally copied into platform backups unless the user has explicitly chosen that behavior.

---

# 22. Phase 18 — AI Architecture Refactor

## Objective

Make AI useful without making it the source of truth.

## 22.1 Remove client-side secret exposure

Do not ship a production Groq API key through an `EXPO_PUBLIC_*` variable.

The existing implementation reads the Groq key from the client environment.

Target architecture:

```text
App
 ↓
AI Gateway
 ↓
Groq
```

or:

```text
App
 ↓
Local deterministic finance engine
 ↓
Local model / optional cloud model
```

## 22.2 AI tool layer

Create deterministic finance tools:

```text
getAccountBalance()
getMonthlySpend()
getCategorySpend()
getUpcomingPayments()
getPendingTransactions()
findMissingTransactions()
getSafeToSpend()
simulateGoal()
simulateDebtPayoff()
comparePeriods()
```

AI should call these tools rather than receive a manually assembled blob of potentially stale information.

## 22.3 Privacy boundary

Default:

```text
Local financial calculations
```

Optional:

```text
Cloud AI
```

Show a clear privacy indicator before cloud processing.

## 22.4 AI language

Do not label deterministic formulas as AI.

Use:

```text
Spending Forecast
```

for mathematical forecasting.

Use:

```text
AI Insight
```

only when an LLM is actually providing reasoning or natural-language interpretation.

---

# 23. Phase 19 — Accessibility and Micro-UX

## Tasks

- [ ] Audit contrast.
- [ ] Verify text scaling.
- [ ] Add accessible labels to icon-only buttons.
- [ ] Ensure buttons are at least ~44–48dp touch targets.
- [ ] Ensure selected chips are distinguishable without color alone.
- [ ] Respect reduced motion where feasible.
- [ ] Ensure destructive actions have clear labels.
- [ ] Check screen-reader ordering.
- [ ] Ensure masked values remain semantically understandable to accessibility tools.
- [ ] Test with large system font.
- [ ] Test with display scaling.

## Motion rules

Use motion for:

- confirmation
- state changes
- hierarchy
- amount entry
- screen transitions

Do not use motion merely because a component can animate.

---

# 24. Phase 20 — Performance

## Tasks

- [ ] Virtualize large transaction lists.
- [ ] Add indexes for account/date/category/status.
- [ ] Avoid recalculating all analytics on every keystroke.
- [ ] Memoize expensive selectors.
- [ ] Keep amount input isolated from dashboard calculations.
- [ ] Avoid rendering all transaction details before they are visible.
- [ ] Benchmark with 1,000 transactions.
- [ ] Benchmark with 10,000 transactions.
- [ ] Benchmark with 50,000 transactions.

Target:

- typing in amount feels immediate
- list scroll remains 60fps-class on target devices
- local database queries remain sub-second for common views

---

# 25. Phase 21 — Branding and Naming

## 21.1 Current name

Retire:

```text
SpendWise
Spend Wise
spend-wise
```

as the permanent product brand.

The repository currently uses `Spend Wise` in Expo configuration and `spend-wise` as the slug, so branding changes must update the product configuration deliberately rather than only changing visible text.

## 21.2 Recalled candidate

The name the user is remembering is most likely:

```text
Velnora
```

However, the implementation must NOT adopt that name without a new availability check. Current public search results already show multiple products using `Velora/Velnora-like naming, including finance-related products.

Treat `Velnora` as a historical candidate only.

Do not silently rename the application to it.

## 21.3 Naming direction

Preferred characteristics:

- invented/brandable
- not an obvious generic "money tracker"
- easy to pronounce
- short
- works in India and internationally
- no rupee symbol required
- future-proof if investment/debt/AI features expand

Naming work should happen after product architecture is stable enough to understand what the brand is promising.

## 21.4 Logo direction

Do not use:

- generic rupee symbol
- generic bar chart
- piggy bank
- generic wallet icon

Preferred concept:

```text
financial flow + ledger + control
```

One geometric symbol that remains recognizable at:

```text
24x24
48x48
1024x1024
```

Use a simple dark/green/off-white palette.

---

# 26. Phase 22 — App Configuration Hardening

Audit:

- [ ] Expo app name
- [ ] slug
- [ ] package identifier
- [ ] iOS bundle identifier
- [ ] app icon
- [ ] splash screen
- [ ] theme configuration
- [ ] status bar
- [ ] keyboard configuration
- [ ] Android backup behavior
- [ ] notification permissions
- [ ] share intent configuration
- [ ] EAS project metadata

The current iOS bundle identifier must be replaced before production distribution.

Do not change package/bundle identifiers casually after a public release.

---

# 27. Phase 23 — Testing Strategy

## 27.1 Unit tests

Test:

- money parsing
- money formatting
- budget calculations
- net worth
- account balances
- transfer behavior
- refund behavior
- recurring schedules
- safe-to-spend
- coverage score
- reconciliation differences
- duplicate fingerprinting
- merchant normalization
- date grouping
- timezone handling

## 27.2 Database tests

Test migrations using:

```text
empty database
legacy database
partially populated database
large database
invalid backup
```

## 27.3 Component tests

Cover:

- amount input
- account selector
- category selector
- transaction row
- masked amount
- privacy toggle
- confirmation dialogs
- bottom sheet

## 27.4 Device/manual tests

Run on:

```text
small Android phone
large Android phone
iPhone if supported
```

For every form:

```text
keyboard closed
keyboard open
first field
last field
large amount
long text
validation error
save
cancel
```

## 27.5 Critical E2E scenarios

### Scenario 1 — Manual transaction

```text
Open Activity
→ Add
→ Enter amount
→ Keyboard opens
→ Input stays visible
→ Choose category
→ Choose account
→ Save
→ Ledger updates
→ Account balance updates
→ Home updates
```

### Scenario 2 — Share receipt

```text
Open payment receipt
→ Share
→ App opens
→ Receipt data parsed
→ Category selected
→ Account selected
→ Save
→ Transaction created
```

### Scenario 3 — Missing transaction

```text
Payment notification detected
→ Inbox
→ Review
→ Add
→ Coverage increases
```

### Scenario 4 — Privacy

```text
Tap Eye
→ all financial amounts masked
→ navigate through every screen
→ amounts remain masked
→ tap Eye again
→ amounts restored
```

### Scenario 5 — Reconciliation

```text
Account
→ Reconcile
→ enter actual balance
→ difference detected
→ possible causes shown
→ adjustment or transaction fix
→ balance matches
```

---

# 28. Phase 24 — Visual QA Checklist

The implementation agent must compare every screen before/after.

## Home

- [ ] no clipped content
- [ ] correct safe area
- [ ] eye icon aligned
- [ ] no unnecessary card nesting
- [ ] safe-to-spend readable
- [ ] masked values align identically to unmasked values

## Activity

- [ ] search aligned
- [ ] category chips scroll
- [ ] transaction rows don't overflow
- [ ] amounts right-aligned
- [ ] account metadata visible
- [ ] delete not visually dominant

## Forms

- [ ] keyboard never hides input
- [ ] submit button reachable
- [ ] amount animation subtle
- [ ] focus states visible
- [ ] validation does not jump layout

## Settings

- [ ] sections clearly separated
- [ ] no giant wall of settings
- [ ] destructive actions separated
- [ ] security settings clearly grouped

## Goals / Investments

- [ ] long titles don't break layout
- [ ] projected values clearly labeled
- [ ] current values clearly labeled

---

# 29. Phase 25 — Release Hardening

Before release:

- [ ] production build with no secrets in the bundle
- [ ] database migration tested from legacy state
- [ ] backup/restore verified
- [ ] privacy mode verified
- [ ] share receiver verified
- [ ] notification candidate capture verified where implemented
- [ ] app icon installed and readable
- [ ] splash screen correct
- [ ] app name correct
- [ ] package identifiers correct
- [ ] crash logging strategy decided
- [ ] no sensitive financial logs in production
- [ ] no receipt contents written to console
- [ ] no API keys committed
- [ ] no raw backup files included in repository
- [ ] large dataset performance checked

---

# 30. Agent Execution Rules

The IDE agent must follow these rules.

## Rule 1 — One phase at a time

Do not implement multiple phases in one giant change.

## Rule 2 — Preserve working behavior

Every phase must leave the application launchable.

## Rule 3 — Explain migrations

Any database migration must include:

```text
before schema
after schema
migration path
rollback/recovery strategy
```

## Rule 4 — Never silently modify user data

No automatic deletion.

No automatic transaction creation unless the transaction is explicitly represented as a pending/detected event.

## Rule 5 — Test before moving on

For every phase:

```text
implement
→ typecheck
→ lint
→ relevant tests
→ manual verification
→ commit
```

## Rule 6 — Keep commits focused

Preferred commit style:

```text
feat(ui): add keyboard-safe transaction form
feat(privacy): add global amount masking
refactor(db): introduce transaction ledger
feat(accounts): derive balances from ledger
feat(capture): add receipt share intake
feat(reconcile): add account reconciliation
```

## Rule 7 — Do not rewrite everything

Reuse stable components where they are good.

Refactor only when the existing architecture prevents correctness or usability.

## Rule 8 — Do not add dependencies unnecessarily

Prefer existing:

```text
React Native
Expo
Reanimated
SQLite
React Navigation
React Query
```

before introducing another library.

---

# 31. Recommended Implementation Order Summary

```text
PHASE 0
Baseline + backup

↓
PHASE 1
Design system

↓
PHASE 2
Keyboard + input + micro-interactions

↓
PHASE 3
Global privacy / Eye icon

↓
PHASE 4
Ledger + transaction schema

↓
PHASE 5
Account-derived balances

↓
PHASE 6
Fast manual transaction capture

↓
PHASE 7
Android share receipt capture

↓
PHASE 8
Financial Inbox

↓
PHASE 9
Reconciliation + completeness

↓
PHASE 10
Recurring expected payments

↓
PHASE 11
Home redesign

↓
PHASE 12
Activity redesign

↓
PHASE 13
Transaction detail

↓
PHASE 14
Goals / Debt / Investment improvements

↓
PHASE 15
Financial calculation correctness

↓
PHASE 16
Settings redesign

↓
PHASE 17
Backup + security

↓
PHASE 18
AI architecture

↓
PHASE 19
Accessibility

↓
PHASE 20
Performance

↓
PHASE 21
Branding + naming

↓
PHASE 22
App configuration

↓
PHASE 23
Testing

↓
PHASE 24
Visual QA

↓
PHASE 25
Release hardening
```

---

# 32. Definition of Done

The project should not be considered complete merely because all screens look polished.

The finished product must satisfy all of the following:

### Capture

A user can record a payment manually in seconds.

A user can share a receipt directly into the app.

### Classification

The app suggests a category from the user's existing categories and merchant history.

### Accounts

SBI, BOI, UPI Lite and other accounts show calculated balances.

### Transfers

Moving money between accounts does not create fake expenses.

### Completeness

The app can show unresolved or potentially missing transactions.

### Reconciliation

A user can compare app balance with real account balance and resolve differences.

### Privacy

One Eye action hides all money values across the application.

### Security

Production API secrets are not shipped in the client.

### Financial correctness

Net worth uses current values, not future projections or income totals.

### UX

Keyboard never hides the field the user is editing.

### Motion

Amount entry and key state changes have subtle, purposeful animations.

### Reliability

User data survives migrations and can be backed up/restored.

### Performance

Large transaction histories remain responsive.

### Maintainability

New financial features can be implemented against the ledger/account engine without adding custom logic to every screen.

---

# 33. Final Product Direction

The end-state should not feel like:

> "an expense tracker with many features."

It should feel like:

> **a private financial operating system for one person.**

The central model is:

```text
CAPTURE
  ↓
CLASSIFY
  ↓
LEDGER
  ↓
ACCOUNT BALANCES
  ↓
RECONCILIATION
  ↓
INSIGHTS
  ↓
PLANNING
```

And the central user promise is:

> **You should not have to remember what happened to your money. The app should help you capture it, verify it and understand it.**
