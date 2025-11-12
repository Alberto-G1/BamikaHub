package com.bamikahub.inventorysystem.models.guest;

/**
 * Represents the lifecycle state of a guest user account.
 */
public enum GuestAccountStatus {
    PENDING_APPROVAL,
    ACTIVE,
    SUSPENDED,
    DEACTIVATED
}
