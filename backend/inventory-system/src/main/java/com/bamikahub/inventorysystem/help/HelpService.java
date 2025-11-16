package com.bamikahub.inventorysystem.help;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class HelpService {

    private final FAQRepository faqRepository;
    private final HelpCenterSupportTicketRepository supportTicketRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final KnowledgeBaseArticleRepository knowledgeBaseRepository;

    // FAQ Operations
    public List<FAQDto> getAllActiveFAQs() {
        return faqRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToFAQDto)
                .toList();
    }

    public List<FAQDto> getFAQsByCategory(String category) {
        return faqRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category)
                .stream()
                .map(this::convertToFAQDto)
                .toList();
    }

    public List<String> getFAQCategories() {
        return faqRepository.findDistinctCategories();
    }

    public List<FAQDto> searchFAQs(String searchTerm) {
        return faqRepository.searchFAQs(searchTerm)
                .stream()
                .map(this::convertToFAQDto)
                .toList();
    }

    public FAQDto createFAQ(FAQDto faqDto) {
        FAQ faq = new FAQ();
        faq.setQuestion(faqDto.getQuestion());
        faq.setAnswer(faqDto.getAnswer());
        faq.setCategory(faqDto.getCategory());
        faq.setDisplayOrder(faqDto.getDisplayOrder() != null ? faqDto.getDisplayOrder() : 0);
        faq.setIsActive(faqDto.getIsActive() != null ? faqDto.getIsActive() : true);
        faq.setViewCount(0);
        faq.setCreatedBy(faqDto.getCreatedBy());
        faq.setUpdatedBy(faqDto.getUpdatedBy());

        FAQ savedFAQ = faqRepository.save(faq);
        return convertToFAQDto(savedFAQ);
    }

    public FAQDto updateFAQ(Long id, FAQDto faqDto) {
        Optional<FAQ> optionalFAQ = faqRepository.findById(id);
        if (optionalFAQ.isEmpty()) {
            throw new RuntimeException("FAQ not found");
        }

        FAQ faq = optionalFAQ.get();
        faq.setQuestion(faqDto.getQuestion());
        faq.setAnswer(faqDto.getAnswer());
        faq.setCategory(faqDto.getCategory());
        faq.setDisplayOrder(faqDto.getDisplayOrder());
        faq.setIsActive(faqDto.getIsActive());
        faq.setUpdatedBy(faqDto.getUpdatedBy());

        FAQ updatedFAQ = faqRepository.save(faq);
        return convertToFAQDto(updatedFAQ);
    }

    public void deleteFAQ(Long id) {
        faqRepository.deleteById(id);
    }

    public void incrementFAQViewCount(Long id) {
        Optional<FAQ> optionalFAQ = faqRepository.findById(id);
        if (optionalFAQ.isPresent()) {
            FAQ faq = optionalFAQ.get();
            faq.setViewCount(faq.getViewCount() + 1);
            faqRepository.save(faq);
        }
    }

    // Support Ticket Operations
    public SupportTicketDto createSupportTicket(SupportTicketDto ticketDto) {
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setUserId(ticketDto.getUserId());
        ticket.setSubject(ticketDto.getSubject());
        ticket.setDescription(ticketDto.getDescription());
        ticket.setPriority(ticketDto.getPriority() != null ? ticketDto.getPriority() : SupportTicket.TicketPriority.MEDIUM);
        ticket.setStatus(SupportTicket.TicketStatus.OPEN);
        ticket.setCategory(ticketDto.getCategory() != null ? ticketDto.getCategory() : SupportTicket.TicketCategory.GENERAL);
        ticket.setCreatedBy(ticketDto.getCreatedBy());
        ticket.setUpdatedBy(ticketDto.getUpdatedBy());

        SupportTicket savedTicket = supportTicketRepository.save(ticket);

        // Create initial message
        TicketMessage initialMessage = new TicketMessage();
        initialMessage.setTicket(savedTicket);
        initialMessage.setSenderId(ticketDto.getUserId());
        initialMessage.setSenderName(ticketDto.getCreatedBy());
        initialMessage.setMessage(ticketDto.getDescription());
        initialMessage.setMessageType(TicketMessage.MessageType.TEXT);
        initialMessage.setIsInternal(false);
        ticketMessageRepository.save(initialMessage);

        return convertToSupportTicketDto(savedTicket);
    }

    public Page<SupportTicketDto> getUserTickets(String userId, Pageable pageable) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToSupportTicketDto);
    }

    public SupportTicketDto getTicketById(Long id) {
        Optional<SupportTicket> optionalTicket = supportTicketRepository.findById(id);
        if (optionalTicket.isEmpty()) {
            throw new RuntimeException("Support ticket not found");
        }
        return convertToSupportTicketDto(optionalTicket.get());
    }

    public SupportTicketDto updateTicketStatus(Long id, SupportTicket.TicketStatus status, String updatedBy) {
        Optional<SupportTicket> optionalTicket = supportTicketRepository.findById(id);
        if (optionalTicket.isEmpty()) {
            throw new RuntimeException("Support ticket not found");
        }

        SupportTicket ticket = optionalTicket.get();
        ticket.setStatus(status);
        ticket.setUpdatedBy(updatedBy);

        if (status == SupportTicket.TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (status == SupportTicket.TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        SupportTicket updatedTicket = supportTicketRepository.save(ticket);
        return convertToSupportTicketDto(updatedTicket);
    }

    public TicketMessageDto addMessageToTicket(Long ticketId, TicketMessageDto messageDto) {
        Optional<SupportTicket> optionalTicket = supportTicketRepository.findById(ticketId);
        if (optionalTicket.isEmpty()) {
            throw new RuntimeException("Support ticket not found");
        }

        SupportTicket ticket = optionalTicket.get();

        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setSenderId(messageDto.getSenderId());
        message.setSenderName(messageDto.getSenderName());
        message.setMessage(messageDto.getMessage());
        message.setMessageType(messageDto.getMessageType() != null ? messageDto.getMessageType() : TicketMessage.MessageType.TEXT);
        message.setIsInternal(messageDto.getIsInternal() != null ? messageDto.getIsInternal() : false);
        message.setAttachmentUrl(messageDto.getAttachmentUrl());
        message.setAttachmentName(messageDto.getAttachmentName());

        TicketMessage savedMessage = ticketMessageRepository.save(message);

        // Update ticket's updated timestamp
        ticket.setUpdatedBy(messageDto.getSenderName());
        supportTicketRepository.save(ticket);

        return convertToTicketMessageDto(savedMessage);
    }

    public List<TicketMessageDto> getTicketMessages(Long ticketId) {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::convertToTicketMessageDto)
                .toList();
    }

    // Knowledge Base Operations
    public Page<KnowledgeBaseArticleDto> getPublishedArticles(Pageable pageable) {
        return knowledgeBaseRepository.findByIsPublishedTrueOrderByCreatedAtDesc(pageable)
                .map(this::convertToKnowledgeBaseArticleDto);
    }

    public Page<KnowledgeBaseArticleDto> getArticlesByCategory(String category, Pageable pageable) {
        return knowledgeBaseRepository.findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(category, pageable)
                .map(this::convertToKnowledgeBaseArticleDto);
    }

    public List<String> getArticleCategories() {
        return knowledgeBaseRepository.findDistinctCategories();
    }

    public Page<KnowledgeBaseArticleDto> searchArticles(String searchTerm, Pageable pageable) {
        return knowledgeBaseRepository.searchArticles(searchTerm, pageable)
                .map(this::convertToKnowledgeBaseArticleDto);
    }

    public KnowledgeBaseArticleDto getArticleBySlug(String slug) {
        KnowledgeBaseArticle article = knowledgeBaseRepository.findBySlug(slug);
        if (article == null) {
            throw new RuntimeException("Article not found");
        }
        return convertToKnowledgeBaseArticleDto(article);
    }

    public void incrementArticleViewCount(Long id) {
        Optional<KnowledgeBaseArticle> optionalArticle = knowledgeBaseRepository.findById(id);
        if (optionalArticle.isPresent()) {
            KnowledgeBaseArticle article = optionalArticle.get();
            article.setViewCount(article.getViewCount() + 1);
            knowledgeBaseRepository.save(article);
        }
    }

    public void voteArticleHelpful(Long id, boolean helpful) {
        Optional<KnowledgeBaseArticle> optionalArticle = knowledgeBaseRepository.findById(id);
        if (optionalArticle.isPresent()) {
            KnowledgeBaseArticle article = optionalArticle.get();
            if (helpful) {
                article.setHelpfulCount(article.getHelpfulCount() + 1);
            } else {
                article.setNotHelpfulCount(article.getNotHelpfulCount() + 1);
            }
            knowledgeBaseRepository.save(article);
        }
    }

    // Conversion methods
    private FAQDto convertToFAQDto(FAQ faq) {
        FAQDto dto = new FAQDto();
        dto.setId(faq.getId());
        dto.setQuestion(faq.getQuestion());
        dto.setAnswer(faq.getAnswer());
        dto.setCategory(faq.getCategory());
        dto.setDisplayOrder(faq.getDisplayOrder());
        dto.setIsActive(faq.getIsActive());
        dto.setViewCount(faq.getViewCount());
        dto.setCreatedAt(faq.getCreatedAt());
        dto.setUpdatedAt(faq.getUpdatedAt());
        dto.setCreatedBy(faq.getCreatedBy());
        dto.setUpdatedBy(faq.getUpdatedBy());
        return dto;
    }

    private SupportTicketDto convertToSupportTicketDto(SupportTicket ticket) {
        SupportTicketDto dto = new SupportTicketDto();
        dto.setId(ticket.getId());
        dto.setTicketNumber(ticket.getTicketNumber());
        dto.setUserId(ticket.getUserId());
        dto.setSubject(ticket.getSubject());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setCategory(ticket.getCategory());
        dto.setAssignedTo(ticket.getAssignedTo());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setResolution(ticket.getResolution());
        dto.setCreatedBy(ticket.getCreatedBy());
        dto.setUpdatedBy(ticket.getUpdatedBy());
        dto.setMessageCount(ticketMessageRepository.countPublicMessagesByTicketId(ticket.getId()).intValue());
        return dto;
    }

    private TicketMessageDto convertToTicketMessageDto(TicketMessage message) {
        TicketMessageDto dto = new TicketMessageDto();
        dto.setId(message.getId());
        dto.setTicketId(message.getTicket().getId());
        dto.setSenderId(message.getSenderId());
        dto.setSenderName(message.getSenderName());
        dto.setMessage(message.getMessage());
        dto.setMessageType(message.getMessageType());
        dto.setIsInternal(message.getIsInternal());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setAttachmentUrl(message.getAttachmentUrl());
        dto.setAttachmentName(message.getAttachmentName());
        return dto;
    }

    private KnowledgeBaseArticleDto convertToKnowledgeBaseArticleDto(KnowledgeBaseArticle article) {
        KnowledgeBaseArticleDto dto = new KnowledgeBaseArticleDto();
        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setContent(article.getContent());
        dto.setSummary(article.getSummary());
        dto.setCategory(article.getCategory());
        dto.setTags(article.getTags());
        dto.setIsPublished(article.getIsPublished());
        dto.setViewCount(article.getViewCount());
        dto.setHelpfulCount(article.getHelpfulCount());
        dto.setNotHelpfulCount(article.getNotHelpfulCount());
        dto.setCreatedAt(article.getCreatedAt());
        dto.setUpdatedAt(article.getUpdatedAt());
        dto.setPublishedAt(article.getPublishedAt());
        dto.setAuthorId(article.getAuthorId());
        dto.setAuthorName(article.getAuthorName());
        dto.setLastEditedBy(article.getLastEditedBy());
        dto.setFeaturedImageUrl(article.getFeaturedImageUrl());
        dto.setSlug(article.getSlug());
        return dto;
    }

    private String generateTicketNumber() {
        return "TICK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}