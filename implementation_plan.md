# SpendWise Feature Backlog & Implementation Order

This document breaks down the logical sequence to implement the massive feature list requested. We must tackle structural database changes first, as higher-level features (like Net Worth or AI Context) directly depend on them.

## User Review Required

> [!IMPORTANT]
> Please review this proposed order of execution. Since some features require database schema changes (which requires careful migration to avoid data loss), we must execute this in distinct phases. Let me know if you agree with Phase 1 as our immediate next step!

---

## 🏗️ Phase 1: Foundational Data & Schema (Highest Leverage)

Before we can calculate net worth or auto-distribute budgets, the app needs to know your income and have a flexible category system.

1. **Income Tracking (Urgent Gap)**
   - **Why first**: It is the root dependency for accurate investable surplus, savings rate, and budget reconciliation.
   - **Action**: Add `monthlyIncome` to `BudgetState` (persisted in `AsyncStorage`).

2. **Dynamic Category Creation (Item 4)**
   - **Why**: As you noted, this is the highest-leverage fix. Hardcoded strings (`"Food"`, `"Rent"`) block custom budgets and icons.
   - **Action**: Create a `categories` table in SQLite (`id`, `name`, `icon`, `color`, `budget`). Refactor `ExpensesScreen`, `DashboardScreen`, and Settings to CRUD and read from this table instead of the TypeScript enum.

3. **Monthly Budget Auto-distribution (Item 5)**
   - **Why**: Depends entirely on having dynamic categories. 
   - **Action**: Add validation in Settings so `sum(category_budgets) <= monthlyIncome`. Add an "Auto-Split" button to distribute unallocated funds evenly or based on historical spending.

---

## 🏦 Phase 2: Accounts, Goals, & Wealth Tracking

With income and spending tracked properly, we move to wealth aggregation.

4. **Emergency Fund + Savings Accounts (Item 2)**
   - **Why**: Need a place to park liquid cash safely before calculating net worth.
   - **Action**: Create a new `accounts` SQLite table with an `AccountType` enum (`SAVINGS`, `EMERGENCY_FUND`). Add logic to suggest an emergency target of `6 * (monthly spent)`.

5. **Goals Refactor & SIP Linking (Item 3 & Gap)**
   - **Why**: We need to know which goals are "Debt" (Liabilities) to subtract from Net Worth, and we need to keep completed goals for motivation.
   - **Action**: 
     - Move Goal Planner into its own dedicated space.
     - Add `completed` (boolean) and `isDebt` (boolean) to the `goals` SQLite table.
     - Add a "Convert to SIP" button that pre-fills the Investment Planner form.

6. **Net Worth Calculation (Item 1)**
   - **Why**: Depends on Phase 2.4 (Savings/Emergency = Assets) and Phase 2.5 (Debt Goals = Liabilities).
   - **Action**: Build a top-level Net Worth card in the Investments tab: `(Investments FV + Savings + Emergency) - (Sum of Active Debt Goals)`.

---

## 🤖 Phase 3: Automation, AI, & Polish

Finally, we inject quality-of-life automations and supercharge the AI.

7. **Recurring / Fixed Expenses (Gap)**
   - **Action**: Add an `isRecurring` flag to expenses. Add a startup check that auto-logs recurring expenses if their billing date has passed in the current month.

8. **AI Context & Smart Suggestions (Item 7 & Gap)**
   - **Action**: Now that all data exists, inject Income, Net Worth, Active Goals, and Investment Allocations into the Groq API context prompt. The AI will transition from an "expense tracker" to a "holistic wealth manager."

9. **No Spend Streak UI (Item 6)**
   - **Action**: Build a GitHub-style contribution graph (mini-calendar) on the Home screen to visualize no-spend days.

10. **Data Export / Backup (Gap)**
    - **Action**: Add a utility in Settings to dump the SQLite database and AsyncStorage into a downloadable JSON file.
