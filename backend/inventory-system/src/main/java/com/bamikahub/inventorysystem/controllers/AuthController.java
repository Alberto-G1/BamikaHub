package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.AuthRequest;
import com.bamikahub.inventorysystem.dto.RegisterRequest;
import com.bamikahub.inventorysystem.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authService.loginUser(authRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.ok("User registered successfully! Awaiting admin approval.");
    }
}