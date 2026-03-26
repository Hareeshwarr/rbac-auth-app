package com.bezkoder.springjwt.security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {
  private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

  @Value("${resend.api.key:}")
  private String resendApiKey;

  /**
   * Sends a password reset OTP email via Resend HTTP API.
   * Returns true if sent successfully, false otherwise.
   */
  public boolean sendPasswordResetOtp(String toEmail, String otp) {
    if (resendApiKey == null || resendApiKey.isEmpty()) {
      logger.error("Resend API key not configured");
      return false;
    }

    String jsonBody = String.format(
        "{\"from\":\"RBAC Auth <onboarding@resend.dev>\","
        + "\"to\":[\"%s\"],"
        + "\"subject\":\"Password Reset OTP - RBAC Auth\","
        + "\"html\":\"<div style='font-family:Arial,sans-serif;padding:20px'>"
        + "<h2 style='color:#6c63ff'>Password Reset</h2>"
        + "<p>You requested a password reset.</p>"
        + "<div style='background:#f4f4f4;padding:20px;border-radius:8px;text-align:center;margin:20px 0'>"
        + "<p style='margin:0;color:#666;font-size:14px'>Your OTP Code</p>"
        + "<h1 style='color:#6c63ff;letter-spacing:8px;margin:10px 0'>%s</h1>"
        + "</div>"
        + "<p>This code expires in <strong>10 minutes</strong>.</p>"
        + "<p style='color:#999;font-size:12px'>If you did not request this, please ignore this email.</p>"
        + "</div>\"}",
        toEmail, otp
    );

    try {
      HttpClient client = HttpClient.newHttpClient();
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.resend.com/emails"))
          .header("Authorization", "Bearer " + resendApiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
          .build();

      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() == 200) {
        logger.info("Password reset OTP email sent to {} via Resend", toEmail);
        return true;
      } else {
        logger.error("Resend API error ({}): {}", response.statusCode(), response.body());
        return false;
      }
    } catch (Exception e) {
      logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
      return false;
    }
  }
}
