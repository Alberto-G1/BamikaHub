package com.bamikahub.inventorysystem.help;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HelpController {

    private final HelpService helpService;

    // FAQ Endpoints
    @GetMapping("/faqs")
    public ResponseEntity<List<FAQDto>> getAllActiveFAQs() {
        List<FAQDto> faqs = helpService.getAllActiveFAQs();
        return ResponseEntity.ok(faqs);
    }

    @GetMapping("/faqs/categories")
    public ResponseEntity<List<String>> getFAQCategories() {
        List<String> categories = helpService.getFAQCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/faqs/category/{category}")
    public ResponseEntity<List<FAQDto>> getFAQsByCategory(@PathVariable String category) {
        List<FAQDto> faqs = helpService.getFAQsByCategory(category);
        return ResponseEntity.ok(faqs);
    }

    @GetMapping("/faqs/search")
    public ResponseEntity<List<FAQDto>> searchFAQs(@RequestParam String q) {
        List<FAQDto> faqs = helpService.searchFAQs(q);
        return ResponseEntity.ok(faqs);
    }

    @PostMapping("/faqs")
    public ResponseEntity<FAQDto> createFAQ(@RequestBody FAQDto faqDto) {
        FAQDto createdFAQ = helpService.createFAQ(faqDto);
        return ResponseEntity.ok(createdFAQ);
    }

    @PutMapping("/faqs/{id}")
    public ResponseEntity<FAQDto> updateFAQ(@PathVariable Long id, @RequestBody FAQDto faqDto) {
        FAQDto updatedFAQ = helpService.updateFAQ(id, faqDto);
        return ResponseEntity.ok(updatedFAQ);
    }

    @DeleteMapping("/faqs/{id}")
    public ResponseEntity<Void> deleteFAQ(@PathVariable Long id) {
        helpService.deleteFAQ(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/faqs/{id}/view")
    public ResponseEntity<Void> incrementFAQViewCount(@PathVariable Long id) {
        helpService.incrementFAQViewCount(id);
        return ResponseEntity.ok().build();
    }

    // Support Ticket Endpoints
    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDto> createSupportTicket(@RequestBody SupportTicketDto ticketDto) {
        SupportTicketDto createdTicket = helpService.createSupportTicket(ticketDto);
        return ResponseEntity.ok(createdTicket);
    }

    @GetMapping("/tickets")
    public ResponseEntity<Page<SupportTicketDto>> getUserTickets(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SupportTicketDto> tickets = helpService.getUserTickets(userId, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<SupportTicketDto> getTicketById(@PathVariable Long id) {
        SupportTicketDto ticket = helpService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<SupportTicketDto> updateTicketStatus(
            @PathVariable Long id,
            @RequestParam SupportTicket.TicketStatus status,
            @RequestParam String updatedBy) {
        SupportTicketDto updatedTicket = helpService.updateTicketStatus(id, status, updatedBy);
        return ResponseEntity.ok(updatedTicket);
    }

    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<TicketMessageDto> addMessageToTicket(
            @PathVariable Long ticketId,
            @RequestBody TicketMessageDto messageDto) {
        TicketMessageDto savedMessage = helpService.addMessageToTicket(ticketId, messageDto);
        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<List<TicketMessageDto>> getTicketMessages(@PathVariable Long ticketId) {
        List<TicketMessageDto> messages = helpService.getTicketMessages(ticketId);
        return ResponseEntity.ok(messages);
    }

    // Knowledge Base Endpoints
    @GetMapping("/articles")
    public ResponseEntity<Page<KnowledgeBaseArticleDto>> getPublishedArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KnowledgeBaseArticleDto> articles = helpService.getPublishedArticles(pageable);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/articles/categories")
    public ResponseEntity<List<String>> getArticleCategories() {
        List<String> categories = helpService.getArticleCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/articles/category/{category}")
    public ResponseEntity<Page<KnowledgeBaseArticleDto>> getArticlesByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KnowledgeBaseArticleDto> articles = helpService.getArticlesByCategory(category, pageable);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/articles/search")
    public ResponseEntity<Page<KnowledgeBaseArticleDto>> searchArticles(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KnowledgeBaseArticleDto> articles = helpService.searchArticles(q, pageable);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/articles/slug/{slug}")
    public ResponseEntity<KnowledgeBaseArticleDto> getArticleBySlug(@PathVariable String slug) {
        KnowledgeBaseArticleDto article = helpService.getArticleBySlug(slug);
        return ResponseEntity.ok(article);
    }

    @PostMapping("/articles/{id}/view")
    public ResponseEntity<Void> incrementArticleViewCount(@PathVariable Long id) {
        helpService.incrementArticleViewCount(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/articles/{id}/vote")
    public ResponseEntity<Void> voteArticleHelpful(
            @PathVariable Long id,
            @RequestParam boolean helpful) {
        helpService.voteArticleHelpful(id, helpful);
        return ResponseEntity.ok().build();
    }
}