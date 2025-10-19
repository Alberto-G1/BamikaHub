package com.bamikahub.inventorysystem.dto.reporting;

import lombok.Data;

@Data
public class ProjectStatusCountDto {
    private String status;
    private long count;

    public ProjectStatusCountDto(String status, long count) {
        this.status = status;
        this.count = count;
    }
}