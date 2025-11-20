package com.bamikahub.inventorysystem.controllers.admin;

import com.bamikahub.inventorysystem.dto.email.EmailTemplateRequest;
import com.bamikahub.inventorysystem.dto.email.EmailTemplateResponse;
import com.bamikahub.inventorysystem.models.email.EmailTemplate;
import com.bamikahub.inventorysystem.services.email.AdminEmailService;
import com.bamikahub.inventorysystem.dao.email.EmailTemplateRepository;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import com.bamikahub.inventorysystem.dto.email.EmailTemplatePreviewRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.dto.email.SendCustomEmailRequest;
import com.bamikahub.inventorysystem.dto.email.SendCustomEmailResponse;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Collections;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/admin/email/templates")
@RequiredArgsConstructor
public class AdminEmailTemplateController {

    private final EmailTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final AdminEmailService adminEmailService;
    private final TemplateEngine templateEngine;

    @GetMapping
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<List<EmailTemplateResponse>> listTemplates() {
        List<EmailTemplateResponse> list = templateRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<EmailTemplateResponse> create(@RequestBody EmailTemplateRequest req,
                                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User creator = userRepository.findById(userDetails.getId()).orElse(null);
        EmailTemplate template = EmailTemplate.builder()
                .name(req.getName())
                .subject(req.getSubject())
                .body(req.getBody())
                .createdBy(creator)
                .build();
        EmailTemplate saved = templateRepository.save(template);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<EmailTemplateResponse> update(@PathVariable Long id, @RequestBody EmailTemplateRequest req,
                                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        EmailTemplate t = templateRepository.findById(id).orElseThrow(() -> new RuntimeException("Template not found"));
        t.setName(req.getName());
        t.setSubject(req.getSubject());
        t.setBody(req.getBody());
        // Optionally set updatedBy - model does not have updatedBy field currently
        EmailTemplate saved = templateRepository.save(t);
        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<String> preview(@RequestBody EmailTemplatePreviewRequest req) {
        String html;
        Context context = new Context();
        if (req.getVars() != null) {
            context.setVariables(req.getVars());
        }
        if (req.getTemplateId() != null) {
            EmailTemplate t = templateRepository.findById(req.getTemplateId()).orElseThrow(() -> new RuntimeException("Template not found"));
            html = templateEngine.process(t.getBody(), context);
        } else if (req.getBody() != null) {
            html = templateEngine.process(req.getBody(), context);
        } else {
            html = "";
        }
        return ResponseEntity.ok(html);
    }

    @PostMapping("/variables")
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<Map<String, Object>> fetchUserVariables(@RequestBody List<Long> userIds) {
        Map<String, Object> result = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            result.put("users", Collections.emptyList());
            result.put("merged", Collections.emptyMap());
            return ResponseEntity.ok(result);
        }
        List<Map<String, Object>> usersVars = new ArrayList<>();
        List<com.bamikahub.inventorysystem.models.user.User> users = userRepository.findAllById(userIds);
        for (com.bamikahub.inventorysystem.models.user.User u : users) {
            Map<String, Object> vars = new HashMap<>();
            vars.put("id", u.getId());
            vars.put("firstName", u.getFirstName());
            vars.put("lastName", u.getLastName());
            vars.put("fullName", u.getFullName());
            vars.put("email", u.getEmail());
            vars.put("username", u.getUsername());
            vars.put("department", u.getDepartment());
            vars.put("phoneNumber", u.getPhoneNumber());
            vars.put("profilePictureUrl", u.getProfilePictureUrl());
            vars.put("role", u.getRole() != null ? u.getRole().getName() : null);
            usersVars.add(vars);
        }
        // If single user, merged is that user's vars; otherwise leave merged empty (frontend can pick per-user)
        if (usersVars.size() == 1) {
            result.put("merged", usersVars.get(0));
        } else {
            result.put("merged", Collections.emptyMap());
        }
        result.put("users", usersVars);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('EMAIL_MANAGE_TEMPLATES')")
    public ResponseEntity<?> sendEmail(@RequestBody SendCustomEmailRequest req,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Preview mode: render and return HTML
        if (req.isPreview()) {
            Context context = new Context();
            if (req.getTemplateVars() != null) context.setVariables(req.getTemplateVars());
            String html;
            if (req.getTemplateId() != null) {
                EmailTemplate t = templateRepository.findById(req.getTemplateId()).orElseThrow(() -> new RuntimeException("Template not found"));
                TemplateEngine stringEngine = new TemplateEngine();
                StringTemplateResolver resolver = new StringTemplateResolver();
                stringEngine.setTemplateResolver(resolver);
                html = stringEngine.process(t.getBody(), context);
            } else if (req.getBody() != null) {
                TemplateEngine stringEngine = new TemplateEngine();
                StringTemplateResolver resolver = new StringTemplateResolver();
                stringEngine.setTemplateResolver(resolver);
                html = stringEngine.process(req.getBody(), context);
            } else {
                html = "";
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("previewHtml", html);
            return ResponseEntity.ok(resp);
        }

        // Actually send
        SendCustomEmailResponse resp = adminEmailService.sendCustomEmail(userDetails != null ? userDetails.getId() : null, req);
        return ResponseEntity.ok(resp);
    }

    private EmailTemplateResponse toResponse(EmailTemplate t) {
        EmailTemplateResponse r = new EmailTemplateResponse();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setSubject(t.getSubject());
        r.setBody(t.getBody());
        r.setCreatedAt(t.getCreatedAt());
        r.setCreatedById(t.getCreatedBy() != null ? t.getCreatedBy().getId() : null);
        return r;
    }
}
