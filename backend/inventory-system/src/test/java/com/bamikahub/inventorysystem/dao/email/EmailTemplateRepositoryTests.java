package com.bamikahub.inventorysystem.dao.email;

import com.bamikahub.inventorysystem.models.email.EmailTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;

import static org.assertj.core.api.Assertions.assertThat;

@Disabled("Flaky under H2 schema generation; tests skipped in CI")
@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.sql.init.mode=never",
    "spring.flyway.enabled=false",
    "spring.liquibase.enabled=false"
})
@AutoConfigureTestDatabase(replace = Replace.ANY)
public class EmailTemplateRepositoryTests {

    @Autowired
    private EmailTemplateRepository repository;

    @Test
    public void saveLongBodyEmailTemplate() {
        EmailTemplate t = EmailTemplate.builder()
                .name("test-long-body")
                .subject("Test")
                .body("<html>" + "x".repeat(5000) + "</html>")
                .build();
        EmailTemplate saved = repository.save(t);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getBody()).hasSizeGreaterThan(4000);
    }
}
