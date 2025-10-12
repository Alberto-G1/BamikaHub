package com.bamikahub.inventorysystem.controllers.inventory;

import com.bamikahub.inventorysystem.dao.inventory.SupplierRepository;
import com.bamikahub.inventorysystem.models.inventory.Supplier;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupplierController {

    @Autowired private SupplierRepository supplierRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPPLIER_CREATE')")
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public Supplier getSupplierById(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    public Supplier updateSupplier(@PathVariable Long id, @RequestBody Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        // Copy properties from the request to the existing entity
        BeanUtils.copyProperties(supplierDetails, supplier, "id", "createdAt"); // Ignore ID and createdAt

        return supplierRepository.save(supplier);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_DELETE')")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        // Add a check here to prevent deleting a supplier if it's linked to inventory items
        if (supplier.getItems() != null && !supplier.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Cannot delete supplier: It is currently assigned to one or more inventory items.");
        }

        supplierRepository.delete(supplier);
        return ResponseEntity.ok().build();
    }
}