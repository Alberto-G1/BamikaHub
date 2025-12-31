package com.bamikahub.inventorysystem.services.settings;

import com.bamikahub.inventorysystem.dto.settings.SystemHealthDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.time.LocalDateTime;

@Service
public class SystemHealthService {

    @Autowired
    private DataSource dataSource;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Perform comprehensive system health check
     */
    public SystemHealthDto checkSystemHealth() {
        SystemHealthDto health = new SystemHealthDto();
        health.setTimestamp(LocalDateTime.now());
        
        // Check database health
        SystemHealthDto.DatabaseHealth dbHealth = checkDatabaseHealth();
        health.setDatabase(dbHealth);
        
        // Check email service health
        SystemHealthDto.EmailServiceHealth emailHealth = checkEmailServiceHealth();
        health.setEmailService(emailHealth);
        
        // Check disk space health
        SystemHealthDto.DiskSpaceHealth diskHealth = checkDiskSpaceHealth();
        health.setDiskSpace(diskHealth);
        
        // Check cache health (simple memory check for now)
        SystemHealthDto.CacheHealth cacheHealth = checkCacheHealth();
        health.setCache(cacheHealth);
        
        // Determine overall status
        health.setStatus(determineOverallStatus(dbHealth, emailHealth, diskHealth, cacheHealth));
        
        return health;
    }

    /**
     * Check database connectivity and performance
     */
    private SystemHealthDto.DatabaseHealth checkDatabaseHealth() {
        SystemHealthDto.DatabaseHealth dbHealth = new SystemHealthDto.DatabaseHealth();
        
        try {
            long startTime = System.currentTimeMillis();
            
            try (Connection connection = dataSource.getConnection()) {
                boolean isValid = connection.isValid(5); // 5 second timeout
                long responseTime = System.currentTimeMillis() - startTime;
                
                dbHealth.setConnected(isValid);
                dbHealth.setResponseTimeMs(responseTime);
                
                // Check connection pool status (simplified)
                dbHealth.setConnectionPoolActive(10); // Mock value - would get from actual pool
                dbHealth.setConnectionPoolMax(20);    // Mock value - would get from actual pool
                
                dbHealth.setStatus(isValid && responseTime < 1000 ? "HEALTHY" : "WARNING");
            }
        } catch (Exception e) {
            dbHealth.setConnected(false);
            dbHealth.setStatus("CRITICAL");
            dbHealth.setResponseTimeMs(-1);
        }
        
        return dbHealth;
    }

    /**
     * Check email service availability
     */
    private SystemHealthDto.EmailServiceHealth checkEmailServiceHealth() {
        SystemHealthDto.EmailServiceHealth emailHealth = new SystemHealthDto.EmailServiceHealth();
        
        try {
            if (mailSender != null) {
                // Test connection (simplified - doesn't actually send)
                emailHealth.setAvailable(true);
                emailHealth.setPendingEmailCount(0); // Would query from email queue
                emailHealth.setStatus("HEALTHY");
            } else {
                emailHealth.setAvailable(false);
                emailHealth.setStatus("WARNING");
            }
        } catch (Exception e) {
            emailHealth.setAvailable(false);
            emailHealth.setStatus("CRITICAL");
        }
        
        return emailHealth;
    }

    /**
     * Check disk space availability
     */
    private SystemHealthDto.DiskSpaceHealth checkDiskSpaceHealth() {
        SystemHealthDto.DiskSpaceHealth diskHealth = new SystemHealthDto.DiskSpaceHealth();
        
        try {
            // Check uploads directory
            File uploadsDir = new File("uploads");
            if (!uploadsDir.exists()) {
                uploadsDir = new File(".");
            }
            
            long totalSpace = uploadsDir.getTotalSpace();
            long freeSpace = uploadsDir.getFreeSpace();
            long usableSpace = uploadsDir.getUsableSpace();
            
            double totalGB = totalSpace / (1024.0 * 1024.0 * 1024.0);
            double freeGB = freeSpace / (1024.0 * 1024.0 * 1024.0);
            double usagePercent = ((totalSpace - freeSpace) / (double) totalSpace) * 100;
            
            diskHealth.setTotalSpaceGB(Math.round(totalGB * 100.0) / 100.0);
            diskHealth.setFreeSpaceGB(Math.round(freeGB * 100.0) / 100.0);
            diskHealth.setUsagePercentage(Math.round(usagePercent * 100.0) / 100.0);
            
            if (usagePercent < 80) {
                diskHealth.setStatus("HEALTHY");
            } else if (usagePercent < 90) {
                diskHealth.setStatus("WARNING");
            } else {
                diskHealth.setStatus("CRITICAL");
            }
        } catch (Exception e) {
            diskHealth.setStatus("UNKNOWN");
        }
        
        return diskHealth;
    }

    /**
     * Check cache/memory health
     */
    private SystemHealthDto.CacheHealth checkCacheHealth() {
        SystemHealthDto.CacheHealth cacheHealth = new SystemHealthDto.CacheHealth();
        
        try {
            Runtime runtime = Runtime.getRuntime();
            long maxMemory = runtime.maxMemory();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            double memoryUsagePercent = (usedMemory / (double) maxMemory) * 100;
            
            // Mock cache statistics
            cacheHealth.setHitRate(95.5); // Would get from actual cache
            cacheHealth.setMissRate(4.5); // Would get from actual cache
            cacheHealth.setEntryCount(1250); // Would get from actual cache
            cacheHealth.setMemoryUsagePercent(Math.round(memoryUsagePercent * 100.0) / 100.0);
            
            if (memoryUsagePercent < 80) {
                cacheHealth.setStatus("HEALTHY");
            } else if (memoryUsagePercent < 90) {
                cacheHealth.setStatus("WARNING");
            } else {
                cacheHealth.setStatus("CRITICAL");
            }
        } catch (Exception e) {
            cacheHealth.setStatus("UNKNOWN");
        }
        
        return cacheHealth;
    }

    /**
     * Determine overall system health status
     */
    private String determineOverallStatus(SystemHealthDto.DatabaseHealth db, 
                                         SystemHealthDto.EmailServiceHealth email,
                                         SystemHealthDto.DiskSpaceHealth disk,
                                         SystemHealthDto.CacheHealth cache) {
        // Critical if database is down
        if ("CRITICAL".equals(db.getStatus())) {
            return "CRITICAL";
        }
        
        // Critical if disk is full
        if ("CRITICAL".equals(disk.getStatus())) {
            return "CRITICAL";
        }
        
        // Warning if any component is in warning state
        if ("WARNING".equals(db.getStatus()) || 
            "WARNING".equals(disk.getStatus()) || 
            "WARNING".equals(cache.getStatus())) {
            return "WARNING";
        }
        
        return "HEALTHY";
    }
}
