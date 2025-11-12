package com.bamikahub.inventorysystem.security.jwt;

import com.bamikahub.inventorysystem.models.guest.GuestUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "staff");
        return buildToken(userPrincipal.getUsername(), claims);
    }

    public String generateGuestToken(GuestUser guest) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "guest");
        claims.put("guestId", guest.getId());
        return buildToken(guest.getEmail(), claims);
    }

    private String buildToken(String subject, Map<String, Object> claims) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(claims)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims getClaims(String token) {
        return parse(token).getBody();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            parse(authToken);
            return true;
        } catch (Exception e) {
            // Log exception
        }
        return false;
    }

    public String getTokenRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public Long getGuestIdFromToken(String token) {
        Number guestId = getClaims(token).get("guestId", Number.class);
        return guestId != null ? guestId.longValue() : null;
    }
}








