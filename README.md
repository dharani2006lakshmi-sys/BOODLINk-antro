# 🩸 Blood Bank Management System

A full-stack Blood Bank Management System with Role-Based Login, Donor Medical Management, Donor Card Generation, and a Donor Reward System.

---

## 📸 Features Overview

| Role     | Features |
|----------|----------|
| **Admin**    | View all donors/hospitals, approve blood requests, manage stock, generate reports |
| **Donor**    | Manage profile & medical details, view donation history, download donor card, track reward points |
| **Hospital** | Request blood units, track request status, view available stock |

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Hosting**: Firebase Hosting (optional)

---

## 📁 Project Structure

```
blood-bank/
├── frontend/
│   ├── index.html              # Landing / Role Selection
│   ├── pages/
│   │   ├── login.html          # Unified login page
│   │   ├── register.html       # Registration page
│   │   ├── admin-dashboard.html
│   │   ├── donor-dashboard.html
│   │   └── hospital-dashboard.html
│   ├── css/
│   │   └── styles.css          # Global styles
│   └── js/
│       ├── firebase-init.js    # Firebase config & init
│       ├── auth.js             # Auth logic
│       ├── admin.js            # Admin dashboard logic
│       ├── donor.js            # Donor dashboard logic
│       ├── hospital.js         # Hospital dashboard logic
│       └── donor-card.js       # Donor card generation
├── backend/
│   ├── server.js               # Express entry point
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── donor.routes.js
│   │   ├── hospital.routes.js
│   │   ├── blood.routes.js
│   │   └── admin.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js  # Firebase token verification
│   ├── controllers/
│   │   ├── donor.controller.js
│   │   ├── hospital.controller.js
│   │   ├── blood.controller.js
│   │   └── admin.controller.js
│   └── package.json
├── firebase-config/
│   ├── firestore.rules         # Security rules
│   └── firestore.indexes.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- npm v8+
- Firebase account

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/blood-bank-management.git
cd blood-bank-management
```

### Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., `blood-bank-system`)
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** → Start in **production mode**
5. Go to **Project Settings** → **Your apps** → Add a **Web app**
6. Copy the Firebase config object

### Step 3: Configure Firebase

Open `frontend/js/firebase-init.js` and replace the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Copy content from firebase-config/firestore.rules
firebase deploy --only firestore:rules
```

### Step 5: Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
# Fill in your Firebase service account credentials in .env
node server.js
```

### Step 6: Run Frontend
Open `frontend/index.html` in your browser, or use Live Server (VS Code extension).

---

## 🔐 Firebase Firestore Collections

| Collection       | Description |
|-----------------|-------------|
| `users`          | All user profiles (role, name, email) |
| `donors`         | Donor medical details & eligibility |
| `donations`      | Individual donation records |
| `bloodStock`     | Blood units by group |
| `hospitalRequests` | Blood requests from hospitals |
| `rewards`        | Points & category per donor |

---

## 🧪 Default Test Accounts

After setup, register accounts manually using:
- **Admin**: any email → set `role: "admin"` in Firestore `users` collection
- **Donor**: register on site → role auto-set to `"donor"`
- **Hospital**: register on site → role auto-set to `"hospital"`

---

## ☁️ Firebase Hosting Deployment

```bash
firebase init hosting
# Set public directory to: frontend
firebase deploy --only hosting
```

---

## 📄 License

MIT License — Free to use and modify.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.
