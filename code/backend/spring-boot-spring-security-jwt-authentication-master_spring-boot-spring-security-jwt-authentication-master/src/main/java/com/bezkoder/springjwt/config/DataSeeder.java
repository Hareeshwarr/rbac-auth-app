package com.bezkoder.springjwt.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.bezkoder.springjwt.models.ERole;
import com.bezkoder.springjwt.models.Role;
import com.bezkoder.springjwt.repository.RoleRepository;

@Component
public class DataSeeder implements ApplicationRunner {

  private final RoleRepository roleRepository;

  public DataSeeder(RoleRepository roleRepository) {
    this.roleRepository = roleRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    for (ERole roleName : ERole.values()) {
      roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));
    }
  }
}
