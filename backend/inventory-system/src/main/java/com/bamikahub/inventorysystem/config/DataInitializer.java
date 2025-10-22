package com.bamikahub.inventorysystem.config;

import com.bamikahub.inventorysystem.dao.support.TicketCategoryRepository;
import com.bamikahub.inventorysystem.dao.user.PermissionRepository;
import com.bamikahub.inventorysystem.dao.user.RoleRepository;
import com.bamikahub.inventorysystem.dao.user.StatusRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.models.support.TicketCategory;
import com.bamikahub.inventorysystem.models.user.Permission;
import com.bamikahub.inventorysystem.models.user.Role;
import com.bamikahub.inventorysystem.models.user.Status;
import com.bamikahub.inventorysystem.models.user.User;
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
    @Autowired private TicketCategoryRepository ticketCategoryRepository;

    @Override
    public void run(String... args) throws Exception {

        // Step 1: Initialize all core system statuses if they don't exist.
        initializeStatuses();
        initializeTicketCategories();

    List<String> permissionNames = Arrays.asList(
        // User & Role Management
        "USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE", "USER_APPROVE",
        "ROLE_CREATE", "ROLE_READ", "ROLE_UPDATE", "ROLE_DELETE",
        // Inventory Management
        "ITEM_CREATE", "ITEM_READ", "ITEM_UPDATE", "ITEM_DELETE",
        "SUPPLIER_CREATE", "SUPPLIER_READ", "SUPPLIER_UPDATE", "SUPPLIER_DELETE",
        // Operations Management (Future)
        "PROJECT_CREATE", "PROJECT_READ", "PROJECT_UPDATE", "PROJECT_DELETE", "PROJECT_ASSIGN",
        "FIELD_REPORT_SUBMIT", "FIELD_REPORT_READ",
        // Finance Management (Future)
        "REQUISITION_CREATE", "REQUISITION_APPROVE", "FINANCE_READ",
        // Technical Support (Future)
        "TICKET_CREATE", "TICKET_MANAGE", "TICKET_COMMENT", "TICKET_ASSIGN", "TICKET_RESOLVE", "TICKET_CLOSE", "TICKET_ARCHIVE",
        // Audit Trail
        "AUDIT_READ", "AUDIT_EXPORT",
        // Notifications
        "NOTIFICATION_SEND"
    );

    permissionNames.forEach(this::createPermissionIfNotFound);

        // Step 2: Initialize roles, permissions, and the admin user ONLY if no users exist.
        if (userRepository.count() == 0) {
            System.out.println("No users found. Initializing default roles, permissions, and admin user...");

            List<Permission> allPermissions = permissionNames.stream().map(this::createPermissionIfNotFound).collect(Collectors.toList());
            Set<Permission> allPermissionsSet = new HashSet<>(allPermissions);

            // Create new, specific roles based on the concept note
            createRole("Admin", allPermissionsSet);

            createRole("Finance Manager", filterPermissions(allPermissionsSet, "FINANCE_READ", "REQUISITION_APPROVE"));

            createRole("Inventory & Operations Manager", filterPermissions(allPermissionsSet, "ITEM_", "SUPPLIER_", "PROJECT_", "FIELD_REPORT_READ"));

            createRole("Field Engineer (Civil)", filterPermissions(allPermissionsSet, "ITEM_READ", "FIELD_REPORT_SUBMIT", "REQUISITION_CREATE"));

            createRole("Technical Support IT", filterPermissions(allPermissionsSet, "TICKET_MANAGE", "USER_READ"));


            // Create the primary Admin User
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

    private void initializeTicketCategories() {
        Arrays.asList("SYSTEM_ISSUE", "EQUIPMENT_FAULT", "NETWORK_PROBLEM", "MAINTENANCE_REQUEST", "GENERAL_INQUIRY", "OTHER")
                .forEach(this::createTicketCategoryIfNotFound);
    }

    private void createTicketCategoryIfNotFound(String name) {
        ticketCategoryRepository.findByName(name).orElseGet(() ->
                ticketCategoryRepository.save(new TicketCategory(name))
        );
    }

    // Helper to filter permissions by prefixes or exact names
    private Set<Permission> filterPermissions(Set<Permission> allPermissions, String... namesOrPrefixes) {
        return allPermissions.stream()
                .filter(p -> Arrays.stream(namesOrPrefixes).anyMatch(prefix -> p.getName().startsWith(prefix)))
                .collect(Collectors.toSet());
    }

    private void initializeStatuses() {
        createStatus("PENDING", "#FFC107");
        createStatus("ACTIVE", "#28A745");
        createStatus("SUSPENDED", "#DC3545");
        createStatus("DEACTIVATED", "#6c757d");
    }

    private Status createStatus(String name, String color) {
        return statusRepository.findByName(name).orElseGet(() -> {
            System.out.println("Creating status: " + name);
            Status newStatus = new Status();
            newStatus.setName(name);
            newStatus.setColor(color);
            return statusRepository.save(newStatus);
        });
    }

    private Permission createPermissionIfNotFound(String name) {
        return permissionRepository.findByName(name).orElseGet(() -> {
            Permission permission = new Permission();
            permission.setName(name);
            return permissionRepository.save(permission);
        });
    }

    private void createRole(String name, Set<Permission> permissions) {
        roleRepository.findByName(name).orElseGet(() -> {
            System.out.println("Creating role: " + name);
            Role role = new Role();
            role.setName(name);
            role.setPermissions(permissions);
            return roleRepository.save(role);
        });
    }
}