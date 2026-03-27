package com.bezkoder.springjwt.controllers;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.bezkoder.springjwt.models.ERole;
import com.bezkoder.springjwt.models.Role;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.payload.response.MessageResponse;
import com.bezkoder.springjwt.repository.RoleRepository;
import com.bezkoder.springjwt.repository.UserRepository;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  @Autowired
  UserRepository userRepository;

  @Autowired
  RoleRepository roleRepository;

  @Autowired
  PasswordEncoder encoder;

  // Get all users
  @GetMapping("/users")
  public ResponseEntity<?> getAllUsers() {
    List<User> users = userRepository.findAll();
    List<Map<String, Object>> result = users.stream().map(user -> {
      Map<String, Object> map = new HashMap<>();
      map.put("id", user.getId());
      map.put("username", user.getUsername());
      map.put("email", user.getEmail());
      map.put("phoneNumber", user.getPhoneNumber());
      map.put("authProvider", user.getAuthProvider());
      map.put("roles", user.getRoles().stream()
          .map(r -> r.getName().name())
          .collect(Collectors.toList()));
      return map;
    }).collect(Collectors.toList());

    return ResponseEntity.ok(result);
  }

  // Get system stats
  @GetMapping("/stats")
  public ResponseEntity<?> getStats() {
    List<User> users = userRepository.findAll();

    long totalUsers = users.size();
    long adminCount = users.stream()
        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_ADMIN))
        .count();
    long modCount = users.stream()
        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_MODERATOR))
        .count();
    long studentCount = users.stream()
        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_USER))
        .count();
    long googleUsers = users.stream()
        .filter(u -> "google".equals(u.getAuthProvider()))
        .count();
    long phoneUsers = users.stream()
        .filter(u -> "phone".equals(u.getAuthProvider()))
        .count();
    long localUsers = users.stream()
        .filter(u -> u.getAuthProvider() == null || "local".equals(u.getAuthProvider()))
        .count();

    Map<String, Object> stats = new HashMap<>();
    stats.put("totalUsers", totalUsers);
    stats.put("adminCount", adminCount);
    stats.put("modCount", modCount);
    stats.put("studentCount", studentCount);
    stats.put("googleUsers", googleUsers);
    stats.put("phoneUsers", phoneUsers);
    stats.put("localUsers", localUsers);

    return ResponseEntity.ok(stats);
  }

  // Change user role
  @PutMapping("/users/{id}/role")
  public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
    String newRole = request.get("role");

    Optional<User> userOpt = userRepository.findById(id);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
    }

    User user = userOpt.get();
    Set<Role> roles = new HashSet<>();

    switch (newRole) {
      case "admin":
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
            .orElseThrow(() -> new RuntimeException("Error: Role not found."));
        roles.add(adminRole);
        break;
      case "mod":
        Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
            .orElseThrow(() -> new RuntimeException("Error: Role not found."));
        roles.add(modRole);
        break;
      default:
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
            .orElseThrow(() -> new RuntimeException("Error: Role not found."));
        roles.add(userRole);
    }

    user.setRoles(roles);
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("Role updated successfully!"));
  }

  // Delete user
  @DeleteMapping("/users/{id}")
  public ResponseEntity<?> deleteUser(@PathVariable Long id) {
    Optional<User> userOpt = userRepository.findById(id);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
    }

    userRepository.deleteById(id);
    return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
  }
}
