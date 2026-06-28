"use server";

import { CircleUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import crypto from "crypto";

const client = new CircleUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY || "dummy_key",
});

function emailToUUID(email: string): string {
  const hash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join("-");
}

export async function getOrCreateUserSession(email: string) {
  try {
    const userId = emailToUUID(email);

    // 1. Register User in Circle (if not exists)
    try {
      await client.createUser({ userId });
    } catch (e: any) {
      console.log(`User registration status for ${email}:`, e.message || e);
    }

    // 2. Generate userToken and encryptionKey
    const tokenResponse = await client.createUserToken({ userId });
    const userToken = tokenResponse.data?.userToken;
    const encryptionKey = tokenResponse.data?.encryptionKey;

    if (!userToken || !encryptionKey) {
      throw new Error("Failed to retrieve user token or encryption key");
    }

    // 3. Query existing wallets to see if they already have an Arc Testnet wallet
    let walletAddress: string | null = null;
    let walletId: string | null = null;
    try {
      const walletsResponse = await client.listWallets({ userToken });
      const wallets = walletsResponse.data?.wallets || [];
      const arcWallet = wallets.find(
        (w: any) =>
          w.blockchain === "ARC-TESTNET" ||
          w.blockchain === "ARC"
      );
      if (arcWallet) {
        walletAddress = arcWallet.address;
        walletId = arcWallet.id;
      }
    } catch (e) {
      console.log("Error listing wallets for user session:", e);
    }

    return {
      success: true,
      userId,
      userToken,
      encryptionKey,
      walletAddress,
      walletId,
      appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID || "",
    };
  } catch (error: any) {
    console.error("Error in getOrCreateUserSession:", error);
    return { success: false, error: error.message };
  }
}

export async function createWalletChallengeAction(userToken: string) {
  try {
    let pinStatus = "UNSET";
    try {
      const userStatus = await client.getUserStatus({ userToken });
      pinStatus = userStatus.data?.pinStatus || "UNSET";
    } catch (err) {
      console.log("Could not query user status, defaulting to UNSET PIN:", err);
    }

    let response;
    if (pinStatus === "UNSET") {
      response = await client.createUserPinWithWallets({
        userToken,
        blockchains: ["ARC-TESTNET"],
        accountType: "SCA",
      });
    } else {
      response = await client.createWallet({
        userToken,
        blockchains: ["ARC-TESTNET"],
        accountType: "SCA",
      });
    }
    
    return {
      success: true,
      challengeId: response.data?.challengeId,
    };
  } catch (error: any) {
    console.error("Error in createWalletChallengeAction:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchUserWalletsAction(userToken: string) {
  try {
    const response = await client.listWallets({ userToken });
    return {
      success: true,
      wallets: response.data?.wallets || [],
    };
  } catch (error: any) {
    console.error("Error in fetchUserWalletsAction:", error);
    return { success: false, error: error.message };
  }
}

export async function createContractCallChallengeAction(
  userToken: string,
  walletId: string,
  contractAddress: string,
  callData: `0x${string}`
) {
  try {
    const response = await client.createUserTransactionContractExecutionChallenge({
      userToken,
      walletId,
      contractAddress,
      callData,
      fee: {
        type: "level",
        config: {
          feeLevel: "HIGH",
        },
      },
    });

    return {
      success: true,
      challengeId: response.data?.challengeId,
    };
  } catch (error: any) {
    console.error("Error in createContractCallChallengeAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getTransactionHashByChallengeAction(userToken: string, challengeId: string) {
  try {
    const challengeRes = await client.getUserChallenge({ challengeId, userToken });
    const challenge = challengeRes.data?.challenge;
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status === "FAILED" || challenge.status === "EXPIRED") {
      throw new Error(`Challenge ended with status: ${challenge.status}. Error: ${challenge.errorMessage}`);
    }

    const transactionId = challenge.correlationIds?.[0];
    if (!transactionId) {
      throw new Error("No transaction ID found in challenge correlationIds");
    }

    const transactionRes = await client.getTransaction({ id: transactionId, userToken });
    const transaction = transactionRes.data?.transaction;

    return {
      success: true,
      txHash: transaction?.txHash || null,
      status: transaction?.state,
    };
  } catch (error: any) {
    console.error("Error in getTransactionHashByChallengeAction:", error);
    return { success: false, error: error.message };
  }
}
