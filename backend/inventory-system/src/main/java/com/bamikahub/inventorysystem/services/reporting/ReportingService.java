package com.bamikahub.inventorysystem.services.reporting;

import com.bamikahub.inventorysystem.dao.finance.RequisitionRepository;
import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dto.reporting.*;
import com.bamikahub.inventorysystem.models.finance.Requisition;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportingService {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private RequisitionRepository requisitionRepository;
    @Autowired private SupportTicketRepository ticketRepository;

    /**
     * Gathers data specifically for the main dashboard charts.
     */
    public DashboardChartsDto getDashboardChartsData() {
        DashboardChartsDto chartsData = new DashboardChartsDto();

        // 1. Inventory Value by Category
        List<CategoryValueDto> categoryValues = itemRepository.findAll().stream()
                .collect(Collectors.groupingBy(item -> item.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO,
                                item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                                BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> new CategoryValueDto(entry.getKey(), entry.getValue()))
                .toList();
        chartsData.setInventoryValueByCategory(categoryValues);

        // 2. Projects by Status
        List<ProjectStatusCountDto> projectCounts = projectRepository.findAll().stream()
                .collect(Collectors.groupingBy(project -> project.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new ProjectStatusCountDto(entry.getKey(), entry.getValue()))
                .toList();
        chartsData.setProjectsByStatus(projectCounts);

        return chartsData;
    }

    /**
     * Generates a complete valuation list of all inventory items.
     */
    public List<InventoryValuationDto> getInventoryValuationReport() {
        return itemRepository.findAll().stream()
                .map(InventoryValuationDto::new)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the total estimated cost of all approved or fulfilled requisitions per project.
     */
    public List<ProjectCostDto> getProjectCostReport() {
        return requisitionRepository.findAll().stream()
                .filter(req -> req.getStatus() == Requisition.RequisitionStatus.APPROVED_BY_FINANCE ||
                        req.getStatus() == Requisition.RequisitionStatus.FULFILLED ||
                        req.getStatus() == Requisition.RequisitionStatus.CLOSED)
                .collect(Collectors.groupingBy(req -> req.getProject()))
                .entrySet().stream()
                .map(entry -> {
                    BigDecimal totalCost = entry.getValue().stream()
                            .flatMap(req -> req.getItems().stream())
                            .map(item -> item.getEstimatedUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ProjectCostDto(entry.getKey().getId(), entry.getKey().getName(), totalCost);
                })
                .collect(Collectors.toList());
    }

    /**
     * Gathers summary data for the support ticket system.
     */
    public SupportTicketSummaryDto getSupportTicketSummary() {
        SupportTicketSummaryDto summary = new SupportTicketSummaryDto();

        List<TicketStatusCountDto> statusCounts = ticketRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new TicketStatusCountDto(e.getKey(), e.getValue()))
                .toList();
        summary.setTicketsByStatus(statusCounts);

        List<TicketCategoryCountDto> categoryCounts = ticketRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getCategory().getName().equals("OTHER") ? t.getOtherCategory() : t.getCategory().getName(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new TicketCategoryCountDto(e.getKey(), e.getValue()))
                .toList();
        summary.setTicketsByCategory(categoryCounts);

        return summary;
    }
}