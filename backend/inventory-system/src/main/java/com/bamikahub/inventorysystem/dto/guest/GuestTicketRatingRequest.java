package com.bamikahub.inventorysystem.dto.guest;

import lombok.Data;

@Data
public class GuestTicketRatingRequest {
    private Integer ratingScore;
    private String ratingComment;
}
