package com.bamikahub.inventorysystem.services.security;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for handling Time-based One-Time Password (TOTP) operations
 * Compatible with Google Authenticator, Microsoft Authenticator, and other TOTP apps
 */
@Service
@Slf4j
public class TOTPService {

    private static final int SECRET_SIZE = 20; // 160 bits
    private static final int WINDOW = 1; // Allow 1 time step before/after for clock drift
    private static final int TIME_STEP = 30; // 30 seconds
    private static final int DIGITS = 6; // 6-digit code

    /**
     * Generate a new secret key for TOTP
     */
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[SECRET_SIZE];
        random.nextBytes(bytes);
        Base32 base32 = new Base32();
        return base32.encodeToString(bytes);
    }

    /**
     * Generate QR code image as Base64 for easy enrollment
     */
    public String generateQRCodeBase64(String secret, String username, String issuer) throws WriterException, IOException {
        String otpAuthURL = String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s",
            issuer,
            username,
            secret,
            issuer
        );

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthURL, BarcodeFormat.QR_CODE, 300, 300);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        byte[] imageBytes = outputStream.toByteArray();

        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Verify TOTP code against secret
     */
    public boolean verifyCode(String secret, String code) {
        long currentTime = System.currentTimeMillis() / 1000 / TIME_STEP;

        // Check current time and +/- WINDOW
        for (int i = -WINDOW; i <= WINDOW; i++) {
            long timeStep = currentTime + i;
            String generatedCode = generateCode(secret, timeStep);
            if (generatedCode.equals(code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate TOTP code for a given time step
     */
    private String generateCode(String secret, long timeStep) {
        try {
            Base32 base32 = new Base32();
            byte[] decodedKey = base32.decode(secret);

            // Convert time to bytes
            byte[] data = new byte[8];
            long value = timeStep;
            for (int i = 8; i-- > 0; value >>>= 8) {
                data[i] = (byte) value;
            }

            // Generate HMAC-SHA1
            SecretKeySpec signKey = new SecretKeySpec(decodedKey, "HmacSHA1");
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(signKey);
            byte[] hash = mac.doFinal(data);

            // Get offset from last 4 bits
            int offset = hash[hash.length - 1] & 0xF;

            // Get 4 bytes from offset
            long truncatedHash = 0;
            for (int i = 0; i < 4; ++i) {
                truncatedHash <<= 8;
                truncatedHash |= (hash[offset + i] & 0xFF);
            }

            // Remove most significant bit
            truncatedHash &= 0x7FFFFFFF;
            truncatedHash %= 1000000;

            // Pad with zeros
            return String.format("%0" + DIGITS + "d", truncatedHash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error generating TOTP code", e);
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }

    /**
     * Generate current TOTP code for testing
     */
    public String getCurrentCode(String secret) {
        long currentTime = System.currentTimeMillis() / 1000 / TIME_STEP;
        return generateCode(secret, currentTime);
    }

    /**
     * Get remaining seconds until code changes
     */
    public int getRemainingSeconds() {
        long currentTime = System.currentTimeMillis() / 1000;
        return TIME_STEP - (int) (currentTime % TIME_STEP);
    }
}
