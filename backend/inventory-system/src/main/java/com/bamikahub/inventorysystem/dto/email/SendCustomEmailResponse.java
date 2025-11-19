package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;
import java.util.Map;

@Data
public class SendCustomEmailResponse {
    private Long messageId;
    private Map<String, String> deliveryStatuses; // recipientEmail -> status
}
