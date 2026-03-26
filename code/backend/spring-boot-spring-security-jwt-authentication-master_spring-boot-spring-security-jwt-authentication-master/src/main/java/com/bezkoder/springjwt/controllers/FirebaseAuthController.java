package com.bezkoder.springjwt.controllers;

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
   * Returns isNewUser=true if this is a first-time social/phone login.
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
   * Complete profile for new social/phone users.
   * Sets their chosen username and role.
   */
  @PostMapping("/complete-profile")
  public ResponseEntity<?> completeProfile(@RequestBody Map<String, String> request) {
    String token = request.get("token");
    String username = request.get("username");
    String role = request.get("role");
    String email = request.get("email");

    if (username == null || username.trim().length() < 3 || username.length() > 20) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Username must be between 3 and 20 characters."));
    }

    // Get user from JWT token
    if (token == null || token.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Token is required."));
    }

    String tokenUsername;
    try {
      tokenUsername = jwtUtils.getUserNameFromJwtToken(token);
    } catch (Exception e) {
      return ResponseEntity.status(401)
          .body(new MessageResponse("Invalid token."));
    }

    var userOpt = userRepository.findByUsername(tokenUsername);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("User not found."));
    }

    User user = userOpt.get();

    // Check if new username is taken (if different from current)
    if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Username is already taken!"));
    }

    // Update username
    user.setUsername(username);

    // Update email if provided (for phone users)
    if (email != null && !email.isEmpty() && !email.equals(user.getEmail())) {
      if (userRepository.existsByEmail(email)) {
        return ResponseEntity.badRequest()
            .body(new MessageResponse("Error: Email is already in use!"));
      }
      user.setEmail(email);
    }

    // Update role
    if (role != null) {
      Set<Role> roles = new HashSet<>();
      switch (role) {
        case "admin":
          Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
          roles.add(adminRole);
          break;
        case "mod":
          Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
          roles.add(modRole);
          break;
        default:
          Role userRole = roleRepository.findByName(ERole.ROLE_USER)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
          roles.add(userRole);
      }
      user.setRoles(roles);
    }

    userRepository.save(user);

    // Generate new JWT with updated username
    String jwt = jwtUtils.generateJwtTokenFromUsername(user.getUsername());

    List<String> roleNames = user.getRoles().stream()
        .map(r -> r.getName().name())
        .collect(Collectors.toList());

    return ResponseEntity.ok(new JwtResponse(jwt,
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        roleNames,
        false));
  }

  /**
   * Phone-based password reset.
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

    boolean isNewUser = false;

    // Try to find existing user by Firebase UID
    var userOpt = userRepository.findByFirebaseUid(firebaseUid);

    User user;
    if (userOpt.isPresent()) {
      user = userOpt.get();
      if (phone != null && user.getPhoneNumber() == null) {
        user.setPhoneNumber(phone);
        userRepository.save(user);
      }
    } else {
      // Try to find by email
      if (email != null) {
        var emailUserOpt = userRepository.findByEmail(email);
        if (emailUserOpt.isPresent()) {
          user = emailUserOpt.get();
          user.setFirebaseUid(firebaseUid);
          if (phone != null) user.setPhoneNumber(phone);
          if (authProvider != null) user.setAuthProvider(authProvider);
          userRepository.save(user);
        } else {
          user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
          isNewUser = true;
        }
      } else if (phone != null) {
        var phoneUserOpt = userRepository.findByPhoneNumber(phone);
        if (phoneUserOpt.isPresent()) {
          user = phoneUserOpt.get();
          user.setFirebaseUid(firebaseUid);
          userRepository.save(user);
        } else {
          user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
          isNewUser = true;
        }
      } else {
        user = createNewFirebaseUser(firebaseUid, email, displayName, phone, authProvider);
        isNewUser = true;
      }
    }

    String jwt = jwtUtils.generateJwtTokenFromUsername(user.getUsername());

    List<String> roles = user.getRoles().stream()
        .map(role -> role.getName().name())
        .collect(Collectors.toList());

    return ResponseEntity.ok(new JwtResponse(jwt,
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        roles,
        isNewUser));
  }

  private User createNewFirebaseUser(String firebaseUid, String email,
      String displayName, String phone, String authProvider) {

    String username = "temp_" + UUID.randomUUID().toString().substring(0, 8);

    if (email == null || email.isEmpty()) {
      email = username + "@phone.local";
    }

    if (userRepository.existsByEmail(email)) {
      email = username + "." + UUID.randomUUID().toString().substring(0, 4) + "@phone.local";
    }

    User user = new User(username, email, encoder.encode(UUID.randomUUID().toString()));
    user.setFirebaseUid(firebaseUid);
    user.setAuthProvider(authProvider != null ? authProvider : "firebase");
    if (phone != null) user.setPhoneNumber(phone);

    Set<Role> roles = new HashSet<>();
    Role userRole = roleRepository.findByName(ERole.ROLE_USER)
        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
    roles.add(userRole);
    user.setRoles(roles);

    return userRepository.save(user);
  }
}
