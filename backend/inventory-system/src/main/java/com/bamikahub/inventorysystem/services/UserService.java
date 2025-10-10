package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.RoleRepository;
import com.bamikahub.inventorysystem.dao.StatusRepository;
import com.bamikahub.inventorysystem.dao.UserRepository;
import com.bamikahub.inventorysystem.dto.*;
import com.bamikahub.inventorysystem.models.Gender;
import com.bamikahub.inventorysystem.models.Role;
import com.bamikahub.inventorysystem.models.Status;
import com.bamikahub.inventorysystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.OptimisticLockException;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private StatusRepository statusRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private FileStorageService fileStorageService;


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
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use.");
        }
        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role role = roleRepository.findById(request.getRoleId()).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("Status 'ACTIVE' not found"));
        user.setStatus(activeStatus);

        User savedUser = userRepository.save(user);
        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getVersion().equals(request.getVersion())) {
            throw new OptimisticLockException("User has been updated by another transaction. Please refresh and try again.");
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        Role role = roleRepository.findById(request.getRoleId()).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        Status status = statusRepository.findById(request.getStatusId()).orElseThrow(() -> new RuntimeException("Status not found"));
        user.setStatus(status);

        User updatedUser = userRepository.save(user);
        return UserDto.fromEntity(updatedUser);
    }

    @Transactional
    public UserDto approveUser(Long id, Integer roleId) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (!"PENDING".equals(user.getStatus().getName())) {
            throw new RuntimeException("User is not in PENDING state.");
        }

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

        // Update all allowed fields
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        user.setCity(request.getCity());
        user.setCountry(request.getCountry());
        user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) {
            user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        }

        User updatedUser = userRepository.save(user);
        // Here you would add an AuditLog entry
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

        // 3. (Optional but recommended) Add password policy validation here (regex)

        // 4. Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());

        userRepository.save(user);
        // Here you would add an AuditLog entry and invalidate other active sessions/tokens
    }

    @Transactional
    public UserProfileDto updateProfilePicture(MultipartFile file) {
        // 1. Basic Validation
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) { // 2MB limit
            throw new RuntimeException("Invalid file: File is empty or exceeds 2MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new RuntimeException("Invalid file type: Only JPEG and PNG are allowed.");
        }

        // 2. Get current user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        // 3. Store the file and get the new filename
        String filename = fileStorageService.store(file);

        // 4. Update the user record with the URL path
        // We'll serve it from /uploads/{filename}
        user.setProfilePictureUrl("/uploads/" + filename);
        userRepository.save(user);

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
    }

    @Transactional
    public void reactivateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Status activeStatus = statusRepository.findByName("ACTIVE").orElseThrow(() -> new RuntimeException("Status 'ACTIVE' not found"));

        user.setStatus(activeStatus);
        userRepository.save(user);
    }
}