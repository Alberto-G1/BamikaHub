package com.bamikahub.inventorysystem.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDto {
    private String status; // HEALTHY, WARNING, CRITICAL
    private LocalDateTime timestamp;
    private DatabaseHealth database;
    private EmailServiceHealth emailService;
    private DiskSpaceHealth diskSpace;
    private CacheHealth cache;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DatabaseHealth {
        private String status;
        private boolean connected;
        private long responseTimeMs;
        private int connectionPoolActive;
        private int connectionPoolMax;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailServiceHealth {
        private String status;
        private boolean available;
        private int pendingEmailCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiskSpaceHealth {
        private String status;
        private double totalSpaceGB;
        private double freeSpaceGB;
        private double usagePercentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CacheHealth {
        private String status;
        private double hitRate;
        private double missRate;
        private int entryCount;
        private double memoryUsagePercent;
    }
}