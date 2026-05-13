const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Package Credit Mapping
const PACKAGE_MAP = {
  "hours_1": { min: 60, q: 40 },
  "hours_2": { min: 120, q: 60 },
  "hours_3": { min: 180, q: 80 },
  "hours_5": { min: 300, q: 100 },
  "monthly": { min: 0, q: 800 },
  "addon_10": { min: 0, q: 20 },
  "addon_20": { min: 0, q: 40 }
};

// --- API ENDPOINTS ---

app.get('/api/stats', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const pendingSnap = await db.collection('credit_requests').where('status', '==', 'pending').get();
    const approvedSnap = await db.collection('credit_requests').where('status', '==', 'approved').get();
    const rejectedSnap = await db.collection('credit_requests').where('status', '==', 'rejected').get();
    const pkgSnap = await db.collection('billing_packages').get();
    
    res.json({ 
      users: usersSnap.size, 
      pending: pendingSnap.size, 
      approved: approvedSnap.size,
      rejected: rejectedSnap.size,
      packages: pkgSnap.size 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
  try {
    const snap = await db.collection('users').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/add-credits', async (req, res) => {
  const { uid, minutes, questions } = req.body;
  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    
    const userData = snap.data();
    const newMin = (Number(userData.credits) || 0) + (Number(minutes) || 0);
    const newQ = (Number(userData.questionCredits) || 0) + (Number(questions) || 0);

    await userRef.update({ credits: newMin, questionCredits: newQ });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/requests', async (req, res) => {
  try {
    const snap = await db.collection('credit_requests').orderBy('timestamp', 'desc').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/requests/approve', async (req, res) => {
  const { reqId, userId, packageId, manual } = req.body;
  try {
    console.log(`[Admin] Processing Approval for: ${reqId}`);
    
    let creditsToAdd = { min: 0, q: 0 };
    if (manual) {
      creditsToAdd = { min: parseInt(manual.min) || 0, q: parseInt(manual.q) || 0 };
    } else {
      // Fetch from Firestore billing_packages
      const pkgDoc = await db.collection('billing_packages').doc(packageId).get();
      if (pkgDoc.exists) {
        const pkgData = pkgDoc.data();
        creditsToAdd = { min: parseInt(pkgData.min) || 0, q: parseInt(pkgData.q) || 0 };
      } else {
        // Fallback to local map if not in DB yet
        const mapped = PACKAGE_MAP[packageId];
        if (mapped) creditsToAdd = { min: parseInt(mapped.min) || 0, q: parseInt(mapped.q) || 0 };
      }
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error(`[Admin] User ${userId} not found!`);
      return res.status(404).json({ error: "User not found in database." });
    }

    const userData = userDoc.data();
    const newMin = (Number(userData.credits) || 0) + creditsToAdd.min;
    const newQ = (Number(userData.questionCredits) || 0) + creditsToAdd.q;

    console.log(`[Admin] Email: ${userData.email} | Old: ${userData.credits} | New: ${newMin}`);

    await db.collection('credit_requests').doc(reqId).update({ status: 'approved' });
    await userRef.update({ credits: newMin, questionCredits: newQ });

    res.json({ success: true, newBalance: newMin });
  } catch (e) { 
    console.error(`[Admin] Error:`, e.message);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/requests/reject', async (req, res) => {
  try {
    console.log(`[Admin] Rejecting Request: ${req.body.reqId}`);
    await db.collection('credit_requests').doc(req.body.reqId).update({ status: 'rejected' });
    console.log(`[Admin] Request marked as Rejected.`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    await db.collection('credit_requests').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/packages', async (req, res) => {
  try {
    const snap = await db.collection('billing_packages').orderBy('order', 'asc').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/packages/setup-defaults', async (req, res) => {
  console.log(">>> [API] RECEIVED REQUEST FOR SETUP DEFAULTS <<<");
  try {
    console.log("[Admin] Starting Bulk Package Sync...");
    const batch = db.batch();
    const defaults = [
      { id: "hours_1", name: "1 Hour (60 Min | 40 Q)", price: 999, order: 1, min: 60, q: 40 },
      { id: "hours_2", name: "2 Hours (120 Min | 60 Q)", price: 1599, order: 2, min: 120, q: 60 },
      { id: "hours_3", name: "3 Hours (180 Min | 80 Q)", price: 1999, order: 3, min: 180, q: 80 },
      { id: "hours_5", name: "5 Hours (300 Min | 100 Q)", price: 2999, order: 4, min: 300, q: 100 },
      { id: "monthly", name: "Monthly (800 Q)", price: 6999, order: 5, min: 0, q: 800 },
      { id: "addon_10", name: "+20 Q Addon", price: 199, order: 6, min: 0, q: 20 },
      { id: "addon_20", name: "+40 Q Addon", price: 299, order: 7, min: 0, q: 40 },
    ];

    defaults.forEach(pkg => {
      const { id, ...data } = pkg;
      const ref = db.collection('billing_packages').doc(id);
      batch.set(ref, data, { merge: true });
    });

    await batch.commit();
    console.log("[Admin] Bulk Package Sync Success!");
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/packages/save', async (req, res) => {
  const { id, ...data } = req.body;
  try {
    await db.collection('billing_packages').doc(id).set(data, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    await db.collection('billing_packages').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings', async (req, res) => {
  try {
    const llmSnap = await db.collection('app_settings').doc('llm_config').get();
    const qrSnap = await db.collection('app_config').where('type', '==', 'payment_qr').limit(1).get();
    res.json({
      llm: llmSnap.exists ? llmSnap.data() : { defaultModel: '', provider: 'gemini', apiKey: '', baseUrl: '' },
      qr: !qrSnap.empty ? { id: qrSnap.docs[0].id, url: qrSnap.docs[0].data().url } : { id: null, url: '' }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/save-llm', async (req, res) => {
  try {
    await db.collection('app_settings').doc('llm_config').set(req.body, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/save-qr', async (req, res) => {
  const { id, url } = req.body;
  try {
    if (id) {
      await db.collection('app_config').doc(id).update({ url });
    } else {
      await db.collection('app_config').add({ type: 'payment_qr', url });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`NEW Admin Backend IS RUNNING on port ${PORT}`);
});
