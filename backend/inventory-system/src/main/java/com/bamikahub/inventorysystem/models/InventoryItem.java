package com.bamikahub.inventorysystem.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String sku;

    @ManyToOne(fetch = FetchType.EAGER) // Eager fetch for easier display
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Lob // For longer text
    private String description;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(nullable = false)
    private Integer reorderLevel = 0;

    @Column(nullable = false, precision = 19, scale = 0) // UGX has no decimals
    private BigDecimal unitPrice;

    // NEW: Field to store the path to the image
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    // A simple string for now, could be an entity later
    private String location;

    @Column(nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    private Integer version;

    @Column(columnDefinition = "boolean default false")
    private boolean isDeleted = false;
    private LocalDateTime deletedAt;
}