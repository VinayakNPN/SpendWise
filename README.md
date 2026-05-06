# 💰 SpendWise: Your AI-Powered Financial Companion

SpendWise is a sophisticated, local-first personal finance management application built with **React Native** and **Expo**. It combines traditional expense tracking with cutting-edge AI insights to help users master their money.

---

## ✨ Key Features

- 📊 **Smart Dashboard**: A high-level overview of your net worth, monthly spending, and budget health at a glance.
- 💸 **Expense Tracking**: Seamlessly record income and expenses with categorized entries and persistent SQLite storage.
- 🎯 **Goal Planner**: Define your financial milestones—whether it's a new home, a car, or an emergency fund—and track your progress in real-time.
- 📈 **Investment Portfolio**: Manage your assets (Stocks, Crypto, Mutual Funds) and calculate potential returns with built-in investment calculators.
- 🤖 **AI Financial Coach**: Get personalized, actionable financial advice powered by **Groq AI (Llama 3.3)**. Ask questions about your spending habits or get tips on saving.
- 🔔 **Smart Notifications**: Never miss a bill or overspend with integrated local notifications.
- 🔒 **Privacy First**: All your sensitive financial data is stored locally on your device using SQLite.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local Storage)
- **AI Engine**: [Groq Cloud API](https://groq.com/) (Llama 3.3 70b Versatile)
- **State Management**: React Context API + Custom Store
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your mobile device (or Android Studio/Xcode for emulators)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VinayakNPN/SpendWise.git
   cd SpendWise
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your Groq API key:
   ```env
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the application**:
   ```bash
   npx expo start
   ```
   Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS) to open the app.

---

## 📂 Project Structure

```text
SpendWise/
├── src/
│   ├── components/    # Reusable UI components (FadeInView, GoalPlanner, etc.)
│   ├── screens/       # Main application screens (Dashboard, Expenses, AI Insights, etc.)
│   ├── services/      # Business logic (SQLite database, AI integration, Notifications)
│   ├── state/         # App state management and types
│   └── utils/         # Helper functions for finance and investment calculations
├── App.tsx            # Main application entry point & navigation
├── app.json           # Expo configuration
└── package.json       # Project dependencies and scripts
```

---

## 📱 Screenshots

| Dashboard | AI Insights | Expenses |
| :---: | :---: | :---: |
| ![Dashboard](https://via.placeholder.com/200x400?text=Dashboard) | ![AI Coach](https://via.placeholder.com/200x400?text=AI+Coach) | ![Expenses](https://via.placeholder.com/200x400?text=Expenses) |

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for new features or improvements, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---
Built with ❤️ for better financial futures.
