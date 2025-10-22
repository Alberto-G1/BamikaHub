package com.bamikahub.inventorysystem.controllers.inventory;

import com.bamikahub.inventorysystem.models.inventory.Supplier;
import com.bamikahub.inventorysystem.services.inventory.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupplierController {

    @Autowired private SupplierService supplierService;

    @GetMapping
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPPLIER_CREATE')")
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierService.createSupplier(supplier);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public Supplier getSupplierById(@PathVariable Long id) {
        return supplierService.getSupplierById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    public Supplier updateSupplier(@PathVariable Long id, @RequestBody Supplier supplierDetails) {
        return supplierService.updateSupplier(id, supplierDetails);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_DELETE')")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            supplierService.deleteSupplier(id);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}