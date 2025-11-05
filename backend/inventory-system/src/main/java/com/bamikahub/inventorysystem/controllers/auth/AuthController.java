package com.bamikahub.inventorysystem.controllers.auth;

import com.bamikahub.inventorysystem.dto.auth.AuthRequest;
import com.bamikahub.inventorysystem.dto.auth.RegisterRequest;
import com.bamikahub.inventorysystem.services.auth.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authService.loginUser(authRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.ok("User registered successfully! Awaiting admin approval.");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        authService.logoutCurrentUser();
        return ResponseEntity.ok("Logged out successfully.");
    }
}