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

  /**
   * Sends a password reset OTP email. Returns true if sent successfully, false otherwise.
   */
  public boolean sendPasswordResetOtp(String toEmail, String otp) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromEmail);
    message.setTo(toEmail);
    message.setSubject("Password Reset OTP - RBAC Auth");
    message.setText(
        "You requested a password reset.\n\n" +
        "Your OTP code is: " + otp + "\n\n" +
        "This code expires in 10 minutes.\n\n" +
        "If you did not request this, please ignore this email."
    );

    try {
      mailSender.send(message);
      logger.info("Password reset OTP email sent to {}", toEmail);
      return true;
    } catch (Exception e) {
      logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
      return false;
    }
  }
}
