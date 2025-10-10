package com.bamikahub.inventorysystem.dao;

import com.bamikahub.inventorysystem.models.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {
}