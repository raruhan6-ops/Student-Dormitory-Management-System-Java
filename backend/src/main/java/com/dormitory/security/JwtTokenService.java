package com.dormitory.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Service for JWT token operations - verification and extraction of claims.
 * Used by security interceptors to verify authentication and authorization.
 */
@Service
public class JwtTokenService {

    @Value("${app.auth.secret:change-me}")
    private String authSecret;

    /**
     * Represents the claims extracted from a JWT token
     */
    public static class TokenClaims {
        private final String username;
        private final String role;
        private final long exp;
        private final boolean valid;
        private final String error;

        private TokenClaims(String username, String role, long exp, boolean valid, String error) {
            this.username = username;
            this.role = role;
            this.exp = exp;
            this.valid = valid;
            this.error = error;
        }

        public static TokenClaims valid(String username, String role, long exp) {
            return new TokenClaims(username, role, exp, true, null);
        }

        public static TokenClaims invalid(String error) {
            return new TokenClaims(null, null, 0, false, error);
        }

        public String getUsername() { return username; }
        public String getRole() { return role; }
        public long getExp() { return exp; }
        public boolean isValid() { return valid; }
        public String getError() { return error; }
        
        public boolean isExpired() {
            return System.currentTimeMillis() / 1000L > exp;
        }

        public boolean hasRole(String... allowedRoles) {
            if (role == null) return false;
            for (String allowedRole : allowedRoles) {
                if (role.equalsIgnoreCase(allowedRole)) return true;
            }
            return false;
        }
    }

    /**
     * Verify and decode JWT token from cookie
     * @param token The JWT token string (format: base64url(payload).base64url(signature))
     * @return TokenClaims containing user info or error
     */
    public TokenClaims verifyToken(String token) {
        if (token == null || token.isEmpty()) {
            return TokenClaims.invalid("No token provided");
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                return TokenClaims.invalid("Invalid token format");
            }

            String payloadB64 = parts[0];
            String sigB64 = parts[1];

            // Verify HMAC-SHA256 signature
            byte[] expectedSig = hmacSha256(
                payloadB64.getBytes(StandardCharsets.UTF_8),
                authSecret.getBytes(StandardCharsets.UTF_8)
            );
            String expectedSigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(expectedSig);

            if (!sigB64.equals(expectedSigB64)) {
                return TokenClaims.invalid("Invalid token signature");
            }

            // Decode payload
            byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadB64);
            String payload = new String(payloadBytes, StandardCharsets.UTF_8);

            // Parse JSON claims
            String username = extractJsonValue(payload, "username");
            String role = extractJsonValue(payload, "role");
            String expStr = extractJsonValue(payload, "exp");

            if (username == null || role == null || expStr == null) {
                return TokenClaims.invalid("Missing required token claims");
            }

            long exp = Long.parseLong(expStr);

            // Check expiration
            if (System.currentTimeMillis() / 1000L > exp) {
                return TokenClaims.invalid("Token expired");
            }

            return TokenClaims.valid(username, role, exp);

        } catch (Exception e) {
            return TokenClaims.invalid("Token verification failed: " + e.getMessage());
        }
    }

    /**
     * Extract a value from simple JSON string
     */
    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) return null;

        int valueStart = keyIndex + searchKey.length();
        if (json.charAt(valueStart) == '"') {
            // String value
            valueStart++;
            int valueEnd = json.indexOf('"', valueStart);
            return json.substring(valueStart, valueEnd);
        } else {
            // Number value
            int valueEnd = valueStart;
            while (valueEnd < json.length() &&
                   (Character.isDigit(json.charAt(valueEnd)) || json.charAt(valueEnd) == '-')) {
                valueEnd++;
            }
            return json.substring(valueStart, valueEnd);
        }
    }

    /**
     * Compute HMAC-SHA256
     */
    private byte[] hmacSha256(byte[] data, byte[] key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key, "HmacSHA256");
            mac.init(secretKeySpec);
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC", e);
        }
    }
}
