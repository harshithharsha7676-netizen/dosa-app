package com.dosa.ordering.controller;

import com.dosa.ordering.config.SessionAuthFilter;
import com.dosa.ordering.dto.DTOs;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    // In-memory OTP store: phone -> {otp, expiry}
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<DTOs.LoginResponse> login(
            @RequestBody DTOs.LoginRequest request,
            HttpServletRequest httpRequest) {

        if (adminUsername.equals(request.getUsername())
                && adminPassword.equals(request.getPassword())) {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(SessionAuthFilter.SESSION_KEY, true);
            session.setAttribute("ADMIN_USERNAME", request.getUsername());
            session.setMaxInactiveInterval(8 * 60 * 60);
            return ResponseEntity.ok(new DTOs.LoginResponse(true, "Login successful", request.getUsername()));
        }
        return ResponseEntity.status(401).body(new DTOs.LoginResponse(false, "Invalid username or password", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> check(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        boolean loggedIn = session != null && Boolean.TRUE.equals(session.getAttribute(SessionAuthFilter.SESSION_KEY));
        String username = loggedIn ? (String) session.getAttribute("ADMIN_USERNAME") : null;
        return ResponseEntity.ok(Map.of("loggedIn", loggedIn, "username", username != null ? username : ""));
    }

    // ── OTP: Generate & send via WhatsApp ───────────────────────
    // Frontend opens WhatsApp with the OTP message - no API needed
    @PostMapping("/otp/generate")
    public ResponseEntity<Map<String, Object>> generateOtp(@RequestBody Map<String, String> body) {
        String phone = body.getOrDefault("phone", "").trim();
        if (phone.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Phone required"));

        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        otpStore.put(phone, new OtpEntry(otp, System.currentTimeMillis() + 5 * 60 * 1000)); // 5 min expiry

        // Return the OTP so frontend can open WhatsApp with it
        return ResponseEntity.ok(Map.of("otp", otp, "phone", phone, "message",
            "OTP generated. Frontend will open WhatsApp to send it."));
    }

    // ── OTP: Verify ─────────────────────────────────────────────
    @PostMapping("/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        String phone = body.getOrDefault("phone", "").trim();
        String otp   = body.getOrDefault("otp", "").trim();
        OtpEntry entry = otpStore.get(phone);

        if (entry == null) return ResponseEntity.ok(Map.of("valid", false, "reason", "No OTP generated"));
        if (System.currentTimeMillis() > entry.expiry) {
            otpStore.remove(phone);
            return ResponseEntity.ok(Map.of("valid", false, "reason", "OTP expired"));
        }
        if (!entry.otp.equals(otp)) return ResponseEntity.ok(Map.of("valid", false, "reason", "Wrong OTP"));

        otpStore.remove(phone);
        return ResponseEntity.ok(Map.of("valid", true));
    }

    // ── Change password (requires OTP verification first) ────────
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body) {
        String newPassword = body.getOrDefault("newPassword", "").trim();
        if (newPassword.length() < 4) return ResponseEntity.badRequest().body(Map.of("error", "Password too short"));
        this.adminPassword = newPassword;
        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }

    static class OtpEntry {
        String otp; long expiry;
        OtpEntry(String otp, long expiry) { this.otp = otp; this.expiry = expiry; }
    }
}
