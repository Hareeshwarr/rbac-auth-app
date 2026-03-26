package com.bezkoder.springjwt.controllers;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bezkoder.springjwt.models.ERole;
import com.bezkoder.springjwt.models.Role;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.models.PasswordResetToken;
import com.bezkoder.springjwt.payload.request.ForgotPasswordRequest;
import com.bezkoder.springjwt.payload.request.LoginRequest;
import com.bezkoder.springjwt.payload.request.ResetPasswordRequest;
import com.bezkoder.springjwt.payload.request.SignupRequest;
import com.bezkoder.springjwt.payload.response.JwtResponse;
import com.bezkoder.springjwt.payload.response.MessageResponse;
import com.bezkoder.springjwt.repository.PasswordResetTokenRepository;
import com.bezkoder.springjwt.repository.RoleRepository;
import com.bezkoder.springjwt.repository.UserRepository;
import com.bezkoder.springjwt.security.jwt.JwtUtils;
import com.bezkoder.springjwt.security.services.EmailService;
import com.bezkoder.springjwt.security.services.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;

  @Autowired
  RoleRepository roleRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @Autowired
  PasswordResetTokenRepository passwordResetTokenRepository;

  @Autowired
  EmailService emailService;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

    SecurityContextHolder.getContext().setAuthentication(authentication);
    String jwt = jwtUtils.generateJwtToken(authentication);
    
    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
    List<String> roles = userDetails.getAuthorities().stream()
        .map(item -> item.getAuthority())
        .collect(Collectors.toList());

    return ResponseEntity.ok(new JwtResponse(jwt, 
                         userDetails.getId(), 
                         userDetails.getUsername(), 
                         userDetails.getEmail(), 
                         roles));
  }

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
    if (userRepository.existsByUsername(signUpRequest.getUsername())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Username is already taken!"));
    }

    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    // Create new user's account
    User user = new User(signUpRequest.getUsername(), 
               signUpRequest.getEmail(),
               encoder.encode(signUpRequest.getPassword()));

    Set<String> strRoles = signUpRequest.getRole();
    Set<Role> roles = new HashSet<>();

    if (strRoles == null) {
      Role userRole = roleRepository.findByName(ERole.ROLE_USER)
          .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
      roles.add(userRole);
    } else {
      strRoles.forEach(role -> {
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
      });
    }

    user.setRoles(roles);
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return userRepository.findByEmail(request.getEmail())
        .map(user -> {
          // Delete any existing token for this user
          passwordResetTokenRepository.deleteByUser(user);

          // Generate 6-digit OTP (10 min expiry)
          String otp = String.format("%06d", new Random().nextInt(999999));
          PasswordResetToken resetToken = new PasswordResetToken(
              otp, user, Instant.now().plusSeconds(600));
          passwordResetTokenRepository.save(resetToken);

          // Try to send email
          boolean emailSent = emailService.sendPasswordResetOtp(user.getEmail(), otp);

          Map<String, Object> response = new HashMap<>();
          response.put("message", "OTP has been generated for your account.");
          response.put("emailSent", emailSent);
          if (!emailSent) {
            // If email fails (e.g., on free hosting), include OTP in response for demo
            response.put("otp", otp);
            response.put("note", "Email service unavailable. Use the OTP shown on screen.");
          }

          return ResponseEntity.ok(response);
        })
        .orElse(ResponseEntity.ok(new MessageResponse(
            "If an account with that email exists, an OTP has been sent.")));
  }

  @PostMapping("/verify-otp")
  public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String otp = request.get("otp");

    if (email == null || otp == null) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Email and OTP are required."));
    }

    return passwordResetTokenRepository.findByToken(otp)
        .map(resetToken -> {
          if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("OTP has expired. Please request a new one."));
          }

          if (!resetToken.getUser().getEmail().equals(email)) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Invalid OTP for this email."));
          }

          Map<String, Object> response = new HashMap<>();
          response.put("message", "OTP verified successfully.");
          response.put("valid", true);
          return ResponseEntity.ok(response);
        })
        .orElse(ResponseEntity.badRequest()
            .body(new MessageResponse("Invalid OTP.")));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String otp = request.get("otp");
    String newPassword = request.get("newPassword");

    if (email == null || otp == null || newPassword == null) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Email, OTP, and new password are required."));
    }

    if (newPassword.length() < 6 || newPassword.length() > 40) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Password must be 6-40 characters."));
    }

    return passwordResetTokenRepository.findByToken(otp)
        .map(resetToken -> {
          if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("OTP has expired. Please request a new one."));
          }

          if (!resetToken.getUser().getEmail().equals(email)) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Invalid OTP for this email."));
          }

          User user = resetToken.getUser();
          user.setPassword(encoder.encode(newPassword));
          userRepository.save(user);
          passwordResetTokenRepository.delete(resetToken);

          return ResponseEntity.ok(new MessageResponse("Password reset successfully!"));
        })
        .orElse(ResponseEntity.badRequest()
            .body(new MessageResponse("Invalid OTP.")));
  }
}
