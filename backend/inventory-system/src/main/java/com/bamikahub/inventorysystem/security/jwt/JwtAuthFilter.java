
package com.bamikahub.inventorysystem.security.jwt;

import com.bamikahub.inventorysystem.models.guest.GuestAccountStatus;
import com.bamikahub.inventorysystem.models.guest.GuestUser;
import com.bamikahub.inventorysystem.repositories.guest.GuestUserRepository;
import com.bamikahub.inventorysystem.security.services.GuestUserDetails;
import com.bamikahub.inventorysystem.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserDetailsServiceImpl userDetailsService;
    @Autowired private GuestUserRepository guestUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtil.validateToken(jwt)) {
                String role = jwtUtil.getTokenRole(jwt);
                if ("guest".equalsIgnoreCase(role)) {
                    handleGuestAuthentication(jwt, request);
                } else {
                    handleStaffAuthentication(jwt, request);
                }
            }
        } catch (Exception e) {
            // Log error
        }
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    private void handleStaffAuthentication(String jwt, HttpServletRequest request) {
        String email = jwtUtil.getEmailFromToken(jwt);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void handleGuestAuthentication(String jwt, HttpServletRequest request) {
        Long guestId = jwtUtil.getGuestIdFromToken(jwt);
        if (guestId == null) {
            return;
        }
        GuestUser guest = guestUserRepository.findById(guestId).orElse(null);
        if (guest == null || guest.getStatus() != GuestAccountStatus.ACTIVE) {
            return;
        }

        GuestUserDetails userDetails = GuestUserDetails.from(guest);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}