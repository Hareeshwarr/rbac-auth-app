package com.bezkoder.springjwt.controllers;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bezkoder.springjwt.models.ERole;
import com.bezkoder.springjwt.models.Role;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.payload.response.JwtResponse;
import com.bezkoder.springjwt.payload.response.MessageResponse;
import com.bezkoder.springjwt.repository.RoleRepository;
import com.bezkoder.springjwt.repository.UserRepository;
import com.bezkoder.springjwt.security.jwt.JwtUtils;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class FirebaseAuthController {
  private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthController.class);

  @Autowired
  UserRepository userRepository;

  @Autowired
  RoleRepository roleRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  /**
   * Firebase login/signup endpoint.
   * Verifies Firebase ID token, creates or finds local user, returns our JWT.
   * Works for both Google Sign-In and Phone OTP login.
   */
  @PostMapping("/firebase-login")
  public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> request) {
    String idToken = request.get("idToken");
    String authProvider = request.get("authProvider"); // "google" or "phone"

    if (idToken == null || idToken.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Firebase ID token is required."));
    }

    if (!FirebaseApp.getApps().isEmpty()) {
      // Firebase Admin SDK available - verify token server-side
      try {
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
        String firebaseUid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        String phone = decodedToken.getClaims().get("phone_number") != null
            ? decodedToken.getClaims().get("phone_number").toString() : null;

        return handleFirebaseUser(firebaseUid, email, name, phone, authProvider);
      } catch (Exception e) {
        logger.error("Firebase token verification failed: {}", e.getMessage());
        return ResponseEntity.status(401)
            .body(new MessageResponse("Invalid Firebase token: " + e.getMessage()));
      }
    } else {
      // Firebase Admin SDK not initialized - trust the frontend token data
      // This is less secure but works without service account
      String email = request.get("email");
      String displayName = request.get("displayName");
      String phone = request.get("phoneNumber");
      String firebaseUid = request.get("uid");

      if (firebaseUid == null || firebaseUid.isEmpty()) {
        return ResponseEntity.badRequest()
            .body(new MessageResponse("Firebase UID is required."));
      }

      return handleFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
    }
  }

  /**
   * Phone-based password reset.
   * After Firebase phone verification, allows resetting password.
   */
  @PostMapping("/phone-reset-password")
  public ResponseEntity<?> phoneResetPassword(@RequestBody Map<String, String> request) {
    String phoneNumber = request.get("phoneNumber");
    String newPassword = request.get("newPassword");
    String idToken = request.get("idToken");

    if (phoneNumber == null || newPassword == null) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Phone number and new password are required."));
    }

    if (newPassword.length() < 6 || newPassword.length() > 40) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Password must be 6-40 characters."));
    }

    // Verify Firebase token if available
    if (idToken != null && !FirebaseApp.getApps().isEmpty()) {
      try {
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
        String verifiedPhone = decodedToken.getClaims().get("phone_number") != null
            ? decodedToken.getClaims().get("phone_number").toString() : null;
        if (verifiedPhone == null || !verifiedPhone.equals(phoneNumber)) {
          return ResponseEntity.badRequest()
              .body(new MessageResponse("Phone number does not match verified token."));
        }
      } catch (Exception e) {
        return ResponseEntity.status(401)
            .body(new MessageResponse("Invalid Firebase token."));
      }
    }

    // Find user by phone number
    var userOpt = userRepository.findByPhoneNumber(phoneNumber);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("No account found with this phone number."));
    }

    User user = userOpt.get();
    user.setPassword(encoder.encode(newPassword));
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("Password reset successfully!"));
  }

  private ResponseEntity<?> handleFirebaseUser(String firebaseUid, String email,
      String displayName, String phone, String authProvider) {

    // Try to find existing user by Firebase UID
    var userOpt = userRepository.findByFirebaseUid(firebaseUid);

    User user;
    if (userOpt.isPresent()) {
      user = userOpt.get();
      // Update phone if provided and not set
      if (phone != null && user.getPhoneNumber() == null) {
        user.setPhoneNumber(phone);
        userRepository.save(user);
      }
    } else {
      // Try to find by email
      if (email != null) {
        var emailUserOpt = userRepository.findByEmail(email);
        if (emailUserOpt.isPresent()) {
          // Link Firebase account to existing user
          user = emailUserOpt.get();
          user.setFirebaseUid(firebaseUid);
          if (phone != null) user.setPhoneNumber(phone);
          if (authProvider != null) user.setAuthProvider(authProvider);
          userRepository.save(user);
        } else {
          user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
        }
      } else if (phone != null) {
        // Phone login - check by phone
        var phoneUserOpt = userRepository.findByPhoneNumber(phone);
        if (phoneUserOpt.isPresent()) {
          user = phoneUserOpt.get();
          user.setFirebaseUid(firebaseUid);
          userRepository.save(user);
        } else {
          user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
        }
      } else {
        user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
      }
    }

    // Generate our JWT token
    String jwt = jwtUtils.generateJwtTokenFromUsername(user.getUsername());

    List<String> roles = user.getRoles().stream()
        .map(role -> role.getName().name())
        .collect(Collectors.toList());

    return ResponseEntity.ok(new JwtResponse(jwt,
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        roles));
  }

  private User createNewFirebaseUser(String firebaseUid, String email,
      String displayName, String phone, String authProvider) {

    // Generate username from display name or email or phone
    String username;
    if (displayName != null && !displayName.isEmpty()) {
      username = displayName.replaceAll("[^a-zA-Z0-9]", "");
      if (username.length() > 20) username = username.substring(0, 20);
      if (username.length() < 3) username = username + UUID.randomUUID().toString().substring(0, 5);
    } else if (email != null) {
      username = email.split("@")[0];
      if (username.length() > 20) username = username.substring(0, 20);
    } else if (phone != null) {
      username = "user" + phone.replaceAll("[^0-9]", "").substring(
          Math.max(0, phone.replaceAll("[^0-9]", "").length() - 8));
    } else {
      username = "user" + UUID.randomUUID().toString().substring(0, 8);
    }

    // Ensure username is unique
    String baseUsername = username;
    int counter = 1;
    while (userRepository.existsByUsername(username)) {
      username = baseUsername + counter;
      if (username.length() > 20) {
        username = baseUsername.substring(0, 20 - String.valueOf(counter).length()) + counter;
      }
      counter++;
    }

    // Create email if null (for phone-only users)
    if (email == null || email.isEmpty()) {
      email = username + "@phone.local";
    }

    // Ensure email is unique
    if (userRepository.existsByEmail(email)) {
      email = username + "." + UUID.randomUUID().toString().substring(0, 4) + "@phone.local";
    }

    User user = new User(username, email, encoder.encode(UUID.randomUUID().toString()));
    user.setFirebaseUid(firebaseUid);
    user.setAuthProvider(authProvider != null ? authProvider : "firebase");
    if (phone != null) user.setPhoneNumber(phone);

    // Default role: USER
    Set<Role> roles = new HashSet<>();
    Role userRole = roleRepository.findByName(ERole.ROLE_USER)
        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
    roles.add(userRole);
    user.setRoles(roles);

    return userRepository.save(user);
  }
}
