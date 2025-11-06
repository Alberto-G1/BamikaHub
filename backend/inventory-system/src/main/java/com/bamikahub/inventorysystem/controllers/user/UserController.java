package com.bamikahub.inventorysystem.controllers.user;

import com.bamikahub.inventorysystem.dto.user.UserCreateRequest;
import com.bamikahub.inventorysystem.dto.user.UserDto;
import com.bamikahub.inventorysystem.dto.user.UserUpdateRequest;
import com.bamikahub.inventorysystem.services.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<UserDto> listActiveUsers() {
        return userService.getAllActiveUsers();
    }

    @GetMapping("/deactivated")
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<UserDto> listDeactivatedUsers() {
        return userService.getAllDeactivatedUsers();
    }

    // NEW ENDPOINT
    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('USER_UPDATE')") // Or a new 'USER_REACTIVATE' permission
    public ResponseEntity<Void> reactivateUser(@PathVariable Long id) {
        userService.reactivateUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public UserDto createUser(@RequestBody UserCreateRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public UserDto updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        return userService.updateUser(id, request);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('USER_APPROVE')")
    public UserDto approveRegistration(@PathVariable Long id, @RequestBody Integer roleId) {
        return userService.approveUser(id, roleId);
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok().build();
    }
}