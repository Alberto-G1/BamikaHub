package com.bamikahub.inventorysystem.util;

import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.auth.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class ValidationUtil {

    private ValidationUtil() {}

    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z' -]{1,49}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^(?=.{4,30}$)(?![0-9]+$)[A-Za-z0-9_]+$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    // Uganda MSISDN: +256/256/0 then 7[0-8] and 7 more digits (total 12, 11, or 10 incl. prefix)
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(?:\\+256|256|0)(7[0-8][0-9]{7})$");
    private static final Pattern PASSWORD_COMPLEX_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$");

    // Domain-specific patterns
    private static final Pattern SUPPLIER_NAME_PATTERN = Pattern.compile("^[A-Za-z0-9 .&'-]{2,100}$");
    private static final Pattern ADDRESS_PATTERN = Pattern.compile("^[A-Za-z0-9 ,./-]{5,150}$");
    private static final Pattern CONTACT_PERSON_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z' -]{1,79}$");
    private static final Pattern CATEGORY_NAME_PATTERN = Pattern.compile("^[A-Za-z ]{2,50}$");
    private static final Pattern DESCRIPTION_PATTERN = Pattern.compile("^[A-Za-z0-9 ,.()'\"/-]{5,500}$");
    private static final Pattern PROJECT_NAME_PATTERN = Pattern.compile("^[A-Za-z0-9 _-]{2,120}$");
    private static final Pattern CLIENT_NAME_PATTERN = Pattern.compile("^[A-Za-z .'-]{2,100}$");
    private static final Pattern PROJECT_DESC_PATTERN = Pattern.compile("^[A-Za-z0-9 ,.()'\"/-]{10,1000}$");
    private static final Pattern JUSTIFICATION_PATTERN = Pattern.compile("^[A-Za-z0-9 ,.()'\"/-]{5,500}$");
    private static final Pattern ITEM_NAME_PATTERN = Pattern.compile("^[A-Za-z0-9 /-]{2,100}$");
    private static final Pattern UNIT_PATTERN = Pattern.compile("^[A-Za-z]{2,20}$");
    private static final Pattern SUBJECT_PATTERN = Pattern.compile("^[A-Za-z0-9 .-]{2,150}$");
    private static final Pattern DEPARTMENT_PATTERN = Pattern.compile("^[A-Za-z ]{2,80}$");

    private static final Set<String> COMMON_PASSWORDS = new HashSet<>(Arrays.asList(
            "password","123456","123456789","qwerty","111111","123123","abc123","Password1!","letmein","admin","welcome"
    ));

    public static String sanitize(String input) {
        if (input == null) return null;
        // Trim, collapse inner whitespace, and strip angle brackets to avoid simple HTML injection
        String trimmed = input.trim();
        String collapsed = trimmed.replaceAll("\\s+", " ");
        String noAngles = collapsed.replace("<", "").replace(">", "");
        // Basic script keyword filtering (defense-in-depth; persistent XSS should be handled at render too)
        String lowered = noAngles.toLowerCase(Locale.ROOT);
        if (lowered.contains("script:")) {
            throw badRequest("Invalid content detected.");
        }
        return noAngles;
    }

    public static void validateRegistration(RegisterRequest req, UserRepository userRepository) {
        if (req == null) {
            throw badRequest("Invalid request payload.");
        }

        // Sanitize values (do not alter original object semantics beyond trimming/spacing)
        String firstName = sanitize(req.getFirstName());
        String lastName = sanitize(req.getLastName());
        String username = sanitize(req.getUsername());
        String email = sanitize(req.getEmail());
        String password = req.getPassword(); // do not sanitize content, but evaluate as-is
        String confirmPassword = req.getConfirmPassword();

        // First Name
        if (isBlank(firstName)) {
            throw badRequest("First name is required.");
        }
        if (!NAME_PATTERN.matcher(firstName).matches()) {
            throw badRequest("First name must be 2–50 characters and may include letters, spaces, hyphens, or apostrophes only.");
        }

        // Last Name
        if (isBlank(lastName)) {
            throw badRequest("Last name is required.");
        }
        if (!NAME_PATTERN.matcher(lastName).matches()) {
            throw badRequest("Last name must be 2–50 characters and may include letters, spaces, hyphens, or apostrophes only.");
        }

        // Username
        if (isBlank(username)) {
            throw badRequest("Username is required.");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw badRequest("Username must be 4–30 characters, contain letters/numbers/underscores only, and cannot be only digits.");
        }
        userRepository.findByUsername(username).ifPresent(u -> { throw badRequest("Username is already taken."); });

        // Email
        if (isBlank(email)) {
            throw badRequest("Email is required.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw badRequest("Please provide a valid email address.");
        }
        userRepository.findByEmail(email).ifPresent(u -> { throw badRequest("Email is already in use."); });

        // Password
        if (isBlank(password)) {
            throw badRequest("Password is required.");
        }
        if (!PASSWORD_COMPLEX_PATTERN.matcher(password).matches()) {
            throw badRequest("Password must be 8–30 chars and include uppercase, lowercase, digit, and special character.");
        }
        if (!password.equals(password.trim())) {
            throw badRequest("Password cannot start or end with spaces.");
        }
        // No common passwords
        if (COMMON_PASSWORDS.contains(password.toLowerCase(Locale.ROOT))) {
            throw badRequest("Password is too common. Choose a stronger password.");
        }
        // Not repeated single character sequences (e.g., 'aaaaaaaa', '11111111')
        if (password.chars().distinct().count() <= 2) {
            throw badRequest("Password is too repetitive. Use a more complex combination.");
        }
        // Not containing personal info
        String pLower = password.toLowerCase(Locale.ROOT);
        if (!isBlank(firstName) && pLower.contains(firstName.toLowerCase(Locale.ROOT))) {
            throw badRequest("Password must not contain your first name.");
        }
        if (!isBlank(lastName) && pLower.contains(lastName.toLowerCase(Locale.ROOT))) {
            throw badRequest("Password must not contain your last name.");
        }
        if (!isBlank(username) && pLower.contains(username.toLowerCase(Locale.ROOT))) {
            throw badRequest("Password must not contain your username.");
        }

        // Confirm password
        if (isBlank(confirmPassword)) {
            throw badRequest("Please confirm your password.");
        }
        if (!password.equals(confirmPassword)) {
            throw badRequest("Passwords do not match.");
        }

        // If all validations pass, write sanitized values back (so service persists trimmed values)
        req.setFirstName(firstName);
        req.setLastName(lastName);
        req.setUsername(username);
        req.setEmail(email);
    }

    // --- Field-level validators for reusability ---
    public static String validateFirstName(String firstName) {
        String value = sanitize(firstName);
        if (isBlank(value)) throw badRequest("First name is required.");
        if (!NAME_PATTERN.matcher(value).matches())
            throw badRequest("First name must be 2–50 characters and may include letters, spaces, hyphens, or apostrophes only.");
        return value;
    }

    public static String validateLastName(String lastName) {
        String value = sanitize(lastName);
        if (isBlank(value)) throw badRequest("Last name is required.");
        if (!NAME_PATTERN.matcher(value).matches())
            throw badRequest("Last name must be 2–50 characters and may include letters, spaces, hyphens, or apostrophes only.");
        return value;
    }

    public static String validateUsername(String username, UserRepository userRepository) {
        String value = sanitize(username);
        if (isBlank(value)) throw badRequest("Username is required.");
        if (!USERNAME_PATTERN.matcher(value).matches())
            throw badRequest("Username must be 4–30 characters, contain letters/numbers/underscores only, and cannot be only digits.");
        userRepository.findByUsername(value).ifPresent(u -> { throw badRequest("Username is already taken."); });
        return value;
    }

    public static String validateEmail(String email, UserRepository userRepository) {
        String value = sanitize(email);
        if (isBlank(value)) throw badRequest("Email is required.");
        if (!EMAIL_PATTERN.matcher(value).matches()) throw badRequest("Please provide a valid email address.");
        userRepository.findByEmail(value).ifPresent(u -> { throw badRequest("Email is already in use."); });
        return value;
    }

    public static String validateUsernameForUpdate(String username, Long currentUserId, UserRepository userRepository) {
        String value = sanitize(username);
        if (isBlank(value)) throw badRequest("Username is required.");
        if (!USERNAME_PATTERN.matcher(value).matches())
            throw badRequest("Username must be 4–30 characters, contain letters/numbers/underscores only, and cannot be only digits.");
        userRepository.findByUsername(value).ifPresent(u -> {
            if (!u.getId().equals(currentUserId)) {
                throw badRequest("Username is already taken.");
            }
        });
        return value;
    }

    public static String validateEmailForUpdate(String email, Long currentUserId, UserRepository userRepository) {
        String value = sanitize(email);
        if (isBlank(value)) throw badRequest("Email is required.");
        if (!EMAIL_PATTERN.matcher(value).matches()) throw badRequest("Please provide a valid email address.");
        userRepository.findByEmail(value).ifPresent(u -> {
            if (!u.getId().equals(currentUserId)) {
                throw badRequest("Email is already in use.");
            }
        });
        return value;
    }

    public static String validateOptionalEmail(String email) {
        String value = sanitize(email);
        if (isBlank(value)) return null;
        if (!EMAIL_PATTERN.matcher(value).matches()) throw badRequest("Please provide a valid email address.");
        return value;
    }

    public static String validateOptionalPhone(String phone) {
        String value = sanitize(phone);
        if (isBlank(value)) return null;
        // normalize common formatting (spaces, dashes, parentheses)
        value = value.replace(" ", "").replace("-", "").replace("(", "").replace(")", "");
        if (!PHONE_PATTERN.matcher(value).matches()) throw badRequest("Please provide a valid phone number.");
        return value;
    }

    // --- Domain validations requested ---

    // User: Date of Birth (optional helper) – must be in past and 18+ if provided
    public static LocalDate validateOptionalDob(LocalDate dob) {
        if (dob == null) return null;
        LocalDate today = LocalDate.now();
        if (!dob.isBefore(today)) throw badRequest("Date of birth must be in the past.");
        LocalDate eighteenYearsAgo = today.minusYears(18);
        if (dob.isAfter(eighteenYearsAgo)) throw badRequest("You must be at least 18 years old.");
        return dob;
    }

    public static String validateSupplierName(String name) {
        String value = sanitize(name);
        if (isBlank(value)) throw badRequest("Supplier name is required.");
        if (!SUPPLIER_NAME_PATTERN.matcher(value).matches()) throw badRequest("Supplier name must be 2–100 chars and may include letters, digits, spaces, ., -, '& and &.");
        return value;
    }

    public static String validateAddress(String address) {
        String value = sanitize(address);
        if (isBlank(value)) throw badRequest("Address is required.");
        if (!ADDRESS_PATTERN.matcher(value).matches()) throw badRequest("Address must be 5–150 chars and may include letters, digits, spaces, commas, periods, slashes, and hyphens.");
        return value;
    }

    public static String validateContactPerson(String contact) {
        String value = sanitize(contact);
        if (isBlank(value)) throw badRequest("Contact person is required.");
        if (!CONTACT_PERSON_PATTERN.matcher(value).matches()) throw badRequest("Contact person must be 2–80 chars using letters, spaces, hyphens, or apostrophes.");
        return value;
    }

    public static String validateCategoryName(String name) {
        String value = sanitize(name);
        if (isBlank(value)) throw badRequest("Category name is required.");
        if (!CATEGORY_NAME_PATTERN.matcher(value).matches()) throw badRequest("Category name must be 2–50 letters/spaces only.");
        return value;
    }

    public static String validateDescriptionOptional(String description) {
        String value = sanitize(description);
        if (isBlank(value)) return null;
        if (!DESCRIPTION_PATTERN.matcher(value).matches()) throw badRequest("Description must be 5–500 chars with standard punctuation.");
        return value;
    }

    public static String validateProjectName(String name) {
        String value = sanitize(name);
        if (isBlank(value)) throw badRequest("Project name is required.");
        if (!PROJECT_NAME_PATTERN.matcher(value).matches()) throw badRequest("Project name must be 2–120 chars; letters, digits, spaces, hyphens, underscores.");
        return value;
    }

    public static String validateClientName(String name) {
        String value = sanitize(name);
        if (isBlank(value)) throw badRequest("Client name is required.");
        if (!CLIENT_NAME_PATTERN.matcher(value).matches()) throw badRequest("Client name must be 2–100 chars; letters, spaces, periods, hyphens, apostrophes.");
        return value;
    }

    public static String validateProjectDescriptionOptional(String description) {
        String value = sanitize(description);
        if (isBlank(value)) return null;
        if (!PROJECT_DESC_PATTERN.matcher(value).matches()) throw badRequest("Project description must be 10–1000 chars.");
        return value;
    }

    public static void validateProjectDates(LocalDate start, LocalDate end) {
        if (start != null) {
            LocalDate today = LocalDate.now();
            if (start.isAfter(today)) throw badRequest("Project start date cannot be in the future.");
        }
        if (start != null && end != null) {
            if (end.isBefore(start)) throw badRequest("Project end date cannot be before the start date.");
        }
    }

    public static LocalDate validateRequisitionDate(LocalDate date) {
        if (date == null) throw badRequest("Requisition date is required.");
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) throw badRequest("Requisition date cannot be in the future.");
        return date;
    }

    public static String validateJustification(String justification) {
        String value = sanitize(justification);
        if (isBlank(value)) throw badRequest("Justification is required.");
        if (!JUSTIFICATION_PATTERN.matcher(value).matches()) throw badRequest("Justification must be 5–500 chars with standard punctuation.");
        return value;
    }

    public static String validateItemName(String name) {
        String value = sanitize(name);
        if (isBlank(value)) throw badRequest("Item name is required.");
        if (!ITEM_NAME_PATTERN.matcher(value).matches()) throw badRequest("Item name must be 2–100 chars; letters, digits, spaces, hyphens, slashes.");
        return value;
    }

    public static String validateUnit(String unit) {
        String value = sanitize(unit);
        if (isBlank(value)) throw badRequest("Unit is required.");
        if (!UNIT_PATTERN.matcher(value).matches()) throw badRequest("Unit must be 2–20 alphabetic characters.");
        return value;
    }

    public static String validateSubject(String subject) {
        String value = sanitize(subject);
        if (isBlank(value)) throw badRequest("Subject is required.");
        if (!SUBJECT_PATTERN.matcher(value).matches()) throw badRequest("Subject must be 2–150 chars; letters, digits, spaces, hyphens, periods.");
        return value;
    }

    public static String validateDepartment(String dept) {
        String value = sanitize(dept);
        if (isBlank(value)) throw badRequest("Department is required.");
        if (!DEPARTMENT_PATTERN.matcher(value).matches()) throw badRequest("Department must be 2–80 letters/spaces only.");
        return value;
    }

    public static String validatePassword(String password, String firstName, String lastName, String username) {
        if (isBlank(password)) throw badRequest("Password is required.");
        if (!PASSWORD_COMPLEX_PATTERN.matcher(password).matches())
            throw badRequest("Password must be 8–30 chars and include uppercase, lowercase, digit, and special character.");
        if (!password.equals(password.trim())) throw badRequest("Password cannot start or end with spaces.");
        if (COMMON_PASSWORDS.contains(password.toLowerCase(Locale.ROOT)))
            throw badRequest("Password is too common. Choose a stronger password.");
        if (password.chars().distinct().count() <= 2)
            throw badRequest("Password is too repetitive. Use a more complex combination.");
        String pLower = password.toLowerCase(Locale.ROOT);
        if (!isBlank(firstName) && pLower.contains(firstName.toLowerCase(Locale.ROOT)))
            throw badRequest("Password must not contain your first name.");
        if (!isBlank(lastName) && pLower.contains(lastName.toLowerCase(Locale.ROOT)))
            throw badRequest("Password must not contain your last name.");
        if (!isBlank(username) && pLower.contains(username.toLowerCase(Locale.ROOT)))
            throw badRequest("Password must not contain your username.");
        return password;
    }

    public static void validateConfirmPassword(String password, String confirmPassword) {
        if (isBlank(confirmPassword)) throw badRequest("Please confirm your password.");
        if (!String.valueOf(password).equals(String.valueOf(confirmPassword)))
            throw badRequest("Passwords do not match.");
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
