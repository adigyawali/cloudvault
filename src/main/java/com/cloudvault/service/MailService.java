package com.cloudvault.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${cloudvault.mail.from}")
    private String from;

    @Value("${cloudvault.mail.from-name}")
    private String fromName;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    public void sendPasswordResetEmail(String to, String resetLink, Duration ttl) {
        // If SMTP isn't configured, log the link so dev can still test the flow
        // without standing up an SMTP server.
        if (smtpHost == null || smtpHost.isBlank()) {
            log.warn("SMTP host not configured; skipping email. Reset link for {}: {}", to, resetLink);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject("Reset your CloudVault password");

            long minutes = Math.max(1, ttl.toMinutes());
            helper.setText(buildPlainText(resetLink, minutes), buildHtml(resetLink, minutes));

            mailSender.send(message);
            log.info("Sent password reset email to {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            // Surface the link in logs so the dev flow is recoverable when SMTP is misconfigured
            log.error("Failed to send reset email to {}: {}. Link: {}", to, e.getMessage(), resetLink);
            throw new MailDeliveryException("Could not deliver reset email", e);
        }
    }

    private String buildPlainText(String link, long minutes) {
        return """
                Reset your CloudVault password

                We received a request to reset the password for your CloudVault account.
                If you made this request, follow the link below to choose a new password.
                The link will expire in %d minutes.

                %s

                If you didn't request a password reset, you can safely ignore this email —
                your password won't change.

                — The CloudVault team
                """.formatted(minutes, link);
    }

    private String buildHtml(String link, long minutes) {
        return """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:#faf7f2;font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1714;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:48px 16px;">
                      <tr>
                        <td align="center">
                          <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(30,26,22,0.08);border-radius:18px;overflow:hidden;">
                            <tr>
                              <td style="padding:32px 32px 8px 32px;">
                                <div style="display:inline-block;width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#6c4dff 0%%,#2db8e8 55%%,#ec5887 100%%);"></div>
                                <div style="margin-top:24px;font-family:'Space Grotesk',Inter,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#1a1714;">Reset your password</div>
                                <div style="margin-top:10px;font-size:14px;line-height:1.6;color:#4d4842;">
                                  We received a request to reset the password for your CloudVault account. If you made this request, click the button below. The link will expire in %d minutes.
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:24px 32px 8px 32px;">
                                <a href="%s" style="display:inline-block;padding:12px 22px;border-radius:12px;background:linear-gradient(180deg,#7d61ff 0%%,#6c4dff 100%%);color:#ffffff;font-weight:540;font-size:14px;text-decoration:none;letter-spacing:-0.01em;">Reset password</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 32px 28px 32px;">
                                <div style="font-size:12.5px;color:#847d73;line-height:1.6;">
                                  Or paste this link into your browser:<br/>
                                  <span style="word-break:break-all;color:#4d4842;">%s</span>
                                </div>
                                <hr style="margin:24px 0;border:none;border-top:1px solid rgba(30,26,22,0.08);" />
                                <div style="font-size:12px;color:#847d73;line-height:1.6;">
                                  Didn't request this? You can safely ignore this email — your password won't change.
                                </div>
                              </td>
                            </tr>
                          </table>
                          <div style="margin-top:18px;font-size:11px;color:#b6b0a6;font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:0.06em;text-transform:uppercase;">
                            CloudVault · sent securely
                          </div>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(minutes, link, link);
    }

    public static class MailDeliveryException extends RuntimeException {
        public MailDeliveryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
