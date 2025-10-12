package com.bamikahub.inventorysystem.models.finance;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "requisition_items")
public class RequisitionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requisition_id")
    @JsonIgnore // Prevent infinite loop
    private Requisition requisition;

    @Column(nullable = false)
    private String itemName;

    @Lob
    private String description; // Optional: specifications, brand, etc.

    @Column(nullable = false)
    private Double quantity; // Using Double to allow for units like 1.5 meters

    @Column(nullable = false)
    private String unitOfMeasure; // e.g., "bags", "meters", "pieces"

    @Column(precision = 19, scale = 0)
    private BigDecimal estimatedUnitCost; // UGX
}