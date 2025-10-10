package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.RoleRepository;
import com.bamikahub.inventorysystem.dao.StatusRepository;
import com.bamikahub.inventorysystem.dao.UserRepository;
import com.bamikahub.inventorysystem.dto.AuthRequest;
import com.bamikahub.inventorysystem.dto.JwtResponse;
import com.bamikahub.inventorysystem.dto.RegisterRequest;
import com.bamikahub.inventorysystem.models.Role;
import com.bamikahub.inventorysystem.models.Status;
import com.bamikahub.inventorysystem.models.User;
import com.bamikahub.inventorysystem.security.jwt.JwtUtil;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
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
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private StatusRepository statusRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtil jwtUtil;

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

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                role,
                userEntity.getProfilePictureUrl(),
                permissions
        );
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

        return userRepository.save(user);
    }
}