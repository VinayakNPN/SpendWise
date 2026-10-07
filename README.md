<div align="center">
  
  <h1>S P E N D W I S E</h1>
  <p><b>Your Intelligent Financial Companion</b></p>
  
  <p>
    A sophisticated, local-first personal finance management application built with <strong>React Native</strong> and <strong>Expo</strong>. Combining traditional expense tracking with cutting-edge AI insights to help you master your money.
  </p>

  <br />

  <a href="#features">Features</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#tech-stack">Tech Stack</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#getting-started">Getting Started</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#project-structure">Architecture</a>
  
</div>

<br />
<hr />

<h2 id="features">Key Features</h2>

<table>
  <tr>
    <td width="50%">
      <h3>Smart Dashboard</h3>
      <p>A high-level overview of your net worth, monthly spending, and budget health at a glance.</p>
    </td>
    <td width="50%">
      <h3>Expense Tracking</h3>
      <p>Seamlessly record income and expenses with categorized entries and persistent SQLite storage.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Goal Planner</h3>
      <p>Define your financial milestones—whether it is a new home, a car, or an emergency fund—and track your progress in real-time.</p>
    </td>
    <td width="50%">
      <h3>Investment Portfolio</h3>
      <p>Manage your assets and calculate potential returns with built-in investment projection calculators.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>AI Financial Coach</h3>
      <p>Get personalized, actionable financial advice powered by <strong>Groq AI (Llama 3.3)</strong>. Ask questions about your spending habits or get tips on saving.</p>
    </td>
    <td width="50%">
      <h3>Privacy First & Smart Alerts</h3>
      <p>All sensitive financial data is stored locally on your device. Never miss a bill or overspend with integrated local notifications.</p>
    </td>
  </tr>
</table>

<br />

<h2 id="tech-stack">Tech Stack</h2>

<details>
  <summary><b>Click to expand architecture details</b></summary>
  <br />
  <ul>
    <li><b>Framework:</b> <a href="https://expo.dev/">Expo</a> (React Native)</li>
    <li><b>Language:</b> <a href="https://www.typescriptlang.org/">TypeScript</a></li>
    <li><b>Database:</b> <a href="https://docs.expo.dev/versions/latest/sdk/sqlite/">expo-sqlite</a> (Local Storage)</li>
    <li><b>AI Engine:</b> <a href="https://groq.com/">Groq Cloud API</a> (Llama 3.3 70b Versatile)</li>
    <li><b>State Management:</b> React Context API + Custom Store</li>
    <li><b>Navigation:</b> <a href="https://reactnavigation.org/">React Navigation</a></li>
    <li><b>Animations:</b> <a href="https://docs.swmansion.com/react-native-reanimated/">React Native Reanimated</a></li>
  </ul>
</details>

<br />

<h2 id="getting-started">Getting Started</h2>

<blockquote>
  <p><strong>Prerequisites:</strong> Node.js (v18 or higher), npm or yarn, and the Expo Go app on your mobile device (or Android Studio/Xcode for emulators).</p>
</blockquote>

### 1. Clone the repository
```bash
git clone https://github.com/VinayakNPN/SpendWise.git
cd SpendWise
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Groq API key:
```env
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the application
```bash
npx expo start
```
*Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open the app.*

<br />

<h2 id="project-structure">Project Structure</h2>

<pre>
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
</pre>

<br />
<hr />

<div align="center">
  <p>Contributions are welcome! If you have suggestions for new features or improvements, feel free to open an issue or submit a pull request.</p>
  <br />
  <p><i>Designed by Vinayak</i></p>
</div>
