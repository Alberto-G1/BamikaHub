package com.bamikahub.inventorysystem.service.privacy;

import com.bamikahub.inventorysystem.dao.privacy.DataRequestRepository;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.models.privacy.DataRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataRequestService {
    private final DataRequestRepository requestRepository;
    private final DataExportService dataExportService;

    @Transactional
    public DataRequest createDataRequest(User user, String requestType, String reason, String ipAddress, String userAgent) {
        // Check if user already has an active request of this type
        Optional<DataRequest> existing = requestRepository.findActiveRequestByUserAndType(user, requestType);
        if (existing.isPresent()) {
            throw new IllegalStateException("User already has an active " + requestType + " request");
        }

        DataRequest request = new DataRequest();
        request.setUser(user);
        request.setRequestType(requestType);
        request.setStatus("PENDING");
        request.setReason(reason);
        request.setRequestDate(LocalDateTime.now());
        request.setVerificationCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        request.setVerified(false);
        request.setIpAddress(ipAddress);
        request.setUserAgent(userAgent);

        log.info("Created data request {} for user {}", requestType, user.getEmail());
        return requestRepository.save(request);
    }

    @Transactional
    public boolean verifyRequest(String verificationCode) {
        Optional<DataRequest> requestOpt = requestRepository.findByVerificationCode(verificationCode);
        if (requestOpt.isPresent()) {
            DataRequest request = requestOpt.get();
            request.verify();
            requestRepository.save(request);
            log.info("Verified data request {}", request.getId());
            return true;
        }
        return false;
    }

    @Transactional
    public void processRequest(Long requestId, User processor) {
        Optional<DataRequest> requestOpt = requestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            throw new IllegalArgumentException("Request not found");
        }

        DataRequest request = requestOpt.get();
        if (!request.isVerified()) {
            throw new IllegalStateException("Request must be verified before processing");
        }

        request.markInProgress(processor.getEmail());
        requestRepository.save(request);

        try {
            String filePath = null;
            if ("EXPORT".equals(request.getRequestType()) || "PORTABILITY".equals(request.getRequestType())) {
                filePath = dataExportService.exportUserData(request.getUser());
            } else if ("DELETE".equals(request.getRequestType())) {
                dataExportService.deleteUserData(request.getUser());
            }

            request.markCompleted(filePath);
            requestRepository.save(request);
            log.info("Completed data request {} for user {}", request.getId(), request.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to process data request {}", requestId, e);
            throw new RuntimeException("Failed to process request", e);
        }
    }

    @Transactional
    public void rejectRequest(Long requestId, String rejectionReason) {
        Optional<DataRequest> requestOpt = requestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            throw new IllegalArgumentException("Request not found");
        }

        DataRequest request = requestOpt.get();
        request.markRejected(rejectionReason);
        requestRepository.save(request);
        log.info("Rejected data request {}", requestId);
    }

    public List<DataRequest> getUserRequests(User user) {
        return requestRepository.findByUserOrderByRequestDateDesc(user);
    }

    public List<DataRequest> getRequestsByStatus(String status) {
        return requestRepository.findByStatusOrderByRequestDateAsc(status);
    }

    public List<DataRequest> getOverdueRequests() {
        LocalDateTime overdueDate = LocalDateTime.now().minusDays(30);
        return requestRepository.findOverdueRequests(overdueDate);
    }

    public Optional<DataRequest> getRequest(Long id, User user) {
        return requestRepository.findByIdAndUser(id, user);
    }

    public long countByStatus(String status) {
        return requestRepository.countByStatus(status);
    }

    public Map<String, Long> getRequestStatistics() {
        return Map.of(
            "pending", countByStatus("PENDING"),
            "inProgress", countByStatus("IN_PROGRESS"),
            "completed", countByStatus("COMPLETED"),
            "rejected", countByStatus("REJECTED"),
            "overdue", (long) getOverdueRequests().size()
        );
    }
}
