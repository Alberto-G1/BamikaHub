package com.bamikahub.inventorysystem.services.reporting;

import com.bamikahub.inventorysystem.dao.finance.RequisitionRepository;
import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.inventory.StockTransactionRepository;
import com.bamikahub.inventorysystem.dao.operations.DailyFieldReportRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.operations.SiteRepository;
import com.bamikahub.inventorysystem.dao.reporting.ReportHistoryRepository;
import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.reporting.*;
import com.bamikahub.inventorysystem.models.finance.Requisition;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import com.bamikahub.inventorysystem.models.inventory.StockTransaction;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.reporting.ReportHistory;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ReportingService {

    @Autowired private InventoryItemRepository itemRepository;
        @Autowired private ProjectRepository projectRepository;
        @Autowired private SiteRepository siteRepository;
        @Autowired private DailyFieldReportRepository fieldReportRepository;
    @Autowired private RequisitionRepository requisitionRepository;
    @Autowired private SupportTicketRepository ticketRepository;
    @Autowired private StockTransactionRepository transactionRepository;
    @Autowired private ReportHistoryRepository reportHistoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;

    /**
     * Gathers data specifically for the main dashboard charts.
     * Cached for 5 minutes to optimize performance.
     */
    @Cacheable(value = "dashboardCharts", unless = "#result == null")
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

        List<SiteReportSummaryDto> siteSummaries = siteRepository.findAll().stream()
                .map(site -> new SiteReportSummaryDto(
                        site.getProject() != null ? site.getProject().getId() : null,
                        site.getProject() != null ? site.getProject().getName() : null,
                        site.getId(),
                        site.getName(),
                        site.getLocation(),
                        fieldReportRepository.countBySiteId(site.getId()),
                        false
                ))
                .toList();

        List<SiteReportSummaryDto> projectRollups = projectRepository.findAll().stream()
                .map(project -> new SiteReportSummaryDto(
                        project.getId(),
                        project.getName(),
                        null,
                        "Whole Project",
                        null,
                        fieldReportRepository.countByProjectIdAndSiteIsNull(project.getId()),
                        true
                ))
                .toList();

        List<SiteReportSummaryDto> fieldReportsBySite = Stream.concat(projectRollups.stream(), siteSummaries.stream())
                .filter(summary -> summary.getReportCount() > 0)
                .sorted(Comparator.comparingLong(SiteReportSummaryDto::getReportCount).reversed())
                .limit(10)
                .toList();
        chartsData.setFieldReportsBySite(fieldReportsBySite);

        return chartsData;
    }

    /**
     * Computes revenue generated from stock-out transactions and COGS using transaction unitCost.
     * Revenue uses current item unitPrice for simplicity; could be extended to capture sale price per transaction.
     */
    public StockOutRevenueSummaryDto getStockOutRevenueSummary(ReportRequestDto request) {
        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(1);
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Filter OUT transactions by date range (inclusive) and optional category
        List<StockTransaction> outs = transactionRepository.findAll().stream()
                .filter(t -> t.getType() == StockTransaction.TransactionType.OUT)
                .filter(t -> t.getCreatedAt() != null)
                .filter(t -> {
                    LocalDate d = t.getCreatedAt().toLocalDate();
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .filter(t -> request.getCategoryId() == null ||
                        (t.getItem() != null && t.getItem().getCategory() != null &&
                                t.getItem().getCategory().getId().equals(request.getCategoryId())))
                .toList();

        Map<Long, List<StockTransaction>> byItem = outs.stream()
                .collect(Collectors.groupingBy(t -> t.getItem().getId()));

        List<StockOutItemDto> items = byItem.entrySet().stream()
                .map(entry -> {
                    InventoryItem item = entry.getValue().get(0).getItem();
                    long qty = entry.getValue().stream().mapToLong(StockTransaction::getQuantity).sum();
                    BigDecimal revenue = item.getUnitPrice().multiply(BigDecimal.valueOf(qty));
                    BigDecimal cogs = entry.getValue().stream()
                            .map(t -> (t.getUnitCost() != null ? t.getUnitCost() : BigDecimal.ZERO)
                                    .multiply(BigDecimal.valueOf(t.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal margin = revenue.subtract(cogs);
                    double marginPct = revenue.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                            : margin.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();

                    return StockOutItemDto.builder()
                            .itemId(item.getId())
                            .itemName(item.getName())
                            .sku(item.getSku())
                            .quantityOut(qty)
                            .revenue(revenue)
                            .cogs(cogs)
                            .margin(margin)
                            .marginPercentage(marginPct)
                            .build();
                })
                .sorted(Comparator.comparing(StockOutItemDto::getRevenue).reversed())
                .toList();

        long totalQty = items.stream().mapToLong(StockOutItemDto::getQuantityOut).sum();
        BigDecimal totalRevenue = items.stream().map(StockOutItemDto::getRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCogs = items.stream().map(StockOutItemDto::getCogs).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMargin = totalRevenue.subtract(totalCogs);

        trackReportGeneration("STOCK_OUT_REVENUE", "Stock-Out Revenue Summary", request, items.size());

        return StockOutRevenueSummaryDto.builder()
                .totalItemsCount((long) items.size())
                .totalQuantityOut(totalQty)
                .totalRevenue(totalRevenue)
                .totalCogs(totalCogs)
                .totalMargin(totalMargin)
                .items(items)
                .build();
    }

    /**
     * Multi-series finance trend: revenue (stock-outs), expenditure (fulfilled/closed requisitions), and net.
     */
    public FinancePerformanceTrendDto getFinancePerformanceTrend(ReportRequestDto request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(12);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Revenue per period from stock-out transactions
        Map<String, BigDecimal> revenueByPeriod = transactionRepository.findAll().stream()
                .filter(t -> t.getType() == StockTransaction.TransactionType.OUT)
                .filter(t -> t.getCreatedAt() != null)
                .filter(t -> {
                    LocalDate d = t.getCreatedAt().toLocalDate();
                    return !d.isBefore(startDate) && !d.isAfter(endDate);
                })
                .collect(Collectors.groupingBy(
                        t -> formatPeriod(t.getCreatedAt().toLocalDate(), request.getAggregationLevel()),
                        Collectors.reducing(BigDecimal.ZERO,
                                t -> t.getItem().getUnitPrice().multiply(BigDecimal.valueOf(t.getQuantity())),
                                BigDecimal::add)
                ));

        // Expenditure per period from fulfilled/closed requisitions
        Map<String, BigDecimal> expendByPeriod = requisitionRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null)
                .filter(r -> r.getStatus() == Requisition.RequisitionStatus.FULFILLED || r.getStatus() == Requisition.RequisitionStatus.CLOSED)
                .filter(r -> {
                    LocalDate d = r.getCreatedAt().toLocalDate();
                    return !d.isBefore(startDate) && !d.isAfter(endDate);
                })
                .collect(Collectors.groupingBy(
                        r -> formatPeriod(r.getCreatedAt().toLocalDate(), request.getAggregationLevel()),
                        Collectors.reducing(BigDecimal.ZERO,
                                r -> r.getItems().stream()
                                        .map(i -> i.getEstimatedUnitCost().multiply(BigDecimal.valueOf(i.getQuantity())))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                                BigDecimal::add)
                ));

        // Merge periods
        Set<String> periods = new TreeSet<>();
        periods.addAll(revenueByPeriod.keySet());
        periods.addAll(expendByPeriod.keySet());

        List<FinancePerformancePointDto> points = periods.stream()
                .sorted()
                .map(p -> {
                    BigDecimal rev = revenueByPeriod.getOrDefault(p, BigDecimal.ZERO);
                    BigDecimal exp = expendByPeriod.getOrDefault(p, BigDecimal.ZERO);
                    return FinancePerformancePointDto.builder()
                            .period(p)
                            .revenue(rev)
                            .expenditure(exp)
                            .net(rev.subtract(exp))
                            .build();
                })
                .toList();

        trackReportGeneration("FINANCE_PERFORMANCE_TREND", "Finance Performance Trend", request, points.size());

        return FinancePerformanceTrendDto.builder()
                .reportType("FINANCE_PERFORMANCE_TREND")
                .aggregationLevel(request.getAggregationLevel() != null ? request.getAggregationLevel() : "MONTHLY")
                .dataPoints(points)
                .summary("Finance performance from " + startDate + " to " + endDate)
                .build();
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

    // ============= OPERATIONS REPORTS =============

    /**
     * Project performance analysis by department with filtering.
     */
    public List<ProjectPerformanceDto> getProjectPerformance(ReportRequestDto request) {
        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> applyProjectFilters(p, request))
                .toList();

        trackReportGeneration("PROJECT_PERFORMANCE", "Project Performance Report", request, projects.size());

        return projects.stream()
                .map(project -> {
                    Integer duration = project.getStartDate() != null && project.getEndDate() != null
                            ? (int) ChronoUnit.DAYS.between(project.getStartDate(), project.getEndDate())
                            : null;
                    
                    // Calculate completion percentage based on status
                    Double completionPercentage = switch (project.getStatus()) {
                        case COMPLETED -> 100.0;
                        case IN_PROGRESS -> 50.0;
                        case PLANNING -> 10.0;
                        case ON_HOLD -> 30.0;
                        case CANCELLED -> 0.0;
                    };
                    
                    return ProjectPerformanceDto.builder()
                            .projectId(project.getId())
                            .projectName(project.getName())
                            .status(project.getStatus().name())
                            .startDate(project.getStartDate())
                            .expectedEndDate(project.getEndDate())
                            .actualEndDate(project.getStatus() == Project.ProjectStatus.COMPLETED ? project.getEndDate() : null)
                            .completionPercentage(completionPercentage)
                            .durationDays(duration)
                            .delayDays(0)
                            .build();
                })
                .toList();
    }

    /**
     * Project delay analysis - identifies overdue projects.
     */
    public List<ProjectDelayDto> getProjectDelays(ReportRequestDto request) {
        LocalDate now = LocalDate.now();
        List<Project> delayedProjects = projectRepository.findAll().stream()
                .filter(p -> !p.isArchived()) // Exclude archived projects
                .filter(p -> p.getStatus() != Project.ProjectStatus.COMPLETED && p.getStatus() != Project.ProjectStatus.CANCELLED)
                .filter(p -> p.getEndDate() != null && p.getEndDate().isBefore(now))
                .filter(p -> applyProjectFilters(p, request))
                .toList();

        trackReportGeneration("PROJECT_DELAYS", "Project Delay Analysis", request, delayedProjects.size());

        return delayedProjects.stream()
                .map(project -> ProjectDelayDto.builder()
                        .projectId(project.getId())
                        .projectName(project.getName())
                        .delayDays((int) ChronoUnit.DAYS.between(project.getEndDate(), now))
                        .delayCause("Analysis Required")
                        .build())
                .toList();
    }

    /**
     * Monthly project completion trend.
     */
    public TrendReportDto getProjectCompletionTrend(ReportRequestDto request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(12);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        List<Project> completedProjects = projectRepository.findAll().stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED)
                .filter(p -> p.getEndDate() != null
                        && !p.getEndDate().isBefore(startDate)
                        && !p.getEndDate().isAfter(endDate))
                .toList();

        Map<String, Long> groupedData = completedProjects.stream()
                .collect(Collectors.groupingBy(
                        p -> formatPeriod(p.getEndDate(), request.getAggregationLevel()),
                        Collectors.counting()
                ));

        List<TrendDataPointDto> dataPoints = groupedData.entrySet().stream()
                .map(entry -> TrendDataPointDto.builder()
                        .period(entry.getKey())
                        .count(entry.getValue())
                        .label("Completions")
                        .build())
                .sorted(Comparator.comparing(TrendDataPointDto::getPeriod))
                .toList();

        trackReportGeneration("PROJECT_COMPLETION_TREND", "Project Completion Trend", request, dataPoints.size());

        return TrendReportDto.builder()
                .reportType("PROJECT_COMPLETION_TREND")
                .aggregationLevel(request.getAggregationLevel() != null ? request.getAggregationLevel() : "MONTHLY")
                .dataPoints(dataPoints)
                .summary("Project completion trends from " + startDate + " to " + endDate)
                .build();
    }

    // ============= FINANCE REPORTS =============

    /**
     * Requisitions grouped by status.
     */
    public List<RequisitionStatusDto> getRequisitionsByStatus(ReportRequestDto request) {
        List<Requisition> requisitions = requisitionRepository.findAll().stream()
                .filter(r -> applyRequisitionFilters(r, request))
                .toList();

        Map<Requisition.RequisitionStatus, List<Requisition>> grouped = requisitions.stream()
                .collect(Collectors.groupingBy(Requisition::getStatus));

        trackReportGeneration("REQUISITION_STATUS", "Requisitions by Status", request, requisitions.size());

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<Requisition> reqs = entry.getValue();
                    BigDecimal total = reqs.stream()
                            .flatMap(r -> r.getItems().stream())
                            .map(item -> item.getEstimatedUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return RequisitionStatusDto.builder()
                            .status(entry.getKey().name())
                            .count((long) reqs.size())
                            .totalValue(total)
                            .averageValue(reqs.isEmpty() ? 0.0 : total.divide(BigDecimal.valueOf(reqs.size()), 2, RoundingMode.HALF_UP).doubleValue())
                            .build();
                })
                .toList();
    }

    /**
     * Monthly expenditure trend analysis.
     */
    public TrendReportDto getMonthlyExpenditureTrend(ReportRequestDto request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(12);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        List<Requisition> requisitions = requisitionRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null)
                .filter(r -> {
                    LocalDate reqDate = r.getCreatedAt().toLocalDate();
                    return !reqDate.isBefore(startDate) && !reqDate.isAfter(endDate);
                })
                .filter(r -> r.getStatus() == Requisition.RequisitionStatus.FULFILLED || r.getStatus() == Requisition.RequisitionStatus.CLOSED)
                .toList();

        Map<String, BigDecimal> groupedData = requisitions.stream()
                .collect(Collectors.groupingBy(
                        r -> formatPeriod(r.getCreatedAt().toLocalDate(), request.getAggregationLevel()),
                        Collectors.reducing(BigDecimal.ZERO,
                                r -> r.getItems().stream()
                                        .map(item -> item.getEstimatedUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                                BigDecimal::add)
                ));

        List<TrendDataPointDto> dataPoints = groupedData.entrySet().stream()
                .map(entry -> TrendDataPointDto.builder()
                        .period(entry.getKey())
                        .value(entry.getValue())
                        .label("Expenditure")
                        .build())
                .sorted(Comparator.comparing(TrendDataPointDto::getPeriod))
                .toList();

        trackReportGeneration("MONTHLY_EXPENDITURE", "Monthly Expenditure Trend", request, dataPoints.size());

        return TrendReportDto.builder()
                .reportType("MONTHLY_EXPENDITURE_TREND")
                .aggregationLevel(request.getAggregationLevel() != null ? request.getAggregationLevel() : "MONTHLY")
                .dataPoints(dataPoints)
                .summary("Expenditure trends from " + startDate + " to " + endDate)
                .build();
    }

    /**
     * Budget vs Actual cost analysis per project.
     */
    public List<BudgetVsActualDto> getBudgetVsActual(ReportRequestDto request) {
        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> applyProjectFilters(p, request))
                .toList();

        trackReportGeneration("BUDGET_VS_ACTUAL", "Budget vs Actual Cost", request, projects.size());

        return projects.stream()
                .map(project -> {
                    // Get all requisitions for this project
                    List<Requisition> projectRequisitions = requisitionRepository.findAll().stream()
                            .filter(r -> r.getProject() != null && r.getProject().getId().equals(project.getId()))
                            .toList();
                    
                    // Budgeted: sum of all approved/pending requisition estimates (excluding rejected)
                    BigDecimal budgeted = projectRequisitions.stream()
                            .filter(r -> r.getStatus() != Requisition.RequisitionStatus.REJECTED)
                            .flatMap(r -> r.getItems().stream())
                            .map(item -> item.getEstimatedUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    // Actual: sum of fulfilled/closed requisitions only
                    BigDecimal actual = projectRequisitions.stream()
                            .filter(r -> r.getStatus() == Requisition.RequisitionStatus.FULFILLED || r.getStatus() == Requisition.RequisitionStatus.CLOSED)
                            .flatMap(r -> r.getItems().stream())
                            .map(item -> item.getEstimatedUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal variance = budgeted.subtract(actual);
                    double variancePercent = budgeted.compareTo(BigDecimal.ZERO) == 0 ? 0
                            : variance.divide(budgeted, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();

                    String status = variance.compareTo(BigDecimal.ZERO) > 0 ? "UNDER_BUDGET"
                            : variance.compareTo(BigDecimal.ZERO) < 0 ? "OVER_BUDGET" : "ON_BUDGET";

                    return BudgetVsActualDto.builder()
                            .projectId(project.getId())
                            .projectName(project.getName())
                            .budgetedCost(budgeted)
                            .actualCost(actual)
                            .variance(variance)
                            .variancePercentage(variancePercent)
                            .status(status)
                            .build();
                })
                .toList();
    }

    // ============= INVENTORY REPORTS =============

    /**
     * Stock movement analysis over time.
     */
    public List<StockMovementDto> getStockMovementReport(ReportRequestDto request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        List<InventoryItem> items = itemRepository.findAll().stream()
                .filter(item -> request.getCategoryId() == null || item.getCategory().getId().equals(request.getCategoryId()))
                .toList();

        trackReportGeneration("STOCK_MOVEMENT", "Stock Movement Report", request, items.size());

        return items.stream()
                .map(item -> {
                    List<StockTransaction> transactions = transactionRepository.findAll().stream()
                            .filter(t -> t.getItem().getId().equals(item.getId()))
                            .filter(t -> t.getCreatedAt() != null
                                    && !t.getCreatedAt().toLocalDate().isBefore(startDate)
                                    && !t.getCreatedAt().toLocalDate().isAfter(endDate))
                            .toList();

                    int stockIn = transactions.stream()
                            .filter(t -> t.getType() == StockTransaction.TransactionType.IN)
                            .mapToInt(StockTransaction::getQuantity)
                            .sum();

                    int stockOut = transactions.stream()
                            .filter(t -> t.getType() == StockTransaction.TransactionType.OUT)
                            .mapToInt(StockTransaction::getQuantity)
                            .sum();

                    return StockMovementDto.builder()
                            .itemId(item.getId())
                            .itemName(item.getName())
                            .sku(item.getSku())
                            .initialStock(item.getQuantity() - stockIn + stockOut)
                            .stockIn(stockIn)
                            .stockOut(stockOut)
                            .finalStock(item.getQuantity())
                            .reorderFrequency((int) transactions.stream()
                                    .filter(t -> t.getType() == StockTransaction.TransactionType.IN).count())
                            .build();
                })
                .toList();
    }

    // ============= SUPPORT REPORTS =============

    /**
     * SLA compliance report by priority.
     */
    public List<SlaComplianceDto> getSlaComplianceReport(ReportRequestDto request) {
        List<SupportTicket> tickets = ticketRepository.findAll().stream()
                .filter(t -> applySupportTicketFilters(t, request))
                .toList();

        Map<SupportTicket.TicketPriority, List<SupportTicket>> grouped = tickets.stream()
                .collect(Collectors.groupingBy(SupportTicket::getPriority));

        trackReportGeneration("SLA_COMPLIANCE", "SLA Compliance Report", request, tickets.size());

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<SupportTicket> priorityTickets = entry.getValue();
                    long responseMet = priorityTickets.stream().filter(t -> !t.isResponseBreached()).count();
                    long resolutionMet = priorityTickets.stream().filter(t -> !t.isResolutionBreached()).count();

                    double avgResponseHours = priorityTickets.stream()
                            .filter(t -> t.getFirstResponseAt() != null)
                            .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getFirstResponseAt()).toHours())
                            .average().orElse(0);

                    double avgResolutionHours = priorityTickets.stream()
                            .filter(t -> t.getResolvedAt() != null)
                            .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours())
                            .average().orElse(0);

                    return SlaComplianceDto.builder()
                            .priority(entry.getKey().name())
                            .totalTickets((long) priorityTickets.size())
                            .responseMetCount(responseMet)
                            .resolutionMetCount(resolutionMet)
                            .responseCompliancePercentage(priorityTickets.isEmpty() ? 0 : (responseMet * 100.0) / priorityTickets.size())
                            .resolutionCompliancePercentage(priorityTickets.isEmpty() ? 0 : (resolutionMet * 100.0) / priorityTickets.size())
                            .averageResponseHours(avgResponseHours)
                            .averageResolutionHours(avgResolutionHours)
                            .build();
                })
                .toList();
    }

    /**
     * Ticket volume trend over time.
     */
    public TrendReportDto getTicketVolumeTrend(ReportRequestDto request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().minusMonths(6);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        List<SupportTicket> tickets = ticketRepository.findAll().stream()
                .filter(t -> t.getCreatedAt() != null)
                .filter(t -> {
                    LocalDate ticketDate = t.getCreatedAt().toLocalDate();
                    return !ticketDate.isBefore(startDate) && !ticketDate.isAfter(endDate);
                })
                .filter(t -> applySupportTicketFilters(t, request))
                .toList();

        Map<String, Long> groupedData = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> formatPeriod(t.getCreatedAt().toLocalDate(), request.getAggregationLevel()),
                        Collectors.counting()
                ));

        List<TrendDataPointDto> dataPoints = groupedData.entrySet().stream()
                .map(entry -> TrendDataPointDto.builder()
                        .period(entry.getKey())
                        .count(entry.getValue())
                        .label("Tickets")
                        .build())
                .sorted(Comparator.comparing(TrendDataPointDto::getPeriod))
                .toList();

        trackReportGeneration("TICKET_VOLUME_TREND", "Ticket Volume Trend", request, dataPoints.size());

        return TrendReportDto.builder()
                .reportType("TICKET_VOLUME_TREND")
                .aggregationLevel(request.getAggregationLevel() != null ? request.getAggregationLevel() : "MONTHLY")
                .dataPoints(dataPoints)
                .summary("Ticket volume trends from " + startDate + " to " + endDate)
                .build();
    }

    // ============= HELPER METHODS =============

    private boolean applyProjectFilters(Project project, ReportRequestDto request) {
        if (request.getProjectId() != null && !project.getId().equals(request.getProjectId())) {
            return false;
        }
        if (request.getStatus() != null && !project.getStatus().name().equals(request.getStatus())) {
            return false;
        }
        if (request.getStartDate() != null && project.getStartDate() != null && project.getStartDate().isBefore(request.getStartDate())) {
            return false;
        }
        if (request.getEndDate() != null && project.getEndDate() != null && project.getEndDate().isAfter(request.getEndDate())) {
            return false;
        }
        return true;
    }

    private boolean applyRequisitionFilters(Requisition req, ReportRequestDto request) {
        if (request.getProjectId() != null && (req.getProject() == null || !req.getProject().getId().equals(request.getProjectId()))) {
            return false;
        }
        if (request.getStatus() != null && !req.getStatus().name().equals(request.getStatus())) {
            return false;
        }
        if (request.getStartDate() != null && req.getCreatedAt() != null && req.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) {
            return false;
        }
        if (request.getEndDate() != null && req.getCreatedAt() != null && req.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) {
            return false;
        }
        return true;
    }

    private boolean applySupportTicketFilters(SupportTicket ticket, ReportRequestDto request) {
        if (request.getStatus() != null && !ticket.getStatus().name().equals(request.getStatus())) {
            return false;
        }
        if (request.getPriority() != null && !ticket.getPriority().name().equals(request.getPriority())) {
            return false;
        }
        if (request.getStartDate() != null && ticket.getCreatedAt() != null && ticket.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) {
            return false;
        }
        if (request.getEndDate() != null && ticket.getCreatedAt() != null && ticket.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) {
            return false;
        }
        return true;
    }

    private String formatPeriod(LocalDate date, String aggregationLevel) {
        if (aggregationLevel == null) {
            aggregationLevel = "MONTHLY";
        }

        return switch (aggregationLevel) {
            case "DAILY" -> date.format(DateTimeFormatter.ISO_LOCAL_DATE);
            case "WEEKLY" -> date.getYear() + "-W" + date.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            case "MONTHLY" -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            default -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        };
    }

    private void trackReportGeneration(String reportType, String reportName, ReportRequestDto request, int recordCount) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email).orElse(null);

            String filterJson = objectMapper.writeValueAsString(request);
            String version = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

            ReportHistory history = ReportHistory.builder()
                    .reportType(reportType)
                    .reportName(reportName)
                    .generatedBy(user)
                    .generatedAt(LocalDateTime.now())
                    .exportFormat(request.getExportFormat())
                    .filterParameters(filterJson)
                    .recordCount(recordCount)
                    .status("SUCCESS")
                    .version(version)
                    .build();

            reportHistoryRepository.save(history);
        } catch (Exception e) {
            // Log error but don't fail the report generation
            System.err.println("Failed to track report generation: " + e.getMessage());
        }
    }

    public List<ReportHistory> getReportHistory() {
        return reportHistoryRepository.findAll();
    }
}