package com.dormitory.service;

import com.dormitory.util.CaptchaUtil;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class CaptchaService {

    private final Map<String, String> captchaStore = new ConcurrentHashMap<>();
    private final Map<String, Long> captchaExpiry = new ConcurrentHashMap<>();

    public CaptchaService() {
        // Cleanup task
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            long now = System.currentTimeMillis();
            captchaExpiry.forEach((id, expiry) -> {
                if (expiry < now) {
                    captchaStore.remove(id);
                    captchaExpiry.remove(id);
                }
            });
        }, 1, 1, TimeUnit.MINUTES);
    }

    public Map<String, String> createCaptcha() throws IOException {
        CaptchaUtil.CaptchaResult captcha = CaptchaUtil.generateCaptcha();
        String id = UUID.randomUUID().toString();
        
        // Store code (case insensitive)
        captchaStore.put(id, captcha.getCode().toLowerCase());
        captchaExpiry.put(id, System.currentTimeMillis() + 5 * 60 * 1000); // 5 mins

        // Convert image to Base64
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        ImageIO.write(captcha.getImage(), "png", os);
        String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(os.toByteArray());

        return Map.of("captchaId", id, "imageBase64", base64Image);
    }

    public boolean validateCaptcha(String id, String text) {
        if (id == null || text == null) return false;
        String stored = captchaStore.get(id);
        if (stored == null) return false;
        
        boolean valid = stored.equals(text.toLowerCase());
        if (valid) {
            captchaStore.remove(id); // One-time use
            captchaExpiry.remove(id);
        }
        return valid;
    }
}
