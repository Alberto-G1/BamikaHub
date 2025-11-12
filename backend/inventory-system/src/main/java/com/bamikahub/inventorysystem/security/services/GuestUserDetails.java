package com.bamikahub.inventorysystem.security.services;

import com.bamikahub.inventorysystem.models.guest.GuestAccountStatus;
import com.bamikahub.inventorysystem.models.guest.GuestUser;
import java.util.Collection;
import java.util.Collections;
import java.util.Objects;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class GuestUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String fullName;
    private final boolean active;

    private GuestUserDetails(Long id, String email, String fullName, boolean active) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.active = active;
    }

    public static GuestUserDetails from(GuestUser guest) {
        Objects.requireNonNull(guest, "guest must not be null");
        boolean active = guest.getStatus() == GuestAccountStatus.ACTIVE;
        return new GuestUserDetails(guest.getId(), guest.getEmail(), guest.getFullName(), active);
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public boolean isActive() {
        return active;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_GUEST"));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return active;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
