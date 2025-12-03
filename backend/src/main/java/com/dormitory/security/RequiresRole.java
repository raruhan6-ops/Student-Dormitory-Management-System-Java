package com.dormitory.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to declare required roles for controller methods.
 * This can be used in addition to the path-based interceptor for 
 * more granular, method-level role enforcement.
 * 
 * Example usage:
 * <pre>
 * {@code
 * @RequiresRole({"Admin", "DormManager"})
 * @PostMapping("/approve")
 * public ResponseEntity<?> approveApplication(...) { ... }
 * }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresRole {
    /**
     * The roles that are allowed to access this endpoint.
     * User must have at least one of these roles.
     */
    String[] value();
}
