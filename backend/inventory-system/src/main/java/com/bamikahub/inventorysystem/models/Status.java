package com.bamikahub.inventorysystem.models;

import jakarta.persistence.*;
import lombok.Data;

@Data @Entity
public class Status {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(unique = true)
    private String name; // PENDING, ACTIVE, SUSPENDED
    private String color; // e.g., "#FFC107", "#28A745", "#DC3545"
}