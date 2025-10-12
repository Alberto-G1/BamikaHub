package com.bamikahub.inventorysystem.controllers.user;

import com.bamikahub.inventorysystem.dto.user.RoleRequest;
import com.bamikahub.inventorysystem.models.user.Role;
import com.bamikahub.inventorysystem.services.user.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.bamikahub.inventorysystem.dto.inventory.GroupedPermissionsDto; // Import new DTO


import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public List<Role> getAllRoles() {
        return roleService.getAllRoles();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public GroupedPermissionsDto getAllPermissions() {
        return roleService.getAllPermissions();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public Role getRoleById(@PathVariable Integer id) {
        return roleService.getRoleById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    public Role createRole(@RequestBody RoleRequest roleRequest) {
        return roleService.createRole(roleRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public Role updateRole(@PathVariable Integer id, @RequestBody RoleRequest roleRequest) {
        return roleService.updateRole(id, roleRequest);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public ResponseEntity<?> deleteRole(@PathVariable Integer id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok("Role deleted successfully.");
    }
}