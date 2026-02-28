const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 🔹 WEEKLY RECALL CHECK
 * Runs every Monday at 9 AM EST
 * 
 * Workflow:
 * 1. Get all active vehicles from `vehicles` collection
 * 2. Call NHTSA API for each vehicle
 * 3. Check if recall is NEW (not in processedRecallIds)
 * 4. If NEW: Save to `recalls` collection (cache), Queue email via `mail` collection
 * 5. Mark recall as processed in vehicle doc
 */

exports.weeklyRecallCheck = functions.pubsub
  .schedule("0 9 * * 1") // Every Monday 9 AM EST
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("🔍 Starting weekly recall check...");

    try {
      // STEP 1: Get all active vehicles
      const vehiclesSnapshot = await db.collection("vehicles").get();

      if (vehiclesSnapshot.empty) {
        console.log("ℹ️ No vehicles to check");
        return;
      }

      console.log(`📋 Found ${vehiclesSnapshot.docs.length} vehicles to check`);

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicleData = vehicleDoc.data();
        const { vin, userId, make, model, year } = vehicleData;
        const processedIds = vehicleData.processedRecallIds || [];

        try {
          // STEP 2: Call NHTSA API
          console.log(`🔎 Checking ${year} ${make} ${model} (VIN: ${vin})`);

          const response = await fetch(
            `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`
          );

          if (!response.ok) {
            console.warn(
              `⚠️ NHTSA API error for ${vin}: ${response.statusText}`
            );
            continue;
          }

          const apiData = await response.json();
          const recalls = apiData.results || [];

          if (recalls.length === 0) {
            console.log(`✓ No recalls found for ${vin}`);
            continue;
          }

          // STEP 3: Filter for NEW recalls only
          const newRecalls = recalls.filter(
            (r) => !processedIds.includes(r.NHTSACampaignNumber)
          );

          if (newRecalls.length === 0) {
            console.log(`✓ All recalls already processed for ${vin}`);
            continue;
          }

          console.log(
            `🚨 Found ${newRecalls.length} NEW recalls for ${vin}`
          );

          // Get user email
          const userDoc = await db.collection("users").doc(userId).get();
          if (!userDoc.exists()) {
            console.warn(`⚠️ User ${userId} not found`);
            continue;
          }

          const userData = userDoc.data();
          if (!userData.notificationsEnabled) {
            console.log(`ℹ️ Notifications disabled for user ${userId}`);
            continue;
          }

          const userEmail = userData.email;

          // STEP 4: Process each new recall
          for (const recall of newRecalls) {
            const recallId = recall.NHTSACampaignNumber;

            try {
              // 4a: Save recall details to `recalls` collection (cache)
              await saveRecallDetails(recallId, recall);

              // 4b: Queue email via `mail` collection
              await queueRecallEmail(
                userEmail,
                vin,
                year,
                make,
                model,
                recall
              );

              // 4c: Mark as processed
              await vehicleDoc.ref.update({
                processedRecallIds: admin.firestore.FieldValue.arrayUnion(
                  recallId
                ),
                lastCheckedAt: admin.firestore.Timestamp.now(),
              });

              console.log(`✅ Email queued for recall ${recallId}`);
            } catch (err) {
              console.error(
                `❌ Error processing recall ${recallId}:`,
                err.message
              );
            }
          }
        } catch (err) {
          console.error(`❌ Error checking vehicle ${vin}:`, err.message);
        }
      }

      console.log("✅ Weekly recall check completed");
    } catch (err) {
      console.error("❌ Weekly recall check failed:", err);
      throw err;
    }
  });

/**
 * Save recall details to `recalls` collection for caching
 * Only saves if it doesn't already exist
 */
async function saveRecallDetails(recallId, recall) {
  const recallRef = db.collection("recalls").doc(recallId);
  const recallDoc = await recallRef.get();

  if (!recallDoc.exists) {
    await recallRef.set({
      component: recall.Component || "Unknown",
      summary: recall.Summary || "",
      consequence: recall.Consequence || "",
      remedy: recall.Remedy || "",
      safetyLevel: getSafetyLevel(recall),
      nhtsa_url: `https://www.nhtsa.gov/recalls`,
      createdAt: admin.firestore.Timestamp.now(),
    });
    console.log(`💾 Cached recall ${recallId}`);
  }
}

/**
 * Queue email via `mail` collection (Firebase Email Extension watches this)
 */
async function queueRecallEmail(
  userEmail,
  vin,
  year,
  make,
  model,
  recall
) {
  const subject = `⚠️ Safety Alert: ${year} ${make} ${model}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f5f5f5; }
          .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0275d8; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 New Safety Recall Found</h2>
          </div>

          <div class="content">
            <h3>Safe Act Recall: ${year} ${make} ${model}</h3>
            <p><strong>VIN:</strong> ${vin}</p>
            <p><strong>Recall ID:</strong> ${recall.NHTSACampaignNumber}</p>

            <div class="alert-box">
              <h4>Component Affected:</h4>
              <p><strong>${recall.Component}</strong></p>
            </div>

            <h4>What's the Issue?</h4>
            <p>${recall.Summary || "A safety issue has been identified with your vehicle."}</p>

            <h4>Why It Matters:</h4>
            <p>${recall.Consequence || "This issue could affect your safety."}</p>

            <h4>What You Should Do:</h4>
            <p>${recall.Remedy || "Contact your dealer for a free repair."}</p>

            <div class="alert-box" style="background-color: #d4edda; border-left-color: #28a745;">
              <p><strong>✅ The repair is FREE - no charge to you</strong></p>
              <p>Call your local dealer and mention recall ID: <code>${recall.NHTSACampaignNumber}</code></p>
            </div>

            <a href="https://www.nhtsa.gov/recalls" class="button">View Official NHTSA Info</a>
          </div>

          <div class="footer">
            <p>This is an automated alert from <strong>Propero VIN Decoder</strong></p>
            <p>You received this because a new recall was found for a vehicle on your account.</p>
            <p>Manage your preferences in your account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Create email document in `mail` collection
  // Firebase Email Extension automatically watches and sends
  await db.collection("mail").add({
    to: userEmail,
    message: {
      subject: subject,
      html: htmlContent,
    },
  });

  console.log(`📧 Email queued for ${userEmail}`);
}

/**
 * Determine safety level based on recall summary keywords
 */
function getSafetyLevel(recall) {
  const summary = (recall.Summary || "").toLowerCase();
  const component = (recall.Component || "").toLowerCase();
  const combined = `${summary} ${component}`;

  // CRITICAL keywords
  if (
    [
      "fire",
      "explosion",
      "fatality",
      "death",
      "crash",
      "brake failure",
      "steering failure",
    ].some((word) => combined.includes(word))
  ) {
    return "CRITICAL";
  }

  // HIGH keywords
  if (
    [
      "airbag",
      "brake",
      "steering",
      "suspension",
      "fuel leak",
      "electrical fire",
    ].some((word) => combined.includes(word))
  ) {
    return "HIGH";
  }

  return "MEDIUM";
}

/**
 * 🔹 OPTIONAL: Manual trigger for testing
 * Call via: firebase functions:shell
 * weeklyRecallCheck()
 */
exports.testRecallCheck = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  // Only allow admins or specific users
  const uid = context.auth.uid;
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists() || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  // Run the check
  return functions.pubsub
    .schedule("now")
    .onRun(() => exports.weeklyRecallCheck());
});
