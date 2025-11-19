package com.bamikahub.inventorysystem.models.email;

import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

public class EmailTemplateTest {

    @Test
    public void hasNoArgsConstructor() throws Exception {
        Constructor<EmailTemplate> ctor = EmailTemplate.class.getDeclaredConstructor();
        assertThat(ctor).isNotNull();
    }

    @Test
    public void bodyIsLobAndLongtext() throws Exception {
        Field body = EmailTemplate.class.getDeclaredField("body");
        assertThat(body.getAnnotation(Lob.class)).isNotNull();
        Column col = body.getAnnotation(Column.class);
        assertThat(col).isNotNull();
        assertThat(col.columnDefinition()).isNotEmpty().containsIgnoringCase("LONGTEXT");
    }
}
