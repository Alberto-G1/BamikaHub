package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Supplier performance metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPerformanceDto {
    private Long supplierId;
    private String supplierName;
    private Long totalOrders;
    private Long onTimeDeliveries;
    private Long lateDeliveries;
    private Double onTimePercentage;
    private Double averageDeliveryDays;
    private String reliabilityRating; // EXCELLENT, GOOD, FAIR, POOR
}
