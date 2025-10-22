package com.bamikahub.inventorysystem.services.inventory;

import com.bamikahub.inventorysystem.dao.inventory.CategoryRepository;
import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.inventory.Category;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class CategoryService {

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditService auditService;

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Category createCategory(Category categoryRequest) {
        Category savedCategory = categoryRepository.save(categoryRequest);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = buildCategorySnapshot(savedCategory);
                auditService.logAction(
                        actor,
                        AuditLog.ActionType.CATEGORY_CREATED,
                        "Category",
                        savedCategory.getId(),
                        savedCategory.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // Audit failures must not break category creation
        }

        return savedCategory;
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    @Transactional
    public Category updateCategory(Long id, Category categoryRequest) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        Map<String, Object> beforeSnapshot = buildCategorySnapshot(category);

        category.setName(categoryRequest.getName());
        category.setDescription(categoryRequest.getDescription());

        Category updatedCategory = categoryRepository.save(category);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> afterSnapshot = buildCategorySnapshot(updatedCategory);
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("before", beforeSnapshot);
                details.put("after", afterSnapshot);
                details.put("changedFields", computeChangedFields(beforeSnapshot, afterSnapshot));

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.CATEGORY_UPDATED,
                        "Category",
                        updatedCategory.getId(),
                        updatedCategory.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // Audit should be best effort only
        }

        return updatedCategory;
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        long itemCount = inventoryItemRepository.countByCategoryId(id);
        if (itemCount > 0) {
            throw new IllegalStateException("Cannot delete category: It is assigned to " + itemCount + " item(s).");
        }

        categoryRepository.delete(category);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = buildCategorySnapshot(category);
                details.put("note", "Category deleted");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.CATEGORY_DELETED,
                        "Category",
                        category.getId(),
                        category.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // deletion should proceed even if audit logging fails
        }
    }

    private Map<String, Object> buildCategorySnapshot(Category category) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("name", category.getName());
        snapshot.put("description", category.getDescription());
        snapshot.put("itemCount", resolveItemCount(category));
        return snapshot;
    }

    private long resolveItemCount(Category category) {
        if (category.getId() != null) {
            return inventoryItemRepository.countByCategoryId(category.getId());
        }
        return 0;
    }

    private Set<String> computeChangedFields(Map<String, Object> before, Map<String, Object> after) {
        Set<String> changed = new HashSet<>();
        after.forEach((key, newValue) -> {
            Object oldValue = before.get(key);
            if (!Objects.equals(oldValue, newValue)) {
                changed.add(key);
            }
        });
        return changed;
    }

    private User getAuthenticatedUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
                return null;
            }
            return userRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
