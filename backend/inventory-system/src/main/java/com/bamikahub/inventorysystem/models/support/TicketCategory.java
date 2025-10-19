package com.bamikahub.inventorysystem.models.support;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "ticket_categories")
@NoArgsConstructor
public class TicketCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String name; // e.g., "SYSTEM_ISSUE", "EQUIPMENT_FAULT"

    public TicketCategory(String name) {
        this.name = name;
    }
}