package com.bamikahub.inventorysystem.services.user;

import com.bamikahub.inventorysystem.dao.user.RoleRepository;
import com.bamikahub.inventorysystem.dao.user.StatusRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.user.*;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.Gender;
import com.bamikahub.inventorysystem.models.user.Role;
import com.bamikahub.inventorysystem.models.user.Status;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import com.bamikahub.inventorysystem.util.ValidationUtil;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.OptimisticLockException;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private StatusRepository statusRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AuditService auditService;


    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDto> getAllActiveUsers() {
        return userRepository.findAllActiveUsers().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDto> getAllDeactivatedUsers() {
        return userRepository.findAllDeactivatedUsers().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto createUser(UserCreateRequest request) {
        // Validate and sanitize fields similar to public registration
        String validFirst = ValidationUtil.validateFirstName(request.getFirstName());
        String validLast = ValidationUtil.validateLastName(request.getLastName());
        String validUsername = ValidationUtil.validateUsername(request.getUsername(), userRepository);
        String validEmail = ValidationUtil.validateEmail(request.getEmail(), userRepository);
        ValidationUtil.validatePassword(request.getPassword(), validFirst, validLast, validUsername);

        User user = new User();
        user.setFirstName(validFirst);
        user.setLastName(validLast);
        user.setUsername(validUsername);
        user.setEmail(validEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role role = roleRepository.findById(request.getRoleId()).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("Status 'ACTIVE' not found"));
        user.setStatus(activeStatus);

        User savedUser = userRepository.save(user);

        try {
            User actor = getAuthenticatedUser();
            if (actor == null) {
                actor = savedUser;
            }
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("email", savedUser.getEmail());
            details.put("role", savedUser.getRole().getName());
            details.put("status", savedUser.getStatus().getName());

            auditService.logAction(
                    actor,
                    AuditLog.ActionType.USER_CREATED,
                    "User",
                    savedUser.getId(),
                    savedUser.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // audit failure should not block user creation
        }

        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getVersion().equals(request.getVersion())) {
            throw new OptimisticLockException("User has been updated by another transaction. Please refresh and try again.");
        }

        String previousFirstName = user.getFirstName();
        String previousLastName = user.getLastName();
        String previousUsername = user.getUsername();
        String previousEmail = user.getEmail();
        String previousRoleName = user.getRole() != null ? user.getRole().getName() : null;
        String previousStatusName = user.getStatus() != null ? user.getStatus().getName() : null;

    // Validate and sanitize incoming fields, ensuring uniqueness ignoring current user
    String validFirst = ValidationUtil.validateFirstName(request.getFirstName());
    String validLast = ValidationUtil.validateLastName(request.getLastName());
    String validUsername = ValidationUtil.validateUsernameForUpdate(request.getUsername(), user.getId(), userRepository);
    String validEmail = ValidationUtil.validateEmailForUpdate(request.getEmail(), user.getId(), userRepository);

    user.setFirstName(validFirst);
    user.setLastName(validLast);
    user.setUsername(validUsername);
    user.setEmail(validEmail);

        Role role = roleRepository.findById(request.getRoleId()).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        Status status = statusRepository.findById(request.getStatusId()).orElseThrow(() -> new RuntimeException("Status not found"));
        user.setStatus(status);

        User updatedUser = userRepository.save(user);

        try {
            User actor = getAuthenticatedUser();
            if (actor == null) {
                actor = updatedUser;
            }
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("previousFirstName", previousFirstName);
            details.put("previousLastName", previousLastName);
            details.put("previousUsername", previousUsername);
            details.put("previousEmail", previousEmail);
            details.put("previousRole", previousRoleName);
            details.put("previousStatus", previousStatusName);
            details.put("newFirstName", updatedUser.getFirstName());
            details.put("newLastName", updatedUser.getLastName());
            details.put("newUsername", updatedUser.getUsername());
            details.put("newEmail", updatedUser.getEmail());
            details.put("newRole", updatedUser.getRole() != null ? updatedUser.getRole().getName() : null);
            details.put("newStatus", updatedUser.getStatus() != null ? updatedUser.getStatus().getName() : null);

            auditService.logAction(
                    actor,
                    AuditLog.ActionType.USER_UPDATED,
                    "User",
                    updatedUser.getId(),
                    updatedUser.getFullName(),
                    details
            );

            if (previousRoleName != null && !previousRoleName.equals(updatedUser.getRole().getName())) {
                Map<String, Object> roleDetails = auditService.createDetailsMap();
                roleDetails.put("previousRole", previousRoleName);
                roleDetails.put("newRole", updatedUser.getRole().getName());
                auditService.logAction(
                        actor,
                        AuditLog.ActionType.USER_ROLE_CHANGED,
                        "User",
                        updatedUser.getId(),
                        updatedUser.getFullName(),
                        roleDetails
                );
            }
        } catch (Exception ignored) {
            // audit logging must not interrupt user updates
        }

        return UserDto.fromEntity(updatedUser);
    }

    @Transactional
    public UserDto approveUser(Long id, Integer roleId) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (!"PENDING".equals(user.getStatus().getName())) {
            throw new RuntimeException("User is not in PENDING state.");
        }

        String previousStatus = user.getStatus().getName();
        String previousRole = user.getRole() != null ? user.getRole().getName() : null;

        Role role = roleRepository.findById(roleId).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("Status 'ACTIVE' not found"));
        user.setStatus(activeStatus);

        // Audit who approved it
        String approverEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User approver = userRepository.findByEmail(approverEmail).orElse(null);
        user.setApprovedBy(approver);
        user.setApprovedAt(LocalDateTime.now());

        User approvedUser = userRepository.save(user);
        // Here you would trigger a welcome email

        try {
            User actor = approver != null ? approver : getAuthenticatedUser();
            if (actor == null) {
                actor = approvedUser;
            }

            Map<String, Object> details = auditService.createDetailsMap();
            details.put("previousStatus", previousStatus);
            details.put("newStatus", approvedUser.getStatus().getName());
            details.put("previousRole", previousRole);
            details.put("newRole", approvedUser.getRole() != null ? approvedUser.getRole().getName() : null);

            auditService.logAction(
                    actor,
                    AuditLog.ActionType.USER_ACTIVATED,
                    "User",
                    approvedUser.getId(),
                    approvedUser.getFullName(),
                    details
            );

            if (previousRole == null || !previousRole.equals(approvedUser.getRole().getName())) {
                Map<String, Object> roleDetails = auditService.createDetailsMap();
                roleDetails.put("previousRole", previousRole);
                roleDetails.put("newRole", approvedUser.getRole().getName());
                auditService.logAction(
                        actor,
                        AuditLog.ActionType.USER_ROLE_CHANGED,
                        "User",
                        approvedUser.getId(),
                        approvedUser.getFullName(),
                        roleDetails
                );
            }
        } catch (Exception ignored) {
            // audit failure should not stop approval
        }

        return UserDto.fromEntity(approvedUser);
    }


    // METHOD: Get the profile for the currently authenticated user
    public UserProfileDto getCurrentUserProfile() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database."));
        return UserProfileDto.fromEntity(user);
    }

    // NEW METHOD: Update the profile for the currently authenticated user
    @Transactional
    public UserProfileDto updateCurrentUserProfile(ProfileUpdateRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

    String previousFirstName = user.getFirstName();
    String previousLastName = user.getLastName();
    String previousPhone = user.getPhoneNumber();
    String previousAddress = user.getAddress();
    String previousCity = user.getCity();
    String previousCountry = user.getCountry();
    String previousGender = user.getGender() != null ? user.getGender().name() : null;
    LocalDate previousDob = user.getDateOfBirth();

        // Validate and update all allowed fields
        if (request.getFirstName() != null) {
            user.setFirstName(ValidationUtil.validateFirstName(request.getFirstName()));
        }
        if (request.getLastName() != null) {
            user.setLastName(ValidationUtil.validateLastName(request.getLastName()));
        }

        // Optional fields: sanitize and basic format validation
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(ValidationUtil.validateOptionalPhone(request.getPhoneNumber()));
        }
        user.setAddress(ValidationUtil.sanitize(request.getAddress()));
        user.setCity(ValidationUtil.sanitize(request.getCity()));
        user.setCountry(ValidationUtil.sanitize(request.getCountry()));

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(ValidationUtil.validateOptionalDob(request.getDateOfBirth()));
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new RuntimeException("Invalid gender value.");
            }
        }

        User updatedUser = userRepository.save(user);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("previousFirstName", previousFirstName);
            details.put("previousLastName", previousLastName);
            details.put("previousPhone", previousPhone);
            details.put("previousAddress", previousAddress);
            details.put("previousCity", previousCity);
            details.put("previousCountry", previousCountry);
            details.put("previousGender", previousGender);
            details.put("previousDateOfBirth", previousDob);
            details.put("newFirstName", updatedUser.getFirstName());
            details.put("newLastName", updatedUser.getLastName());
            details.put("newPhone", updatedUser.getPhoneNumber());
            details.put("newAddress", updatedUser.getAddress());
            details.put("newCity", updatedUser.getCity());
            details.put("newCountry", updatedUser.getCountry());
            details.put("newGender", updatedUser.getGender() != null ? updatedUser.getGender().name() : null);
            details.put("newDateOfBirth", updatedUser.getDateOfBirth());

            auditService.logAction(
                    updatedUser,
                    AuditLog.ActionType.USER_UPDATED,
                    "User",
                    updatedUser.getId(),
                    updatedUser.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // audit failure should not stop profile changes
        }

        return UserProfileDto.fromEntity(updatedUser);
    }

    // METHOD: Change password for the currently authenticated user
    @Transactional
    public void changeCurrentUserPassword(PasswordChangeRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        // 1. Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Incorrect current password.");
        }

        // 2. (Optional but recommended) Check if new password is same as old
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password cannot be the same as the old password.");
        }

    // 3. Enforce password policy (complexity, not containing personal info)
    ValidationUtil.validatePassword(request.getNewPassword(), user.getFirstName(), user.getLastName(), user.getUsername());

        // 4. Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());

        userRepository.save(user);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("changedAt", user.getPasswordChangedAt());
            auditService.logAction(
                    user,
                    AuditLog.ActionType.USER_PASSWORD_CHANGED,
                    "User",
                    user.getId(),
                    user.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // continue flow if audit logging fails
        }
    }

    @Transactional
    public UserProfileDto updateProfilePicture(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Invalid file: File is empty or exceeds 5MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new RuntimeException("Invalid file type: Only JPEG and PNG are allowed.");
        }

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        // Call the correct, specific method from the storage service
        String filename = fileStorageService.storeProfilePicture(file);
        user.setProfilePictureUrl("/uploads/profile-pictures/" + filename);

        userRepository.save(user);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("profilePictureUrl", user.getProfilePictureUrl());
            auditService.logAction(
                    user,
                    AuditLog.ActionType.USER_UPDATED,
                    "User",
                    user.getId(),
                    user.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // audit logging is best-effort
        }

        return UserProfileDto.fromEntity(user);
    }

    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Status deactivatedStatus = statusRepository.findByName("DEACTIVATED").orElseThrow(() -> new RuntimeException("Status 'DEACTIVATED' not found"));

        // Business Rule: Prevent self-deactivation or deactivating the last admin
        // Add more sophisticated logic here as needed

        user.setStatus(deactivatedStatus);
        userRepository.save(user);

        try {
            User actor = getAuthenticatedUser();
            if (actor == null) {
                actor = user;
            }
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("newStatus", deactivatedStatus.getName());
            auditService.logAction(
                    actor,
                    AuditLog.ActionType.USER_DEACTIVATED,
                    "User",
                    user.getId(),
                    user.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // do not interrupt status change
        }
    }

    @Transactional
    public void reactivateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("Status 'ACTIVE' not found"));

        user.setStatus(activeStatus);
        userRepository.save(user);

        try {
            User actor = getAuthenticatedUser();
            if (actor == null) {
                actor = user;
            }
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("newStatus", activeStatus.getName());
            auditService.logAction(
                    actor,
                    AuditLog.ActionType.USER_ACTIVATED,
                    "User",
                    user.getId(),
                    user.getFullName(),
                    details
            );
        } catch (Exception ignored) {
            // audit logging should not rollback status change
        }
    }

    private User getAuthenticatedUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}