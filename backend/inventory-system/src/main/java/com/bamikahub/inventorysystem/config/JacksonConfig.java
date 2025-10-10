package com.bamikahub.inventorysystem.config;

// v-- UPDATE THIS IMPORT --v
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        // v-- UPDATE THE CLASS NAME HERE --v
        Hibernate6Module module = new Hibernate6Module();

        // This configuration remains the same
        module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, true);

        return module;
    }
}