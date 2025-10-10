package com.bamikahub.inventorysystem.config;

import com.bamikahub.inventorysystem.dao.PermissionRepository;
import com.bamikahub.inventorysystem.dao.RoleRepository;
import com.bamikahub.inventorysystem.dao.StatusRepository;
import com.bamikahub.inventorysystem.dao.UserRepository;
import com.bamikahub.inventorysystem.models.Permission;
import com.bamikahub.inventorysystem.models.Role;
import com.bamikahub.inventorysystem.models.Status;
import com.bamikahub.inventorysystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private StatusRepository statusRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // Step 1: Initialize all core system statuses if they don't exist.
        // This runs independently to ensure statuses are always available.
        initializeStatuses();

        // Step 2: Initialize roles, permissions, and the admin user ONLY if no users exist.
        // This prevents the initializer from running again on subsequent startups.
        if (userRepository.count() == 0) {
            System.out.println("No users found. Initializing default roles, permissions, and admin user...");

            // Create Permissions
            List<String> permissionNames = Arrays.asList(
                    "USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE", "USER_APPROVE",
                    "ROLE_CREATE", "ROLE_READ", "ROLE_UPDATE", "ROLE_DELETE",
                    "ITEM_CREATE", "ITEM_READ", "ITEM_UPDATE", "ITEM_DELETE",
                    "SUPPLIER_CREATE", "SUPPLIER_READ", "SUPPLIER_UPDATE", "SUPPLIER_DELETE"
            );
            List<Permission> allPermissions = permissionNames.stream().map(this::createPermission).collect(Collectors.toList());

            // Create Roles and assign permissions
            createRole("Admin", new HashSet<>(allPermissions));

            Set<Permission> managerPermissions = allPermissions.stream()
                    .filter(p -> !p.getName().startsWith("ROLE_"))
                    .collect(Collectors.toSet());
            createRole("Manager", managerPermissions);

            Set<Permission> staffPermissions = allPermissions.stream()
                    .filter(p -> p.getName().endsWith("_READ") || p.getName().equals("ITEM_UPDATE"))
                    .collect(Collectors.toSet());
            createRole("Staff", staffPermissions);

            // Create Admin User
            Role adminRole = roleRepository.findByName("Admin").orElseThrow(() -> new RuntimeException("CRITICAL: Admin role not found during initialization."));
            Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("CRITICAL: ACTIVE status not found during initialization."));

            User admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setUsername("admin");
            admin.setEmail("admin@bamikahub.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(adminRole);
            admin.setStatus(activeStatus);
            userRepository.save(admin);

            System.out.println("Default data initialization complete.");
        }
    }

    private void initializeStatuses() {
        // Use a helper method to keep the run() method clean
        createStatus("PENDING", "#FFC107");
        createStatus("ACTIVE", "#28A745");
        createStatus("SUSPENDED", "#DC3545");
        createStatus("DEACTIVATED", "#6c757d");
    }

    private Status createStatus(String name, String color) {
        // findByName().orElseGet() is a clean way to "create if not exists"
        return statusRepository.findByName(name).orElseGet(() -> {
            System.out.println("Creating status: " + name);
            Status newStatus = new Status();
            newStatus.setName(name);
            newStatus.setColor(color);
            return statusRepository.save(newStatus);
        });
    }

    private Permission createPermission(String name) {
        // Assuming permissions are created from scratch every time this block runs
        Permission permission = new Permission();
        permission.setName(name);
        return permissionRepository.save(permission);
    }

    private void createRole(String name, Set<Permission> permissions) {
        // Assuming roles are created from scratch every time this block runs
        Role role = new Role();
        role.setName(name);
        role.setPermissions(permissions);
        roleRepository.save(role);
    }
}