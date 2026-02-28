# 🚀 Propero Auto-Monitor Setup Guide

## ✅ What's Been Created

I've set up the entire backend infrastructure for your **Smart Recall Alerts** feature:

1. ✅ **Cloud Functions** (`functions/index.js`) - Weekly recall checker
2. ✅ **Firestore Rules** (`firestore.rules`) - Secure data access
3. ✅ **React Component** (`MultiVin.jsx`) - Display recalls to users
4. ⏳ **Email Extension** - Need to configure (instructions below)

---

## 📋 Firestore Schema (Ready to Use)

Your database structure is already configured for these collections:

```
users/{userId}
├── email
├── notificationsEnabled (true/false)
├── createdAt
└── credits

vehicles/{vin}_{userId}
├── vin
├── userId
├── make
├── model
├── year
├── lastCheckedAt
└── processedRecallIds: ["23V123000", "24V456000"]

recalls/{recallId}
├── component
├── summary
├── consequence
├── remedy
├── safetyLevel (CRITICAL, HIGH, MEDIUM)
├── nhtsa_url
└── createdAt

mail/{docId} ← Firebase Email Extension watches this
├── to: "user@example.com"
├── message:
│   ├── subject
│   └── html
└── delivery: (auto-populated by Extension)
```

---

## 🔧 Setup Steps (Windows PowerShell)

### **Step 1: Install Firebase CLI**

```powershell
npm install -g firebase-tools
firebase login
firebase use propero-vin-decoder
```

### **Step 2: Install Functions Dependencies**

```powershell
cd functions
npm install
cd ..
```

### **Step 3: Deploy Firestore Rules**

```powershell
firebase deploy --only firestore:rules
```

### **Step 4: Deploy Cloud Functions**

```powershell
firebase deploy --only functions
```

This deploys the `weeklyRecallCheck` function that:
- ⏰ Runs every Monday at 9 AM EST
- 📋 Gets all vehicles from your Firestore
- 🔎 Calls NHTSA API for each
- 📧 Queues emails to `mail` collection
- ✅ Marks recalls as processed

---

## 📧 Firebase Email Extension Setup

The Cloud Function queues emails by adding documents to the `mail` collection. You need to set up the **Firebase Email Extension** to actually send them.

### **Option 1: Using Nodemailer (Free) - RECOMMENDED**

Since we're using Nodemailer in the code, you need to:

1. **Enable Gmail App Password:**
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows" 
   - Copy the 16-character password

2. **Set Environment Variables:**
   ```powershell
   firebase functions:config:set \
     email.sender="your-email@gmail.com" \
     email.password="your-16-char-app-password"
   ```

3. **Redeploy Functions:**
   ```powershell
   firebase deploy --only functions
   ```

### **Option 2: Using Firebase Email Extension**

If you prefer the official Firebase extension:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Extensions** > **Trigger Email**
3. Install the extension
4. Configure SMTP details
5. The function will automatically queue emails

---

## 🧪 Testing the Setup

### **Test 1: Check Cloud Function Logs**

```powershell
firebase functions:log
```

Look for the `weeklyRecallCheck` execution logs.

### **Test 2: Manual Trigger (Optional)**

Add this function to manually test (admin only):

```javascript
// Already included in functions/index.js
exports.testRecallCheck = functions.https.onCall(...)
```

Call it from your React app:

```javascript
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const testCheck = httpsCallable(functions, "testRecallCheck");
await testCheck();
```

### **Test 3: Check Firestore Collections**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **Firestore Database**
3. Check these collections:
   - `vehicles` - Should have `{vin}_{userId}` documents
   - `recalls` - Should have cached recall data
   - `mail` - Should have queued emails
   - `users` - Should have user profiles

---

## 🔐 Firestore Security Rules Deployed

Your rules ensure:

✅ Users can only see their own vehicles  
✅ Cloud Functions can access all data  
✅ Recalls collection is read-only for users (cached NHTSA data)  
✅ Mail collection is write-only for Cloud Functions  

---

## 📱 What Users See in the App

When a user adds a VIN:

1. VIN is saved to `vehicles/{vin}_{userId}`
2. Every Monday at 9 AM, Cloud Function checks for new recalls
3. If found:
   - Details saved to `recalls` collection
   - Email queued to `mail` collection
   - User gets email notification
   - `processedRecallIds` updated to prevent duplicate alerts

4. User can click "🔍 View Recalls" button in the app to see all recalls for that VIN

---

## 📊 Monitoring & Debugging

### **Check Function Logs:**
```powershell
firebase functions:log --limit 50
```

### **Check for Email Errors:**
Go to Firebase Console > **Extensions** > **Trigger Email** > **Logs**

### **Manually Check Firestore:**
```bash
firebase firestore:inspect
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Function not running | Check timezone in `schedule()` - Currently set to `America/New_York` |
| Emails not sending | Verify Gmail App Password is correct and 16 characters |
| No recalls in mail collection | Check Cloud Function logs with `firebase functions:log` |
| Permission denied errors | Ensure Firestore rules are deployed with `firebase deploy --only firestore:rules` |

---

## 🎯 Next Steps

1. **Deploy everything:**
   ```powershell
   firebase deploy
   ```

2. **Test in Firebase Console:**
   - Add a test vehicle to `vehicles` collection
   - Check if Cloud Function runs Monday at 9 AM
   - Verify email queued in `mail` collection

3. **Monitor via:**
   - Firebase Console logs
   - CloudFunctions metrics
   - Email delivery status

---

## 📚 Additional Resources

- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Email Extension](https://firebase.google.com/products/extensions/firebase-trigger-email)
- [NHTSA Recalls API](https://api.nhtsa.gov/swagger/)

---

**Need help?** Check Firebase Console > Functions > Logs for error messages.
