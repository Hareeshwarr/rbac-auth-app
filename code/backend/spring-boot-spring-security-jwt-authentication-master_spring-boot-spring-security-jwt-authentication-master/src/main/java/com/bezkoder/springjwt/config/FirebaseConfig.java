package com.bezkoder.springjwt.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {
  private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

  @Value("${firebase.service.account:}")
  private String firebaseServiceAccount;

  @PostConstruct
  public void initialize() {
    try {
      if (FirebaseApp.getApps().isEmpty()) {
        if (firebaseServiceAccount != null && !firebaseServiceAccount.isEmpty()) {
          // Decode base64 service account JSON
          byte[] decoded = Base64.getDecoder().decode(firebaseServiceAccount);
          GoogleCredentials credentials = GoogleCredentials
              .fromStream(new ByteArrayInputStream(decoded));

          FirebaseOptions options = FirebaseOptions.builder()
              .setCredentials(credentials)
              .build();

          FirebaseApp.initializeApp(options);
          logger.info("Firebase Admin SDK initialized with service account");
        } else {
          // Initialize with default credentials (for local dev)
          try {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build();
            FirebaseApp.initializeApp(options);
            logger.info("Firebase Admin SDK initialized with default credentials");
          } catch (Exception e) {
            logger.warn("Firebase Admin SDK not initialized - no credentials found. " +
                "Firebase auth features will be disabled.");
          }
        }
      }
    } catch (Exception e) {
      logger.error("Failed to initialize Firebase: {}", e.getMessage());
    }
  }
}
