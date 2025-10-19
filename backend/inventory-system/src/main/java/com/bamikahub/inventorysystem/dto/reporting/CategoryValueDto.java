package com.bamikahub.inventorysystem.dto.reporting;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CategoryValueDto {
    private String categoryName;
    private BigDecimal totalValue;

    public CategoryValueDto(String categoryName, BigDecimal totalValue) {
        this.categoryName = categoryName;
        this.totalValue = totalValue;
    }
}