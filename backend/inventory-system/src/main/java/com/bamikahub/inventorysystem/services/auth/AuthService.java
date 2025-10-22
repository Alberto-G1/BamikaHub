package com.bamikahub.inventorysystem.services.auth;

import com.bamikahub.inventorysystem.dao.user.RoleRepository;
import com.bamikahub.inventorysystem.dao.user.StatusRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.auth.AuthRequest;
import com.bamikahub.inventorysystem.dto.auth.JwtResponse;
import com.bamikahub.inventorysystem.dto.auth.RegisterRequest;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import com.bamikahub.inventorysystem.models.user.Role;
import com.bamikahub.inventorysystem.models.user.Status;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.security.jwt.JwtUtil;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import com.bamikahub.inventorysystem.services.notification.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AuthService {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private StatusRepository statusRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private NotificationService notificationService;
    @Autowired private AuditService auditService;

    @Transactional
    public JwtResponse loginUser(AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateToken(authentication);

    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

    User userEntity = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        userEntity.setLastLoginAt(LocalDateTime.now());
        userRepository.save(userEntity);

        List<String> permissions = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority().toString())
                .collect(Collectors.toList());

    String role = permissions.stream()
                .filter(p -> p.startsWith("ROLE_"))
                .findFirst()
                .orElse("ROLE_UNKNOWN")
                .substring(5);

    JwtResponse response = new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                role,
                userEntity.getProfilePictureUrl(),
                permissions
        );

    // Audit login action
    try {
        auditService.logAction(
            userEntity,
            AuditLog.ActionType.USER_LOGIN,
            "User",
            userEntity.getId(),
            userEntity.getFullName(),
            Map.of(
                "email", userEntity.getEmail(),
                "role", role,
                "permissions", permissions
            )
        );
    } catch (Exception e) {
        log.error("Failed to audit login for {}: {}", userEntity.getEmail(), e.getMessage());
    }

    return response;
    }

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(encoder.encode(registerRequest.getPassword()));

        // v-- THIS IS THE FIX --v
        // Change "Staff" to the new default role "Field Engineer (Civil)"
        Role userRole = roleRepository.findByName("Field Engineer (Civil)")
                .orElseThrow(() -> new RuntimeException("Error: Default Role not found."));
        // ^-- THIS IS THE FIX --^

        Status pendingStatus = statusRepository.findByName("PENDING")
                .orElseThrow(() -> new RuntimeException("Error: Default Status not found."));

        user.setRole(userRole);
        user.setStatus(pendingStatus);

        User savedUser = userRepository.save(user);
        
        // FIX: Send notification to all admins about new user registration
        notifyAdminsOfNewRegistration(savedUser);

        // Audit registration
        try {
            auditService.logAction(
                    savedUser,
                    AuditLog.ActionType.USER_CREATED,
                    "User",
                    savedUser.getId(),
                    savedUser.getFullName(),
                    Map.of(
                            "email", savedUser.getEmail(),
                            "status", savedUser.getStatus().getName(),
                            "role", savedUser.getRole().getName()
                    )
            );
        } catch (Exception e) {
            log.error("Failed to audit registration for {}: {}", savedUser.getEmail(), e.getMessage());
        }
        
        return savedUser;
    }
    
    /**
     * Notify all admin users when a new user registers
     */
    private void notifyAdminsOfNewRegistration(User newUser) {
        try {
            // Find all users with Admin role
            List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "Admin".equalsIgnoreCase(u.getRole().getName()))
                .filter(u -> u.getStatus() != null && "ACTIVE".equalsIgnoreCase(u.getStatus().getName()))
                .collect(Collectors.toList());
            
            if (admins.isEmpty()) {
                log.warn("No active admin users found to notify about new registration");
                return;
            }
            
            // Send notification to each admin
            for (User admin : admins) {
                notificationService.notifyUser(
                    admin.getId(),
                    NotificationType.USER_REGISTERED,
                    "New User Registration",
                    String.format("%s %s (%s) has registered and is awaiting approval.",
                        newUser.getFirstName(), newUser.getLastName(), newUser.getEmail()),
                    "/user-management", // Link to user management page
                    NotificationPriority.HIGH,
                    "User",
                    newUser.getId(),
                    true // Send email notification
                );
            }
            
            log.info("Notified {} admin(s) about new user registration: {}", 
                    admins.size(), newUser.getEmail());
            
        } catch (Exception e) {
            // Don't fail registration if notification fails
            log.error("Failed to send admin notifications for new registration: {}", 
                     e.getMessage(), e);
        }
    }
}