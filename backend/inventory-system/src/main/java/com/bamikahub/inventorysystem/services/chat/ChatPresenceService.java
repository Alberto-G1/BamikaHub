package com.bamikahub.inventorysystem.services.chat;

import com.bamikahub.inventorysystem.dto.chat.PresenceUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatPresenceService {

    private static final long PRESENCE_TIMEOUT_SECONDS = 60;

    private final SimpMessagingTemplate messagingTemplate;

    private final Map<Long, PresenceUpdate> presenceMap = new ConcurrentHashMap<>();

    public void markOnline(Long userId) {
        PresenceUpdate update = PresenceUpdate.builder()
                .userId(userId)
                .online(true)
                .lastSeen(LocalDateTime.now())
                .build();
        presenceMap.put(userId, update);
        broadcast(update);
    }

    public void markOffline(Long userId) {
        PresenceUpdate update = PresenceUpdate.builder()
                .userId(userId)
                .online(false)
                .lastSeen(LocalDateTime.now())
                .build();
        presenceMap.put(userId, update);
        broadcast(update);
    }

    public PresenceUpdate getPresence(Long userId) {
        PresenceUpdate presence = presenceMap.get(userId);
        if (presence == null) {
            return PresenceUpdate.builder().userId(userId).online(false).lastSeen(null).build();
        }
        if (presence.isOnline() && presence.getLastSeen() != null &&
                presence.getLastSeen().isBefore(LocalDateTime.now().minusSeconds(PRESENCE_TIMEOUT_SECONDS))) {
            presence.setOnline(false);
        }
        return presence;
    }

    private void broadcast(PresenceUpdate update) {
        try {
            messagingTemplate.convertAndSend("/topic/presence", update);
        } catch (Exception ex) {
            log.warn("Failed to broadcast presence update userId={} error={}", update.getUserId(), ex.getMessage(), ex);
        }
    }
}
