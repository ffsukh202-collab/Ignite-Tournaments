Act as a senior backend engineer.

GOAL:
Generate a PRODUCTION-READY backend server for an esports tournament app.

IMPORTANT:
• Backend must be generated as a SINGLE FILE only → index.js
• Backend must be READY TO DEPLOY (Node.js + Express)
• Frontend must work by ONLY changing backend URL
• Frontend code must NOT be modified

--------------------------------------------------
CORE RULES (NON-NEGOTIABLE)
--------------------------------------------------

• Use Node.js + Express
• SINGLE FILE ONLY → index.js
• Use Firebase Admin SDK
• Use Cloud Firestore
• Use Firestore transactions wherever money or joins are involved
• Client is FULLY UNTRUSTED
• Client NEVER writes to Firestore
• ALL writes handled ONLY by backend APIs

--------------------------------------------------
AUTHENTICATION
--------------------------------------------------

• Verify Firebase ID Token from Authorization header
• Extract Firebase UID
• Firebase UID is the ONLY user identity

--------------------------------------------------
PAYMENT GATEWAY (REAL MONEY – CRITICAL)
--------------------------------------------------

• Use Cashfree as payment gateway
• Wallet balance MUST NEVER be credited directly
• Client payment success callbacks must NOT be trusted

PAYMENT FLOW (LOCKED):

1) CREATE ORDER
POST /wallet/createOrder
Body:
{
  amount
}

BACKEND MUST:
• Create Cashfree payment order/session
• Store transaction in Firestore with:
  - status = "PENDING"
  - userId
  - amount
  - orderId
• RETURN payment session/token to client
• DO NOT update wallet here

----------------------------------

2) PAYMENT COMPLETION
• Client completes Cashfree checkout
• Client does NOTHING with wallet

----------------------------------

3) WEBHOOK VERIFICATION (ONLY PLACE WHERE WALLET UPDATES)

POST /webhook/cashfree

BACKEND MUST:
• Verify Cashfree webhook signature
• Validate orderId & amount
• Ensure webhook is authentic
• Ensure webhook is idempotent

IF payment SUCCESS:
• Credit wallet balance
• Update transaction status = "SUCCESS"

IF payment FAILED:
• Update transaction status = "FAILED"

STRICT RULES:
• Wallet updates ONLY via webhook
• Duplicate webhooks must NOT double-credit wallet

--------------------------------------------------
API ENDPOINTS (MUST MATCH EXACTLY)
--------------------------------------------------

POST /auth/signup
Body:
{
  uid,
  username,
  email,
  referralCode?
}

RULES:
• Create user document only if not exists
• Generate referralCode if missing

----------------------------------

POST /match/join
Body:
{
  matchId,
  gameUids: []   // 1, 2, or 4
}

RULES:
• Use Firestore transaction
• match.status MUST be "upcoming"
• Slot availability check
• Prevent duplicate joins
• Prevent duplicate gameUids across teams
• Deduct entry fee from USER wallet
• Create TEAM GROUP at:
  matches/{matchId}/teams/{userUid}

----------------------------------

POST /rewards/daily

RULES:
• Allow once per 24 hours
• Credit wallet
• Increment dailyStreak
• Log transaction

----------------------------------

POST /wallet/withdraw
Body:
{
  amount,
  upiId
}

RULES:
• Check wallet balance
• Create withdrawal transaction with status = "PENDING"
• Wallet deducted immediately or locked
• Admin approval required later

----------------------------------

POST /admin/match/distribute
Body:
{
  matchId,
  gameUid,
  rank,
  kills
}

RULES:
• Resolve TEAM by searching gameUid in teams.gameUids[]
• Identify ownerUid automatically
• Prize calculation:
  (kills × perKillRate) + rankPrize
• XP calculation uses constant formula
• Credit prize & XP ONLY ONCE
• Block duplicate distribution using prizeDistributed flag

--------------------------------------------------
FIRESTORE STRUCTURE (LOCKED)
--------------------------------------------------

/users/{uid}
  - username, email, wallet, totalXP
  - joinedMatches[]
  - referralCode, referredBy
  - matchesPlayed, totalKills
  - dailyStreak, isVIP

/matches/{matchId}
  - status, mode, mapKey
  - entryFee, maxPlayers, joinedCount
  - perKillRate, rankPrizes
  - unlockTimestamp, prizeDistributed

/matches/{matchId}/teams/{uid}
  - ownerUid
  - ownerUsername
  - gameUids[]

/transactions/{transactionId}
  - userId, type, amount, status, orderId?, timestamp

--------------------------------------------------
SECURITY REQUIREMENTS
--------------------------------------------------

• Validate ALL inputs
• Reject invalid state transitions
• Use Firestore transactions for money & joins
• No client-trusted flags
• Idempotent webhook handling

--------------------------------------------------
OUTPUT REQUIREMENTS
--------------------------------------------------

• Output ONLY ONE FILE → index.js
• NO pseudocode
• NO explanations
• Code must be complete & runnable
• Ready for Vercel / Render / Node deploy
