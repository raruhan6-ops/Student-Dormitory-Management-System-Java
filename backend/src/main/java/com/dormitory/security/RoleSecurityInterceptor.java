package com.dormitory.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.lang.reflect.Method;

/**
 * Security interceptor that enforces role-based access control on protected endpoints.
 * 
 * This interceptor:
 * 1. Reads the "auth" cookie from incoming requests
 * 2. Verifies the JWT signature and expiration
 * 3. Checks if the user's role is allowed for the requested endpoint
 * 4. Blocks unauthorized access with 401/403 responses
 * 
 * Role checking is done in two ways:
 * 1. Path-based rules (hardcoded in getRequiredRoles method)
 * 2. @RequiresRole annotation on controller methods
 * 
 * Protected paths:
 * - /api/manager/** → DormManager or Admin only
 * - /api/admin/** → Admin only
 * - /api/applications/** → DormManager or Admin only (for approval operations)
 * - /api/auth/admin/** → Admin only
 */
@Component
public class RoleSecurityInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtTokenService jwtTokenService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Check for @RequiresRole annotation on handler method
        String[] annotationRoles = getAnnotationRoles(handler);
        
        // Determine required roles based on path (fallback)
        String[] requiredRoles = annotationRoles != null ? annotationRoles : getRequiredRoles(path, method);
        
        // If no role restriction, allow through
        if (requiredRoles == null || requiredRoles.length == 0) {
            return true;
        }

        // Extract token from cookie
        String token = extractTokenFromCookies(request);
        
        // Verify token
        JwtTokenService.TokenClaims claims = jwtTokenService.verifyToken(token);
        
        if (!claims.isValid()) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, claims.getError());
            return false;
        }

        // Check role authorization
        if (!claims.hasRole(requiredRoles)) {
            sendError(response, HttpServletResponse.SC_FORBIDDEN, 
                "Access denied. Required role: " + String.join(" or ", requiredRoles) + 
                ", your role: " + claims.getRole());
            return false;
        }

        // Store user info in request attributes for controllers to use
        request.setAttribute("authenticatedUsername", claims.getUsername());
        request.setAttribute("authenticatedRole", claims.getRole());

        return true;
    }

    /**
     * Get required roles from @RequiresRole annotation if present
     */
    private String[] getAnnotationRoles(Object handler) {
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            Method method = handlerMethod.getMethod();
            
            // Check method-level annotation first
            RequiresRole methodAnnotation = method.getAnnotation(RequiresRole.class);
            if (methodAnnotation != null) {
                return methodAnnotation.value();
            }
            
            // Check class-level annotation
            RequiresRole classAnnotation = handlerMethod.getBeanType().getAnnotation(RequiresRole.class);
            if (classAnnotation != null) {
                return classAnnotation.value();
            }
        }
        return null;
    }

    /**
     * Determine required roles for a given path and HTTP method
     * @return Array of allowed roles, or null if no restriction
     */
    private String[] getRequiredRoles(String path, String method) {
        // Admin-only endpoints
        if (path.startsWith("/api/auth/admin/")) {
            return new String[]{"Admin"};
        }
        
        if (path.startsWith("/api/admin/")) {
            return new String[]{"Admin"};
        }

        // Manager endpoints - require DormManager or Admin
        if (path.startsWith("/api/manager/")) {
            return new String[]{"DormManager", "Admin"};
        }

        // Application approval/rejection - manager or admin only
        if (path.startsWith("/api/applications/") && 
            (path.contains("/approve") || path.contains("/reject"))) {
            return new String[]{"DormManager", "Admin"};
        }
        
        // GET /api/applications - manager or admin only (listing all applications)
        if (path.equals("/api/applications") && "GET".equalsIgnoreCase(method)) {
            return new String[]{"DormManager", "Admin"};
        }

        // Student management - full CRUD requires manager/admin
        if (path.startsWith("/api/students")) {
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
                return new String[]{"DormManager", "Admin"};
            }
        }

        // Dormitory management - full CRUD requires manager/admin
        if (path.startsWith("/api/dormitories")) {
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
                return new String[]{"DormManager", "Admin"};
            }
        }

        // Check-in/out management - requires manager/admin
        if (path.startsWith("/api/checkin") || path.startsWith("/api/checkout")) {
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
                return new String[]{"DormManager", "Admin"};
            }
        }

        // Repair request management - status updates require manager/admin
        if (path.startsWith("/api/repairs")) {
            if ("PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
                return new String[]{"DormManager", "Admin"};
            }
        }

        // Audit logs - admin only
        if (path.startsWith("/api/audit")) {
            return new String[]{"Admin"};
        }

        // Batch operations - admin only
        if (path.startsWith("/api/batch")) {
            return new String[]{"Admin"};
        }

        // User management - admin only
        if (path.equals("/api/auth/users") && "GET".equalsIgnoreCase(method)) {
            return new String[]{"Admin"};
        }

        // No restriction for other endpoints
        return null;
    }

    /**
     * Extract the auth token from cookies
     */
    private String extractTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("auth".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /**
     * Send JSON error response
     */
    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format("{\"error\":\"%s\",\"status\":%d}", 
            message.replace("\"", "\\\""), status));
    }
}
