package com.bezkoder.springjwt.models;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String token;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private Instant expiryDate;

  public PasswordResetToken() {}

  public PasswordResetToken(String token, User user, Instant expiryDate) {
    this.token = token;
    this.user = user;
    this.expiryDate = expiryDate;
  }

  public Long getId() { return id; }
  public String getToken() { return token; }
  public User getUser() { return user; }
  public Instant getExpiryDate() { return expiryDate; }

  public boolean isExpired() {
    return Instant.now().isAfter(this.expiryDate);
  }
}
