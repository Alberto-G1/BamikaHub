package com.bamikahub.inventorysystem.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableConfigurationProperties(MailProperties.class)
@Slf4j
public class MailConfig {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender javaMailSender(MailProperties mailProperties) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        // Configure from application.properties / environment via MailProperties
        if (mailProperties.getHost() != null) {
            mailSender.setHost(mailProperties.getHost());
        }
        if (mailProperties.getPort() != null) {
            mailSender.setPort(mailProperties.getPort());
        }
        if (mailProperties.getUsername() != null) {
            mailSender.setUsername(mailProperties.getUsername());
        }
        if (mailProperties.getPassword() != null) {
            mailSender.setPassword(mailProperties.getPassword());
        }
        if (mailProperties.getProtocol() != null) {
            mailSender.setProtocol(mailProperties.getProtocol());
        }
        // Copy any additional JavaMail properties
        if (mailProperties.getProperties() != null) {
            mailSender.getJavaMailProperties().putAll(mailProperties.getProperties());
        }
        if (mailProperties.getHost() == null) {
            log.warn("Mail host not configured - JavaMailSender will default to localhost:25 unless overridden.");
        } else {
            log.info("Configuring JavaMailSender host={} port={}", mailProperties.getHost(), mailProperties.getPort());
        }
        return mailSender;
    }
}
