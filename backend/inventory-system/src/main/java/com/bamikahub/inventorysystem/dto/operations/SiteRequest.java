package com.bamikahub.inventorysystem.dto.operations;
import lombok.Data;

@Data
public class SiteRequest {
    private Long projectId;

    private String name;

    private String location;
}
