package com.bamikahub.inventorysystem.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DashboardSummaryDto {
    private long totalUsers;
    private long pendingUsers;
    private long totalSuppliers;
    private long totalItems;
    private long lowStockItems;
    private BigDecimal totalStockValue; // UGX
}