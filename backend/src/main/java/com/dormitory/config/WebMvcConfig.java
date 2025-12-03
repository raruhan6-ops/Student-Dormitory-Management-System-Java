package com.dormitory.config;

import com.dormitory.security.RoleSecurityInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration for the dormitory application.
 * Registers security interceptors and configures CORS.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private RoleSecurityInterceptor roleSecurityInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register the role security interceptor for all API endpoints
        registry.addInterceptor(roleSecurityInterceptor)
                .addPathPatterns("/api/**")
                // Exclude public endpoints that don't need authentication
                .excludePathPatterns(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/me",
                    "/api/captcha/**",
                    "/api/health"
                );
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
