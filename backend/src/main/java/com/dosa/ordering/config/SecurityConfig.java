package com.dosa.ordering.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private SessionAuthFilter sessionAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .addFilterBefore(sessionAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth

                // ✅ PUBLIC APIs
                .requestMatchers("/").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/menu/**").permitAll()
                .requestMatchers("/api/orders/client").permitAll()
                .requestMatchers("/api/orders/next-number").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // 🔒 PROTECTED
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
//package com.dosa.ordering.config;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.http.HttpMethod;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.cors.CorsConfigurationSource;
//import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//
//import java.util.List;
//
//@Configuration
//@EnableWebSecurity
//public class SecurityConfig {
//
//    @Autowired
//    private SessionAuthFilter sessionAuthFilter;
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//            .csrf(AbstractHttpConfigurer::disable)
//            .addFilterBefore(sessionAuthFilter, UsernamePasswordAuthenticationFilter.class)
//            .authorizeHttpRequests(auth -> auth
//                // Public endpoints - no session needed
//                .requestMatchers(HttpMethod.POST,    "/api/auth/login").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/auth/logout").permitAll()
//                .requestMatchers(HttpMethod.GET,     "/api/auth/check").permitAll()
//                .requestMatchers("/api/menu/**").permitAll()
//                //.requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
//                //.requestMatchers(HttpMethod.GET,     "/api/menu/public/**").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/orders/client").permitAll()
//                .requestMatchers(HttpMethod.GET,     "/api/orders/next-number").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/orders/set-number").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/auth/otp/generate").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/auth/otp/verify").permitAll()
//                .requestMatchers(HttpMethod.POST,    "/api/auth/change-password").permitAll()
////                .requestMatchers(HttpMethod.PUT,     "/api/menu/items/*/toggle").permitAll()
////                .requestMatchers(HttpMethod.DELETE,  "/api/menu/items/*").permitAll()
////                .requestMatchers(HttpMethod.POST,    "/api/menu/items").permitAll()
////                .requestMatchers(HttpMethod.PUT,     "/api/menu/items/*").permitAll()
////                .requestMatchers(HttpMethod.GET,     "/api/menu/items").permitAll()
////                .requestMatchers(HttpMethod.GET,     "/api/menu/items/*/in-use").permitAll()
//                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
//                .requestMatchers("/uploads/**").permitAll()
//                .requestMatchers("/").permitAll()
//                // All other endpoints require session auth
//                .anyRequest().authenticated()
//            );
//
//        return http.build();
//    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration config = new CorsConfiguration();
//        config.setAllowedOriginPatterns(List.of("*"));
//        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//        config.setAllowedHeaders(List.of("*"));
//        config.setAllowCredentials(true);
//        config.setMaxAge(3600L);
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", config);
//        return source;
//    }
//}
