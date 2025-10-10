package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dao.CategoryRepository;
import com.bamikahub.inventorysystem.models.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()") // Any authenticated user can read categories
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ITEM_CREATE')") // Reuse item permission for category creation
    public Category createCategory(@RequestBody Category category) {
        return categoryRepository.save(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());
        return categoryRepository.save(category);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ITEM_DELETE')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        // Business Rule: Check if any inventory items are using this category before deleting.
        // This requires adding a method to InventoryItemRepository: `countByCategoryId(Long categoryId)`
        // long itemCount = itemRepository.countByCategoryId(id);
        // if (itemCount > 0) {
        //     return ResponseEntity.badRequest().body("Cannot delete category: It is currently assigned to " + itemCount + " item(s).");
        // }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}