package com.dormitory.util;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.Random;

public class CaptchaUtil {
    
    public static class CaptchaResult {
        private final String code;
        private final BufferedImage image;

        public CaptchaResult(String code, BufferedImage image) {
            this.code = code;
            this.image = image;
        }

        public String getCode() {
            return code;
        }

        public BufferedImage getImage() {
            return image;
        }
    }

    public static CaptchaResult generateCaptcha() {
        int width = 160;
        int height = 50;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Background
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);

        // Random Code
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        g.setFont(new Font("Arial", Font.BOLD, 30));

        for (int i = 0; i < 5; i++) {
            String charStr = String.valueOf(chars.charAt(random.nextInt(chars.length())));
            sb.append(charStr);
            g.setColor(new Color(random.nextInt(150), random.nextInt(150), random.nextInt(150)));
            g.drawString(charStr, 20 + i * 25, 35);
        }

        // Noise
        for (int i = 0; i < 10; i++) {
            g.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            g.drawLine(random.nextInt(width), random.nextInt(height), random.nextInt(width), random.nextInt(height));
        }

        g.dispose();
        return new CaptchaResult(sb.toString(), image);
    }
}
