package com.bamikahub.inventorysystem.controllers.inventory;

import com.bamikahub.inventorysystem.models.inventory.Category;
import com.bamikahub.inventorysystem.services.inventory.CategoryService;
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
    private CategoryService categoryService;

    @GetMapping
    @PreAuthorize("isAuthenticated()") // Any authenticated user can read categories
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ITEM_CREATE')") // Reuse item permission for category creation
    public Category createCategory(@RequestBody Category category) {
        return categoryService.createCategory(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category categoryDetails) {
    return categoryService.updateCategory(id, categoryDetails);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ITEM_DELETE')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}