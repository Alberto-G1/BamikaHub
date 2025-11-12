package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestAccountStatus;
import lombok.Data;

@Data
public class GuestUserStatusUpdateRequest {
    private GuestAccountStatus status;
}
