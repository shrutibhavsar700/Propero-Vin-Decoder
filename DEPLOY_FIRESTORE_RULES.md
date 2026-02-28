# 🔐 Deploy Firestore Security Rules via Console

## Option 1: Using Firebase Console (Easiest)

### **Step 1: Go to Firebase Console**
1. Open [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project: **propero-vin-decoder**
3. Click **Firestore Database** in the left menu

### **Step 2: Open Rules Editor**
1. Click the **Rules** tab at the top
2. You'll see your current rules (the permissive ones)

### **Step 3: Replace with New Rules**
Delete everything in the editor and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ========== USERS ==========
    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Cloud Functions can read all users
      allow read: if request.auth == null;
    }

    // ========== VEHICLES ==========
    // Users can read vehicles they own
    // Cloud Functions can read/write all vehicles
    match /vehicles/{document=**} {
      allow read: if resource.data.userId == request.auth.uid;
      allow write: if request.auth.uid == resource.data.userId || request.auth == null;
      
      // Cloud Functions can do anything
      allow read, write: if request.auth == null;
    }

    // ========== RECALLS ==========
    // Anyone authenticated can read (it's a cache of public NHTSA data)
    // Only Cloud Functions can write
    match /recalls/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth == null; // Cloud Functions only
    }

    // ========== MAIL ==========
    // Only Cloud Functions can write to mail queue
    // Cloud Functions read/write their own email documents
    match /mail/{document=**} {
      allow read, write: if request.auth == null; // Cloud Functions only
    }
  }
}
```

### **Step 4: Click "Publish"**
- Click the blue **Publish** button
- You'll see a warning about security - that's normal, it's asking you to confirm
- Click **Publish** again to confirm

✅ **Done!** Your rules are now live.

---

## Option 2: Using Firebase CLI (Recommended for DevOps)

If you have Firebase CLI installed:

```powershell
firebase deploy --only firestore:rules
```

---

## 🔍 What These Rules Do

| Path | Who Can Read | Who Can Write |
|------|-------------|---------------|
| `/users/{userId}` | Only that user + Cloud Functions | Only that user |
| `/vehicles/{vin}_{userId}` | Only the owner + Cloud Functions | Only the owner + Cloud Functions |
| `/recalls/{recallId}` | Any authenticated user | Only Cloud Functions |
| `/mail/{docId}` | Cloud Functions only | Cloud Functions only |

---

## ✅ After Deploying Rules

Your app will now:
- 🔒 Prevent users from accessing other users' data
- 📧 Allow Cloud Functions to send emails via `mail` collection
- 💾 Allow Cloud Functions to cache recalls in `recalls` collection
- 🚗 Allow users to only see their own vehicles

---

## 🧪 Test the Rules

### **Test 1: Can I read my own user doc?**
✅ Yes (logged in)

### **Test 2: Can I read someone else's user doc?**
❌ No (permission denied)

### **Test 3: Can I modify the recalls collection?**
❌ No (only Cloud Functions can)

### **Test 4: Can I see vehicle recalls?**
✅ Yes (recalls are public for authenticated users)

---

## 🆘 If Rules Don't Work

**Error: "Permission denied"**
- Make sure you replaced ALL the old rules
- Check that your auth user ID matches the userId in documents

**Error: "Cloud Function can't write to mail"**
- This is expected until you deploy the Cloud Function
- Deploy with: `firebase deploy --only functions`

---

## 📋 Next Steps

1. ✅ **Deploy these rules** (you are here)
2. Deploy Cloud Functions: `firebase deploy --only functions`
3. Add test vehicle to `vehicles` collection
4. Wait for Monday 9 AM or manually trigger the function
5. Check `mail` collection for queued emails

