package com.bamikahub.inventorysystem.dao.user;

import com.bamikahub.inventorysystem.models.user.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {
    Optional<Permission> findByName(String name);
}