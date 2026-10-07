# Finance App — Master Scope of Improvements

> Master product and engineering scope for the next major refinement of the finance application.
>
> This document consolidates the current UI/video review, previously agreed product requirements, financial-model improvements, UX refinements, security requirements, and future intelligence features.
>
> The Eye/Privacy Mode is considered **working correctly** and is therefore not treated as an unresolved UI issue. It remains in the regression-testing scope.

---

# 1. Product Vision

The application should evolve from a polished expense tracker into a:

> **Private Personal Financial Command Center**

The application should answer five fundamental questions:

1. **How much money do I have right now?**
2. **Where is that money?**
3. **What is my actual net worth?**
4. **What money is committed or expected to leave?**
5. **Did I forget to record anything?**

The product should not merely display financial information. It should maintain a coherent financial model.

The central system should become:

```text
CAPTURE
   ↓
CLASSIFY
   ↓
LEDGER
   ↓
ACCOUNTS
   ↓
RECONCILIATION
   ↓
FINANCIAL STATE
   ↓
PLANNING
   ↓
FORECASTING
   ↓
INSIGHTS / AI
```

---

# 2. Most Important Product Change: One Financial Overview

## 2.1 Create a single Net Worth / Financial Overview destination

There should be one place in the application where the user can see the complete financial position at once.

Recommended name:

**Net Worth**

or, preferably:

**Financial Overview**

The page can have a primary headline:

```text
NET WORTH

₹••••••
```

and immediately underneath:

```text
Assets          ₹••••••
Liabilities     ₹••••••
Net Worth       ₹••••••
```

The purpose is to remove the need to open:

- Investments
- Provident Fund
- Accounts
- Debt
- Goals
- other financial sections

just to understand the user's overall financial position.

---

# 3. Financial Overview — Exact Structure

Recommended page hierarchy:

```text
Financial Overview

Net Worth
₹••••••

↑ +₹•••• this month

────────────────────────

ASSETS

Cash & Bank
₹••••••

Investments
₹••••••

Provident Fund
₹••••••

Other Assets
₹••••••

Total Assets
₹••••••

────────────────────────

LIABILITIES

Loans / Debt
₹••••••

Credit / Other Liabilities
₹••••••

Total Liabilities
₹••••••

────────────────────────

NET WORTH

₹••••••

────────────────────────

FINANCIAL POSITION

Liquid Cash
₹••••••

Invested
₹••••••

Retirement
₹••••••

Debt
₹••••••

────────────────────────

THIS MONTH

Income
₹••••••

Expenses
₹••••••

Investments
₹••••••

Debt Paid
₹••••••

────────────────────────

UPCOMING

₹•••••• committed

────────────────────────

[ View Details ]
```

The actual amount presentation must remain compatible with the existing global Eye/Privacy Mode.

---

# 4. Net Worth Calculation

The calculation must be mathematically correct.

## Assets

Assets can include:

```text
Bank accounts
UPI Lite
Cash
Current investment value
Provident Fund
Other user-defined assets
```

## Liabilities

Liabilities can include:

```text
Personal debt
Loans
Credit card outstanding
Other liabilities
```

## Net Worth

```text
Total Assets - Total Liabilities
```

Do not include:

- future salary
- future SIP value
- projected investment value
- monthly budget
- future expected income

in current net worth.

---

# 5. Current Value vs Future Value

The application must clearly separate:

### Current financial state

```text
Current Net Worth
Current Assets
Current Investments
Current PF
Current Debt
Current Cash
```

from:

### Future projection

```text
Projected Investment Value
Projected Net Worth
Projected Goal Value
Projected Debt-Free Date
```

A projection must never silently appear as current wealth.

---

# 6. Net Worth Breakdown

The user should be able to tap each component.

Example:

```text
Net Worth
₹••••••

Assets
├── Cash & Banks
│   ├── SBI
│   ├── BOI
│   ├── UPI Lite
│   └── Cash
│
├── Investments
│   ├── Mutual Funds
│   ├── ETFs
│   ├── Gold
│   └── Other Investments
│
├── Provident Fund
│
└── Other Assets

Liabilities
├── Debt 1
├── Debt 2
├── Credit
└── Other Liabilities
```

The user can drill into a component, but does not need to leave the overview just to understand the total.

---

# 7. Net Worth Trend

Add a historical chart:

```text
Net Worth

₹
│
│              ╭────
│          ╭───╯
│      ╭───╯
│  ╭───╯
└────────────────────
 Jan Feb Mar Apr May
```

Provide ranges:

- 1M
- 3M
- 6M
- 1Y
- All

The historical calculation should use actual financial state at each point in time.

Do not use today's investment value retroactively.

---

# 8. Net Worth Change Explanation

When net worth changes:

```text
Net Worth
+₹8,420 this month
```

tap to see:

```text
Why did net worth change?

Salary / income       +₹35,000
Expenses               -₹18,420
Investments             +₹5,000
Debt payment            -₹8,000
Investment growth       +₹1,840

Net change              +₹15,420
```

The exact categories should be derived from the underlying ledger.

This is more useful than a chart alone.

---

# 9. Financial Overview Should Become the Product's Source of Truth

The rest of the application should derive from the financial model.

```text
Transactions
     ↓
Accounts
     ↓
Assets / Liabilities
     ↓
Net Worth
     ↓
Financial Overview
```

Goals, budgets, reports and AI should consume the same source.

There must not be separate screen-specific calculations that disagree with each other.

---

# 10. Account Management

Accounts must become first-class financial entities.

Initial accounts:

```text
SBI
Bank of India
UPI Lite
```

Future:

```text
Cash
Other bank
Wallet
Credit card
Investment account
```

Each account should have:

```text
Name
Type
Institution
Opening Balance
Current Balance
Currency
Created Date
Last Reconciled
Status
```

---

# 11. Account Balance Model

Account balance should be derived.

Conceptually:

```text
Opening Balance
+ Income
+ Transfers In
+ Refunds
+ Adjustments
- Expenses
- Transfers Out
- Investment Contributions
= Current Balance
```

Do not treat a manually entered current balance as the primary source of truth.

Manual values should only represent:

- opening balance
- reconciliation adjustment

---

# 12. Account Overview Screen

Recommended layout:

```text
Accounts

TOTAL LIQUID MONEY
₹••••••

SBI
₹••••••
Bank Account

Bank of India
₹••••••
Bank Account

UPI Lite
₹••••••
UPI Wallet

Cash
₹••••••
```

Each account can show:

```text
Current Balance
Money In
Money Out
Transfers
Last Transaction
Last Reconciled
```

---

# 13. Account Detail Screen

For SBI:

```text
SBI

₹••••••
Current Balance

Money In
₹••••••

Money Out
₹••••••

Transfers
₹••••••

────────────────

Recent Activity

...

────────────────

Last Reconciled
5 Oct 2026

[ Reconcile Account ]
```

---

# 14. Transaction Model

The current expense-centric concept should evolve into a proper transaction ledger.

Supported transaction types:

```text
EXPENSE
INCOME
TRANSFER
REFUND
ADJUSTMENT
INVESTMENT_CONTRIBUTION
INVESTMENT_WITHDRAWAL
```

Every transaction should support:

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
externalReference
receiptUri
fingerprint
status
confidence
note
relatedTransactionId
isDeleted
```

Money should use integer minor units such as paise, not floating-point values.

---

# 15. Transaction Semantics

## Expense

```text
SBI → Merchant
```

reduces account balance.

## Income

```text
Employer → SBI
```

increases account balance.

## Transfer

```text
SBI → UPI Lite
```

changes where money is stored but does not count as spending.

## Refund

```text
Merchant → SBI
```

returns money and can be linked to the original expense.

## Investment contribution

```text
SBI → Investment
```

reduces liquid cash but should not be counted as consumption expense.

---

# 16. Transaction Categories

Categories should remain stable.

Recommended baseline:

```text
Food
Transport
Housing
Bills
Shopping
Health
Education
Entertainment
Travel
Family
Personal
Other
```

Do not create categories such as:

```text
Rakhi Expense
Personal Living Expense
```

when they represent occasions or contexts.

Instead:

```text
Category: Family
Occasion: Rakhi
Note: Gift for sister
```

---

# 17. Transaction Detail

Every transaction should have a detail screen.

```text
₹••••••

Zomato

Food

UPI Lite

5 Oct 2026
8:42 PM

Expense

Reference
XXXXXXXX

Source
Shared Receipt

Receipt
[ View Receipt ]

Note
Dinner

[ Edit ]
[ Duplicate ]
[ Delete ]
```

---

# 18. Activity Screen

Rename the current Expenses tab to:

**Activity**

or:

**Transactions**

Preferred:

**Activity**

because it can contain:

- expenses
- income
- transfers
- refunds
- pending detections

---

# 19. Activity Layout

```text
Activity

[ Search transactions ]

[ All ] [ Expenses ] [ Income ] [ Transfers ]

Needs Review
2 transactions

Today

₹340
Swiggy
Food · UPI Lite

₹180
Uber
Transport · SBI

Yesterday

...
```

---

# 20. Transaction Search

Search across:

```text
Merchant
Description
Category
Account
Notes
Reference
```

Do not restrict the placeholder to:

```text
Search expenses...
```

Use:

```text
Search transactions...
```

---

# 21. Transaction Filtering

Filters should eventually include:

```text
Type
Account
Category
Date
Amount
Source
Status
Merchant
```

Example:

```text
Filter Transactions

Account
[ SBI ]

Type
[ Expense ]

Category
[ Food ]

Date
[ This Month ]

Source
[ Shared Receipt ]

[ Clear ] [ Apply ]
```

---

# 22. Transaction Capture — Manual

Manual entry should be optimized for speed.

Flow:

```text
+
↓
Amount
↓
Merchant
↓
Category
↓
Account
↓
Save
```

Optional fields:

```text
Date
Time
Note
Receipt
```

The user should not have to fill every field.

---

# 23. Amount Input UX

Amount should be the visual focus.

Requirements:

- Numeric keyboard
- Large amount typography
- Indian number formatting
- Proper decimal handling
- Validation
- Cursor-safe formatting
- Subtle amount-change animation

Example:

```text
₹0
₹5
₹50
₹500
₹5,000
```

Animation should be:

- 100–180ms
- subtle
- non-blocking
- reduced-motion aware

---

# 24. Keyboard UX

Every form must be keyboard-safe.

When keyboard opens:

```text
Focused input remains visible
↓
Form scrolls automatically
↓
Save remains reachable
↓
Bottom navigation does not overlap
```

Apply to:

- transaction
- goal
- investment
- debt
- recurring payment
- account
- category
- AI input
- settings forms

Do not solve with hardcoded bottom margins.

Use a reusable keyboard-aware form architecture.

---

# 25. Receipt Share-to-App

This is a core feature.

Flow:

```text
Payment
↓
Receipt
↓
Share
↓
Finance App
↓
Parse
↓
Review
↓
Category
↓
Account
↓
Save
```

---

# 26. Receipt Parsing

Extract where possible:

```text
Amount
Merchant
Date
Time
Payment Method
Reference Number
Transaction ID
```

Support:

```text
text/plain
image/*
application/pdf
```

Start with deterministic parsers for common Indian payment formats.

---

# 27. Receipt Review Screen

The screen should be extremely simple.

```text
New Transaction

₹340

Swiggy

Food ✓

UPI Lite ✓

5 Oct · 8:42 PM

Source
Shared Receipt

[ Save Transaction ]
```

Only uncertain values should require user intervention.

---

# 28. Capture Confidence

Every automatically detected transaction should have a confidence value.

Example:

```text
High confidence
96%
```

or:

```text
Needs review
62%
```

Low-confidence items should not silently enter the ledger.

---

# 29. Financial Inbox

Home should show:

```text
Needs Review
2 transactions
```

Dedicated page:

```text
Financial Inbox

2 pending transactions

₹420
Amazon
SBI

₹180
Uber
UPI Lite
```

Actions:

```text
Add
Edit
Ignore
Duplicate
```

---

# 30. Missing Transaction Detection

Potential inputs:

```text
Shared receipts
Payment notifications
Imported statements
Account reconciliation
Transaction patterns
```

The system should identify possible unrecorded payments.

The user should never have to manually remember every transaction.

---

# 31. Merchant Memory

Maintain local merchant/category associations.

Example:

```text
Swiggy → Food
Amazon → Shopping
Uber → Transport
Netflix → Entertainment
```

Also optionally:

```text
Swiggy → usually UPI Lite
Amazon → usually SBI
```

Use these to pre-fill suggestions.

The user can override them.

---

# 32. Duplicate Detection

Before creating a transaction, compare:

```text
Amount
Merchant
Date/time
Account
Reference
Fingerprint
```

Show:

```text
Possible duplicate

₹487
Zomato
5 Oct
UPI Lite

[ Keep Both ]
[ Use Existing ]
[ Edit ]
```

---

# 33. Financial Reconciliation

Every account should have:

```text
Reconcile
```

Example:

```text
SBI

Ledger Balance
₹38,240

Actual Bank Balance
₹37,740

Difference
-₹500
```

Then identify possible reasons.

---

# 34. Reconciliation Causes

Potential causes:

```text
Missing transaction
Duplicate transaction
Incorrect amount
Wrong account
Missing transfer
Bank charge
Cash withdrawal
Balance adjustment
```

---

# 35. Transaction Coverage

Introduce:

```text
Transaction Coverage
94%
```

Example:

```text
29 recorded
31 detected
2 unresolved
```

This is a key product metric.

---

# 36. Balance Drift Detector

For every account:

```text
Expected Balance
Actual Balance
Difference
```

If difference exists:

```text
SBI balance differs by ₹500.

[Investigate]
```

---

# 37. Recurring Payments

Recurring payments should be represented as expected financial events.

Example:

```text
Rent
₹10,265
Monthly
Due: 5th
Account: SBI
```

States:

```text
Upcoming
Due
Paid
Skipped
Overdue
```

Do not automatically create completed expenses.

---

# 38. Upcoming Payments

Home:

```text
Upcoming

Rent        ₹10,265
SIP          ₹3,000
Insurance    ₹1,500
```

This section feeds Safe-to-Spend.

---

# 39. Safe-to-Spend

Safe-to-Spend should be based on actual account balances.

Conceptually:

```text
Liquid Cash
- Upcoming Obligations
- Planned Investments
- Debt Payments
- Goal Allocations
- Safety Buffer
=
Safe to Spend
```

The user should be able to tap the number and see the complete calculation.

---

# 40. Home Dashboard

Recommended order:

```text
Header + Eye

Safe to Spend

Accounts

Needs Review

Upcoming

This Month

Budget Health

Secondary Insights
```

Do not let AI dominate the home screen.

---

# 41. Home — Account Summary

Show:

```text
SBI       ₹••••
BOI       ₹••••
UPI Lite  ₹••••

Total Liquid Cash
₹••••
```

This should be directly connected to the account engine.

---

# 42. Home — Needs Review

This should be highly visible when non-zero.

```text
Needs Review

2 transactions

₹420 Amazon
₹180 Cafe

[Review]
```

When zero:

```text
Everything is reconciled
```

or keep the section collapsed.

---

# 43. Reports

Reports should distinguish:

```text
Income
Expenses
Investments
Transfers
Debt Payments
```

Do not classify investment contributions as ordinary spending.

---

# 44. Report Metrics

Useful reports:

```text
Total Income
Total Expenses
Investment Contributions
Debt Payments
Net Cash Flow
Savings Rate
Category Spending
Account Outflow
Month-over-Month
Net Worth Change
```

---

# 45. Reports Should Explain Changes

Instead of only showing:

```text
August
₹22,000
```

show:

```text
Spending increased 18%.

Main changes:

Food       +₹1,200
Shopping   +₹900
Travel     +₹600
```

---

# 46. No False Precision

If comparison data does not exist:

Do not show:

```text
0.0%
```

Instead:

```text
Not enough historical data
```

Financial UI must not imply certainty that the data does not support.

---

# 47. Financial Health

Create a high-level financial health view.

Possible metrics:

```text
Safe to Spend
Savings Rate
Cash Coverage
Upcoming Commitments
Debt
Investment Allocation
Transaction Coverage
Goal Progress
```

Example:

```text
Financial Health

Safe to Spend
₹••••

Cash Coverage
23 days

Savings Rate
31%

Upcoming Commitments
₹••••

Transactions to Review
2
```

---

# 48. "Why?" Explanations

Every important number should be explainable.

Tap:

```text
Safe to Spend
```

→

```text
How is this calculated?
```

Tap:

```text
SBI Balance
```

→

```text
Why did my balance change?
```

Tap:

```text
Monthly Spending
```

→

```text
What caused the increase?
```

This can be deterministic and does not require AI.

---

# 49. Financial Timeline

Create a unified timeline showing:

```text
Past
Present
Upcoming
Pending
```

Example:

```text
TODAY

₹340 Swiggy
₹180 Uber

YESTERDAY

₹1,500 Rent

UPCOMING

₹3,000 SIP
₹10,265 Rent

PENDING

₹420 Amazon
```

This can eventually become a central Activity experience.

---

# 50. Goals

Goals should be connected to actual allocations.

Track:

```text
Target
Current Allocated
Account
Monthly Contribution
Expected Completion
Contribution History
```

Do not manually maintain "saved" amounts without linking them to financial events.

---

# 51. Goal Detail

Example:

```text
Laptop

₹34,000 / ₹80,000

42.5%

Monthly Contribution
₹8,000

Account
SBI

Expected Completion
March 2027
```

---

# 52. Debt

Debt should track:

```text
Principal
Outstanding
Interest Rate
Minimum Payment
Due Date
Payment Frequency
Next Payment
Payment History
Estimated Payoff
```

Top-level summary:

```text
Total Debt
₹••••

Next Payment
₹••••

Estimated Debt-Free Date
••••
```

---

# 53. Provident Fund

PF should be treated as an asset in Financial Overview.

The PF section can contain:

```text
Current Balance
Employee Contribution
Employer Contribution
Interest
Monthly Contribution
Yearly Contribution
Contribution History
```

PF should feed:

```text
Net Worth
Retirement Assets
Long-Term Wealth
```

It should not be buried as an unrelated utility.

---

# 54. Investments

Separate:

## Current Portfolio

```text
Current Value
Invested Amount
Gain/Loss
Returns
Holdings
```

from:

## Investment Planner

```text
Monthly SIP
Step-Up
Expected Return
Duration
Projected Value
```

Only current value enters Net Worth.

---

# 55. Investment Form UX

Do not use misleading pre-filled values.

Use:

```text
Amount/month
[ Enter amount ]

Tenure
[ Enter months ]

Expected return
[ Enter % ]

SIP date
[ Select ]
```

Examples should be placeholders, not actual values.

---

# 56. Investment Assumptions

Every projection must display:

```text
Based on:

Monthly contribution: ₹5,000
Expected return: 12%
Duration: 36 months
```

and:

```text
Projection only. Actual returns may vary.
```

---

# 57. Planning Architecture

Instead of a page that only links to:

```text
Debt
PF
Recurring
```

make Planning a dashboard.

```text
Financial Planning

Goals
2 active

Debt
₹•••• outstanding

Recurring
3 upcoming

Retirement
PF ₹••••

Investments
₹••••
```

---

# 58. Settings Architecture

Organize settings into:

```text
Money
  Accounts
  Categories
  Budget

Planning
  Goals
  Debt
  Recurring Payments
  Investments

Security
  Privacy
  Biometrics
  App Lock
  Background Privacy

Data
  Backup
  Restore
  Export
  Import

Notifications
  Payment Alerts
  Upcoming Payments

AI & Privacy
  Local AI
  Cloud AI
  Data Processing

Appearance
  Theme
  Compact Mode
```

---

# 59. Global Privacy Mode

The Eye feature is currently working.

Keep it as a regression requirement.

It must mask:

```text
Account balances
Transactions
Net Worth
Investments
PF
Debt
Goals
Budgets
Reports
Forecasts
AI monetary values
```

The masking must preserve layout dimensions.

Test all screens after every major UI change.

---

# 60. Security

Required direction:

- local-first storage
- no API secrets in client
- encrypted backup
- secure key storage
- no sensitive production logs
- controlled cloud AI
- explicit cloud-processing consent
- optional biometric lock
- background privacy

---

# 61. AI Architecture

AI should not be responsible for calculating financial truth.

Use:

```text
UI
 ↓
AI Tool Layer
 ↓
Deterministic Finance Engine
```

Tools:

```text
getAccountBalance()
getMonthlySpend()
getCategorySpend()
getUpcomingPayments()
getPendingTransactions()
findMissingTransactions()
getSafeToSpend()
calculateNetWorth()
simulateGoal()
simulateDebtPayoff()
comparePeriods()
```

AI explains results.

The finance engine calculates them.

---

# 62. AI Naming

Avoid:

```text
AI Wealth Manager
```

unless the product actually provides wealth-management functionality.

Preferred:

```text
AI Finance Assistant
```

or:

```text
Financial Advisor
```

AI forecast should be renamed if it is deterministic.

Preferred:

```text
Spending Forecast
```

---

# 63. AI Privacy

The user should know:

```text
Local analysis
```

versus:

```text
Cloud AI analysis
```

The default should minimize data leaving the device.

Do not send raw transaction history when an aggregate is sufficient.

Do not upload receipts by default.

---

# 64. UI Design System

The app should use a consistent design language.

Centralize:

```text
Colors
Typography
Spacing
Radii
Borders
Shadows
Button sizes
Input sizes
Icon sizes
```

Avoid screen-specific hardcoded values wherever possible.

---

# 65. Visual Direction

Current dark UI can be retained.

Refine toward:

```text
Near-black background
Dark charcoal surfaces
Subtle borders
Muted emerald primary
Neutral secondary colors
High readability
```

Avoid excessive neon green.

Avoid assigning extremely saturated colors to every category.

---

# 66. Cards

Reduce card quantity.

Use cards only when they establish meaningful hierarchy.

Avoid:

```text
card inside card inside card
```

Prefer:

```text
Section
Title
Content
```

with separators where possible.

---

# 67. Headers

Create a reusable header system.

The Eye icon must never overlap:

- logo
- add button
- report icon
- back button
- title

Header actions should occupy explicit layout space.

Avoid absolute positioning for primary actions.

---

# 68. Floating Action Buttons

FAB should mean:

> Create the primary object on this screen.

Examples:

```text
Activity → Add Transaction
Goals → Add Goal
Debt → Add Debt
Investments → Add Investment
```

Do not show generic plus buttons on read-only screens.

---

# 69. Horizontal Chips

Fix clipping at the edges.

Requirements:

- horizontal scrolling
- proper content padding
- selected chip centering
- optional edge fade
- no clipped first/last chip
- accessible touch target

Use this consistently for:

```text
Categories
Transaction types
Investment types
Time filters
```

---

# 70. Empty States

Every empty screen needs:

```text
What is empty?
Why does it matter?
What can the user do?
```

Example:

```text
No goals yet

Create a goal to start planning
your future expenses.

[ Create Goal ]
```

Avoid large blank areas.

---

# 71. Loading States

Use stable loading states.

Avoid replacing an entire screen with a spinner for small local operations.

Prefer:

```text
Button loading
Skeleton list
Inline loading
```

---

# 72. Touch Feedback

Every important interaction should have:

- pressed state
- selected state
- disabled state
- loading state
- success state
- error state

Touch targets should generally be at least 44–48dp.

---

# 73. Animation System

Motion should communicate:

```text
Change
Confirmation
Hierarchy
Transition
```

Use subtle animations for:

- amount changes
- save confirmation
- selected category
- privacy toggle
- cards entering
- tab transitions
- modal presentation

Avoid continuous decorative animations.

Respect reduced-motion preferences.

---

# 74. Accessibility

Test:

- screen reader
- large font
- display scaling
- contrast
- icon labels
- touch targets
- non-color selection indicators
- reduced motion

Masked financial values must remain understandable to accessibility technologies without exposing the real value.

---

# 75. Performance

Prepare for:

```text
1,000 transactions
10,000 transactions
50,000 transactions
```

Use:

- virtualized lists
- SQLite indexes
- efficient queries
- memoized selectors
- pagination/incremental loading
- localized recalculation

Amount typing must remain instant even with a large database.

---

# 76. Database Architecture

Use explicit migrations.

Example:

```text
001_initial
002_accounts
003_categories
004_transactions
005_transaction_sources
006_reconciliation
007_recurring
...
```

Do not rely on many independent `ALTER TABLE` operations wrapped in catches as the permanent migration strategy.

---

# 77. Database Indexes

Index common queries:

```text
account_id
category_id
occurred_at
status
source
external_reference
merchant_normalized
fingerprint
```

---

# 78. Money Representation

Do not use floating-point values for financial truth.

Use:

```text
amountMinor = 48735
```

for:

```text
₹487.35
```

All calculations should use integer arithmetic where possible.

---

# 79. Date and Time

Store timestamps consistently.

Render using the user's local timezone.

Do not derive financial days/months using naive UTC string slicing.

Test:

```text
23:30
00:00
month-end
year-end
DST environments if applicable
```

---

# 80. Backup & Restore

Backup should be versioned.

Include:

```text
schemaVersion
appVersion
createdAt
transactions
accounts
categories
budgets
goals
debts
investments
PF
recurring payments
merchant mappings
preferences
```

Restore must:

1. validate
2. preview
3. confirm
4. execute transactionally
5. verify

---

# 81. Encrypted Backup

Future secure backup:

```text
AES-GCM
+
Android Keystore
+
iOS Keychain
```

Never hardcode encryption keys.

---

# 82. Data Import

Support eventually:

```text
CSV
XLSX
Bank Statements
```

Flow:

```text
Upload
↓
Parse
↓
Preview
↓
Duplicate Detection
↓
Review
↓
Import
```

Never silently commit an imported statement.

---

# 83. Financial Time Machine

Future advanced feature.

Allow:

```text
What did my financial state look like on 1 July?
```

Potentially reconstruct:

```text
Accounts
Investments
PF
Debt
Goals
Net Worth
```

This requires historical financial state, so the architecture should preserve timestamps and transaction history correctly.

---

# 84. Spend Autopsy

For abnormal spending:

```text
Spending increased 23%
```

show:

```text
Shopping       +₹4,200
Travel         +₹2,100
Dining         +₹1,500
```

Then allow:

```text
Why?
```

and:

```text
How can I reduce this?
```

---

# 85. Balance Explanation

For any account:

```text
Why did my SBI balance fall?
```

Answer deterministically:

```text
UPI Lite transfer
Rent
Food
Shopping
Other
```

The user should be able to drill into the underlying transactions.

---

# 86. Financial Timeline

Combine:

```text
Past
Present
Pending
Upcoming
```

into one chronological view.

This can become a high-value Activity feature.

---

# 87. Branding

Retire:

```text
SpendWise
```

as the permanent brand.

Historical candidate remembered from prior discussions:

```text
Velnora
```

Treat this as a candidate, not an approved final name.

Before adoption, check:

- Google Play
- App Store
- trademark databases
- domains
- GitHub
- social handles
- existing fintech usage

---

# 88. Logo

Avoid:

```text
₹ symbol
Piggy bank
Generic wallet
Generic bar graph
```

Preferred concept:

```text
Financial flow
+
Ledger
+
Control
```

The symbol must work at:

```text
24×24
48×48
1024×1024
```

and in monochrome.

---

# 89. Navigation Direction

Current navigation can be improved toward:

```text
Home
Activity
Accounts
Plans
More
```

Possible structure:

```text
Home
├── Safe to Spend
├── Financial Overview
├── Accounts
├── Needs Review
└── Upcoming

Activity
├── Transactions
├── Financial Inbox
└── Reconciliation

Accounts
├── SBI
├── BOI
├── UPI Lite
└── Other

Plans
├── Budget
├── Goals
├── Debt
├── Recurring
├── Investments
└── Retirement / PF

More
├── Reports
├── AI
├── Backup
├── Security
└── Settings
```

The exact navigation can be finalized after the ledger architecture is implemented.

---

# 90. Product Information Architecture

The application should conceptually have five layers:

## Layer 1 — Money

```text
Accounts
Transactions
Net Worth
```

## Layer 2 — Obligations

```text
Recurring Payments
Debt
Upcoming
```

## Layer 3 — Planning

```text
Budget
Goals
Investments
PF
```

## Layer 4 — Intelligence

```text
Reports
Forecasts
Financial Health
AI
```

## Layer 5 — Infrastructure

```text
Backup
Security
Privacy
Settings
```

This is the cleanest conceptual structure for the mature product.

---

# 91. UX Principle: Actual vs Expected vs Projected

Every financial value should clearly belong to one of these states:

```text
ACTUAL
EXPECTED
PENDING
PROJECTED
```

Examples:

```text
SBI Balance
ACTUAL

Rent tomorrow
EXPECTED

Receipt waiting for confirmation
PENDING

SIP value in 5 years
PROJECTED
```

This prevents financial confusion.

---

# 92. UX Principle: Explainability

Every important financial number should have a path to its source.

```text
Net Worth
↓
Assets / Liabilities

Safe to Spend
↓
Cash / Obligations / Buffer

Account Balance
↓
Transactions

Monthly Spending
↓
Categories / Transactions
```

This should be implemented before adding more AI.

---

# 93. UX Principle: Low-Friction Capture

The application should support three levels:

## Fastest

```text
Share Receipt
→ Save
```

## Normal

```text
+
→ Amount
→ Category
→ Account
→ Save
```

## Detailed

```text
+
→ Full transaction details
```

Most users should not need the third mode for normal spending.

---

# 94. UX Principle: User Remains in Control

Automation may:

- detect
- suggest
- classify
- flag
- forecast

but should not silently:

- fabricate completed transactions
- delete transactions
- modify balances
- change categories without a reviewable history
- send sensitive data externally

---

# 95. Release Priorities

## P0 — Financial correctness

Implement first:

```text
Transaction ledger
Account relationships
Transfers
Correct net worth
Correct investment classification
Money precision
Date handling
```

## P0 — Core capture

Then:

```text
Share receipt
Financial Inbox
Merchant memory
Duplicate detection
```

## P0 — Account trust

Then:

```text
Derived balances
Reconciliation
Balance drift
Coverage score
```

## P1 — Financial Overview

Then:

```text
Net Worth
Assets
Liabilities
Investments
PF
Debt
Cash
Net Worth history
```

## P1 — UX refinement

Then:

```text
Keyboard
Forms
Activity
Headers
Filters
Empty states
Motion
Touch feedback
Responsive layout
```

## P1 — Planning

Then:

```text
Safe to Spend
Recurring
Goals
Debt
Investments
```

## P2 — Intelligence

Then:

```text
Financial Health
Spend Autopsy
Why explanations
Financial Timeline
AI tools
```

## P2 — Advanced infrastructure

Finally:

```text
Statement import
Encrypted backups
Financial Time Machine
Advanced analytics
```

---

# 96. Definition of a Mature Version

The application should eventually allow the user to open it and immediately see:

```text
┌─────────────────────────────────┐
│          NET WORTH              │
│          ₹••••••                │
│          +₹••••                 │
├─────────────────────────────────┤
│ ASSETS                          │
│                                 │
│ SBI                 ₹••••       │
│ BOI                 ₹••••       │
│ UPI Lite            ₹••••       │
│ Investments         ₹••••       │
│ Provident Fund      ₹••••       │
│                                 │
│ Total Assets        ₹••••       │
├─────────────────────────────────┤
│ LIABILITIES                     │
│                                 │
│ Debt                ₹••••       │
│ Other               ₹••••       │
│                                 │
│ Total Liabilities   ₹••••       │
├─────────────────────────────────┤
│ NET WORTH           ₹••••       │
├─────────────────────────────────┤
│ SAFE TO SPEND       ₹••••       │
├─────────────────────────────────┤
│ NEEDS REVIEW                    │
│ 2 transactions                  │
├─────────────────────────────────┤
│ UPCOMING                       │
│ Rent                ₹••••      │
│ SIP                 ₹••••      │
├─────────────────────────────────┤
│ THIS MONTH                     │
│ Income              ₹••••      │
│ Expenses            ₹••••      │
│ Investments         ₹••••      │
│ Debt Paid           ₹••••      │
└─────────────────────────────────┘
```

The user should not need to open five different screens to understand this.

---

# 97. Master Success Criteria

The mature product succeeds when:

### Money

The user can see all money in one place.

### Accounts

SBI, BOI and UPI Lite have trustworthy balances.

### Transactions

Every transaction belongs to an account and has a clear source.

### Capture

A payment can be recorded in seconds.

### Missing transactions

The application can identify possible omissions.

### Reconciliation

The user can prove that the ledger matches reality.

### Net Worth

Cash + investments + PF + other assets - debt = one understandable number.

### Planning

The user can see what is safe to spend after future obligations.

### Privacy

One Eye action hides every sensitive monetary value.

### AI

AI explains and assists; it does not invent financial truth.

### UX

Keyboard, forms, scrolling, touch targets and animations all feel intentional.

### Security

Financial data remains private by default.

### Architecture

Every major feature uses the same financial source of truth.

---

# 98. Final Product Philosophy

The app should not become a collection of:

```text
Expense Tracker
+
Budget App
+
Investment Calculator
+
Debt Tracker
+
AI Chat
+
PF Calculator
```

It should become one coherent system:

```text
                  PERSONAL FINANCE
                         │
             ┌───────────┴───────────┐
             │                       │
          MONEY                   PLANNING
             │                       │
      ┌──────┼──────┐        ┌───────┼───────┐
      │      │      │        │       │       │
   Accounts Transactions   Budget   Goals   Debt
      │      │              │       │       │
      └──────┼──────────────┴───────┴───────┘
             │
          NET WORTH
             │
       FINANCIAL STATE
             │
      ┌──────┼──────┐
      │      │      │
   Reports Forecasts AI
```

The central idea is:

> **Transactions create financial state. Financial state creates the user's Net Worth and Safe-to-Spend picture. Planning acts on that state. AI explains and optimizes it.**

That is the architecture and product direction to preserve for every future feature.
