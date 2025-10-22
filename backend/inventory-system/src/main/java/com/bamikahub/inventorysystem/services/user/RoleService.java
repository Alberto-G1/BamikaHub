package com.bamikahub.inventorysystem.services.user;

import com.bamikahub.inventorysystem.dao.user.PermissionRepository;
import com.bamikahub.inventorysystem.dao.user.RoleRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.inventory.GroupedPermissionsDto;
import com.bamikahub.inventorysystem.dto.user.RoleRequest;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.Permission;
import com.bamikahub.inventorysystem.models.user.Role;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public GroupedPermissionsDto getAllPermissions() {
        List<Permission> allPermissions = permissionRepository.findAll();

        // Group permissions by the part of the name before the first underscore "_"
        Map<String, List<Permission>> grouped = allPermissions.stream()
                .collect(Collectors.groupingBy(p -> {
                    String name = p.getName();
                    int underscoreIndex = name.indexOf('_');
                    return underscoreIndex > 0 ? name.substring(0, underscoreIndex) : "OTHER";
                }));

        return new GroupedPermissionsDto(grouped);
    }

    public Role getRoleById(Integer id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
    }
    @Transactional
    public Role createRole(RoleRequest roleRequest) {
        if (roleRepository.findByName(roleRequest.getName()).isPresent()) {
            throw new RuntimeException("Role with name '" + roleRequest.getName() + "' already exists.");
        }

        Role role = new Role();
        role.setName(roleRequest.getName());

        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(roleRequest.getPermissionIds()));
        role.setPermissions(permissions);
        Role savedRole = roleRepository.save(role);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("roleName", savedRole.getName());
                details.put("permissionIds", permissions.stream().map(Permission::getId).collect(Collectors.toSet()));
                details.put("permissionNames", permissions.stream().map(Permission::getName).collect(Collectors.toSet()));

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ROLE_CREATED,
                        "Role",
                        savedRole.getId() != null ? savedRole.getId().longValue() : null,
                        savedRole.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // audit logging must not break role creation
        }

        return savedRole;
    }

    @Transactional
    public Role updateRole(Integer id, RoleRequest roleRequest) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        String previousName = role.getName();
        Set<Permission> previousPermissions = new HashSet<>(role.getPermissions());

        role.setName(roleRequest.getName());
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(roleRequest.getPermissionIds()));
        role.setPermissions(permissions);
        Role updatedRole = roleRepository.save(role);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Set<String> previousPermissionNames = previousPermissions.stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet());
                Set<String> newPermissionNames = permissions.stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet());

                Set<String> addedPermissions = new HashSet<>(newPermissionNames);
                addedPermissions.removeAll(previousPermissionNames);

                Set<String> removedPermissions = new HashSet<>(previousPermissionNames);
                removedPermissions.removeAll(newPermissionNames);

                Map<String, Object> details = auditService.createDetailsMap();
                details.put("previousName", previousName);
                details.put("newName", updatedRole.getName());
                details.put("previousPermissions", previousPermissionNames);
                details.put("newPermissions", newPermissionNames);
                details.put("addedPermissions", addedPermissions);
                details.put("removedPermissions", removedPermissions);

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ROLE_UPDATED,
                        "Role",
                        updatedRole.getId() != null ? updatedRole.getId().longValue() : null,
                        updatedRole.getName(),
                        details
                );

                if (!addedPermissions.isEmpty()) {
                    Map<String, Object> grantedDetails = auditService.createDetailsMap();
                    grantedDetails.put("addedPermissions", addedPermissions);
                    auditService.logAction(
                            actor,
                            AuditLog.ActionType.PERMISSION_GRANTED,
                            "Role",
                            updatedRole.getId() != null ? updatedRole.getId().longValue() : null,
                            updatedRole.getName(),
                            grantedDetails
                    );
                }

                if (!removedPermissions.isEmpty()) {
                    Map<String, Object> revokedDetails = auditService.createDetailsMap();
                    revokedDetails.put("removedPermissions", removedPermissions);
                    auditService.logAction(
                            actor,
                            AuditLog.ActionType.PERMISSION_REVOKED,
                            "Role",
                            updatedRole.getId() != null ? updatedRole.getId().longValue() : null,
                            updatedRole.getName(),
                            revokedDetails
                    );
                }
            }
        } catch (Exception ignored) {
            // audit logging must remain best-effort
        }

        return updatedRole;
    }

    @Transactional
    public void deleteRole(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        // Business rule: Prevent deletion of core roles
        if (role.getName().equals("Admin") || role.getName().equals("Manager") || role.getName().equals("Staff")) {
            throw new RuntimeException("Cannot delete core system roles.");
        }

    Set<String> permissionNames = role.getPermissions().stream()
        .map(Permission::getName)
        .collect(Collectors.toSet());

        roleRepository.delete(role);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("roleName", role.getName());
        details.put("permissions", permissionNames);

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ROLE_DELETED,
                        "Role",
                        role.getId() != null ? role.getId().longValue() : null,
                        role.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // never rollback role deletion due to audit issues
        }
    }


    private User getAuthenticatedUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
                return null;
            }
            return userRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}