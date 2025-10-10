package com.bamikahub.inventorysystem.dto;

import com.bamikahub.inventorysystem.models.Permission;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class GroupedPermissionsDto {
    private Map<String, List<Permission>> grouped;

    public GroupedPermissionsDto(Map<String, List<Permission>> grouped) {
        this.grouped = grouped;
    }
}