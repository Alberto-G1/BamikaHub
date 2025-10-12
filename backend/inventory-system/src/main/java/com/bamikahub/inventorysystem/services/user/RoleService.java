package com.bamikahub.inventorysystem.services.user;

import com.bamikahub.inventorysystem.dao.user.PermissionRepository;
import com.bamikahub.inventorysystem.dao.user.RoleRepository;
import com.bamikahub.inventorysystem.dto.user.RoleRequest;
import com.bamikahub.inventorysystem.models.user.Permission;
import com.bamikahub.inventorysystem.models.user.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bamikahub.inventorysystem.dto.inventory.GroupedPermissionsDto;

import java.util.Map;
import java.util.stream.Collectors;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

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

        return roleRepository.save(role);
    }

    @Transactional
    public Role updateRole(Integer id, RoleRequest roleRequest) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        role.setName(roleRequest.getName());
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(roleRequest.getPermissionIds()));
        role.setPermissions(permissions);

        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        // Business rule: Prevent deletion of core roles
        if (role.getName().equals("Admin") || role.getName().equals("Manager") || role.getName().equals("Staff")) {
            throw new RuntimeException("Cannot delete core system roles.");
        }

        roleRepository.deleteById(id);
    }


}