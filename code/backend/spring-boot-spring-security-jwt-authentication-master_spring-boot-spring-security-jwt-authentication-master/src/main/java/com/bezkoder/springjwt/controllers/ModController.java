package com.bezkoder.springjwt.controllers;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bezkoder.springjwt.models.ERole;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/mod")
@PreAuthorize("hasRole('MODERATOR')")
public class ModController {

  @Autowired
  UserRepository userRepository;

  // Get students only (moderators can manage students)
  @GetMapping("/users")
  public ResponseEntity<?> getStudents() {
    List<User> allUsers = userRepository.findAll();
    List<Map<String, Object>> result = allUsers.stream()
        .filter(u -> u.getRoles().stream().allMatch(r -> r.getName() == ERole.ROLE_USER))
        .map(user -> {
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

  // Delete a student (moderators can only delete ROLE_USER accounts)
  @DeleteMapping("/users/{id}")
  public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
    Optional<User> userOpt = userRepository.findById(id);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
    }

    User target = userOpt.get();
    boolean isStudent = target.getRoles().stream()
        .allMatch(r -> r.getName() == ERole.ROLE_USER);
    if (!isStudent) {
      return ResponseEntity.badRequest().body(Map.of("message", "Moderators can only remove User accounts."));
    }

    userRepository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "User removed successfully!"));
  }

  // Get moderator stats
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
}
