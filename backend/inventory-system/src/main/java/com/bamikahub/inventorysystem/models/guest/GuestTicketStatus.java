package com.bamikahub.inventorysystem.models.guest;

/**
 * Represents ticket lifecycle states available to guest-submitted tickets.
 */
public enum GuestTicketStatus {
    PENDING,
    IN_PROGRESS,
    AWAITING_GUEST,
    RESOLVED,
    CLOSED
}
