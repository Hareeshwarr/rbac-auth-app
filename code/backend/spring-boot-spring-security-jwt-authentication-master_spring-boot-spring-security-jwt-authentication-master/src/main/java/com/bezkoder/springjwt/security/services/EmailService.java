package com.bezkoder.springjwt.security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

  @Autowired
  private JavaMailSender mailSender;

  @Value("${spring.mail.username:noreply@example.com}")
  private String fromEmail;

  @Value("${app.frontend.url:http://localhost:5173}")
  private String frontendUrl;

  public void sendPasswordResetEmail(String toEmail, String token) {
    String resetLink = frontendUrl + "/reset-password?token=" + token;

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromEmail);
    message.setTo(toEmail);
    message.setSubject("Password Reset Request - RBAC Auth");
    message.setText(
        "You requested a password reset.\n\n" +
        "Click the link below to reset your password:\n" +
        resetLink + "\n\n" +
        "This link expires in 30 minutes.\n\n" +
        "If you did not request this, please ignore this email."
    );

    try {
      mailSender.send(message);
      logger.info("Password reset email sent to {}", toEmail);
    } catch (Exception e) {
      logger.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
      throw new RuntimeException("Failed to send email. Please try again later.");
    }
  }
}
