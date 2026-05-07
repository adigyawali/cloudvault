package com.cloudvault.service;

import com.cloudvault.exception.InvalidTokenException;
import com.cloudvault.model.PasswordResetToken;
import com.cloudvault.model.User;
import com.cloudvault.repository.PasswordResetTokenRepository;
import com.cloudvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    @Value("${cloudvault.reset.token-ttl-minutes}")
    private long ttlMinutes;

    @Value("${cloudvault.app.base-url}")
    private String appBaseUrl;

    /**
     * Issue a reset link for the given email. Always returns successfully — even
     * if the email isn't registered — so the response can't be used to enumerate
     * which emails have accounts.
     */
    @Transactional
    public void requestReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return;
        }
        User user = userOpt.get();

        // Invalidate any outstanding tokens — only one active link at a time.
        tokenRepository.deleteByUserId(user.getId());

        Duration ttl = Duration.ofMinutes(ttlMinutes);
        String token = UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken entity = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plus(ttl))
                .used(false)
                .build();
        tokenRepository.save(entity);

        String link = appBaseUrl + "/reset?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        mailService.sendPasswordResetEmail(user.getEmail(), link, ttl);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new InvalidTokenException("Password must be at least 8 characters");
        }

        PasswordResetToken rt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset link"));

        if (rt.isUsed()) {
            throw new InvalidTokenException("This reset link has already been used");
        }
        if (rt.isExpired()) {
            throw new InvalidTokenException("This reset link has expired");
        }

        User user = rt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        rt.setUsed(true);
        tokenRepository.save(rt);

        log.info("Password reset for user {}", user.getEmail());
    }
}
