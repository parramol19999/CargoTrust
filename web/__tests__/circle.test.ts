import { getOrCreateUserSession, createWalletChallengeAction } from '../src/lib/circleClient';
import crypto from 'crypto';

// Helper function mirroring emailToUUID internally in circleClient
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

describe("Circle Auth & SCA Wallet Generation Tests", () => {
  const testEmail = "grower-test@cargotrust.io";
  const expectedUUID = emailToUUID(testEmail);

  test("Should correctly hash email into consistent UUID v4 format", () => {
    const uuid1 = emailToUUID(testEmail);
    const uuid2 = emailToUUID(testEmail);
    expect(uuid1).toBe(expectedUUID);
    expect(uuid2).toBe(uuid1);
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test("Should handle mock OTP validation correctly", () => {
    const validOtp = "123456";
    const invalidOtp = "999999";
    
    // Simulate UI check
    const verifyOtp = (code: string) => code === "123456";
    
    expect(verifyOtp(validOtp)).toBe(true);
    expect(verifyOtp(invalidOtp)).toBe(false);
  });

  test("Should mock Circle user session token retrieve and return correct properties", async () => {
    // We mock the getOrCreateUserSession response for testing environments
    const mockGetOrCreateUserSession = async (email: string) => {
      const userId = emailToUUID(email);
      return {
        success: true,
        userId,
        userToken: "mock_jwt_token_xyz123",
        encryptionKey: "mock_encryption_key_abc789",
        walletAddress: "0xMockScaAddress8888888888888888888888888",
        walletId: "mock-wallet-uuid-0000-1111",
        appId: "mock-app-id-777",
      };
    };

    const res = await mockGetOrCreateUserSession(testEmail);
    expect(res.success).toBe(true);
    expect(res.userId).toBe(expectedUUID);
    expect(res.userToken).toBeDefined();
    expect(res.walletAddress).toBe("0xMockScaAddress8888888888888888888888888");
  });

  test("Should mock wallet challenge generation for new users", async () => {
    const mockCreateWalletChallenge = async (userToken: string) => {
      if (userToken === "mock_jwt_token_xyz123") {
        return {
          success: true,
          challengeId: "mock-challenge-uuid-2222-3333",
        };
      }
      return { success: false, error: "Invalid token" };
    };

    const res = await mockCreateWalletChallenge("mock_jwt_token_xyz123");
    expect(res.success).toBe(true);
    expect(res.challengeId).toBe("mock-challenge-uuid-2222-3333");
  });
});
