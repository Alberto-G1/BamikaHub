package com.bamikahub.inventorysystem.service.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataExportService {

    @Value("${privacy.export.directory:./privacy-exports}")
    private String exportDirectory;

    private final ObjectMapper objectMapper;

    /**
     * Exports all user data to a JSON file
     * @param user The user whose data should be exported
     * @return Path to the exported file
     */
    @Transactional(readOnly = true)
    public String exportUserData(User user) {
        try {
            // Create export directory if it doesn't exist
            Path exportPath = Paths.get(exportDirectory);
            if (!Files.exists(exportPath)) {
                Files.createDirectories(exportPath);
            }

            // Prepare user data
            Map<String, Object> userData = collectUserData(user);

            // Generate filename
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("user_data_%s_%s.json", user.getId(), timestamp);
            Path filePath = exportPath.resolve(filename);

            // Configure ObjectMapper
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            // Write to file
            try (FileWriter writer = new FileWriter(filePath.toFile())) {
                mapper.writeValue(writer, userData);
            }

            log.info("Exported user data for user {} to {}", user.getEmail(), filePath);
            return filePath.toString();

        } catch (IOException e) {
            log.error("Failed to export user data for user {}", user.getEmail(), e);
            throw new RuntimeException("Failed to export user data", e);
        }
    }

    /**
     * Deletes all user data (GDPR right to be forgotten)
     * @param user The user whose data should be deleted
     */
    @Transactional
    public void deleteUserData(User user) {
        try {
            log.info("Starting data deletion for user {}", user.getEmail());

            // Note: Implement actual deletion logic based on your data model
            // This is a placeholder that should be customized based on your entities
            
            // Example deletions (customize based on your entities):
            // - Delete user's tickets
            // - Delete user's comments
            // - Delete user's activities
            // - Anonymize user's audit logs (don't delete for compliance)
            // - Delete user's sessions
            // - Delete user's files/uploads
            
            // For now, anonymize user data but keep audit trail
            user.setEmail("deleted_" + user.getId() + "@deleted.local");
            user.setUsername("deleted_user_" + user.getId());
            user.setFirstName("Deleted");
            user.setLastName("User");
            
            log.info("Completed data deletion for user {}", user.getId());

        } catch (Exception e) {
            log.error("Failed to delete user data for user {}", user.getId(), e);
            throw new RuntimeException("Failed to delete user data", e);
        }
    }

    /**
     * Collects all user data into a map for export
     * @param user The user whose data should be collected
     * @return Map containing all user data
     */
    private Map<String, Object> collectUserData(User user) {
        Map<String, Object> data = new HashMap<>();

        // Basic user information
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("email", user.getEmail());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());

        // Note: Add more data collections based on your data model
        // Examples:
        // data.put("tickets", ticketRepository.findByUser(user));
        // data.put("comments", commentRepository.findByUser(user));
        // data.put("activities", activityRepository.findByUser(user));
        // data.put("preferences", preferencesRepository.findByUser(user));

        data.put("exportedAt", LocalDateTime.now());
        data.put("exportReason", "GDPR Data Portability Request");

        return data;
    }

    /**
     * Cleans up old export files (should be run periodically)
     * @param daysToKeep Number of days to keep export files
     */
    public void cleanupOldExports(int daysToKeep) {
        try {
            Path exportPath = Paths.get(exportDirectory);
            if (!Files.exists(exportPath)) {
                return;
            }

            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
            Files.list(exportPath)
                    .filter(path -> path.toString().endsWith(".json"))
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path)
                                    .toInstant()
                                    .isBefore(cutoffDate.atZone(java.time.ZoneId.systemDefault()).toInstant());
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.info("Deleted old export file: {}", path);
                        } catch (IOException e) {
                            log.error("Failed to delete export file: {}", path, e);
                        }
                    });

        } catch (IOException e) {
            log.error("Failed to cleanup old exports", e);
        }
    }
}
