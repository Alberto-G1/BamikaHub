package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.TicketActivity;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class TicketActivityResponse {
    Long id;
    TicketActivity.ActionType actionType;
    String details;
    LocalDateTime createdAt;
    Long performedById;
    String performedByName;
}
