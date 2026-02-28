```markdown
# AGENTS.md - AI Coding Agent Guidelines

These guidelines outline the requirements for all AI coding agent development within this repository. Adherence to these principles ensures code maintainability, robustness, and efficiency.

## 1. DRY (Don't Repeat Yourself)

- All code snippets, algorithms, and data structures should be encapsulated within reusable functions and classes.
- Avoid duplicating logic or definitions across multiple files.
- Refactor code to eliminate redundant elements.
- Prioritize creating single, well-defined units of functionality.

## 2. KISS (Keep It Simple, Stupid)

- Code should be concise and easy to understand.
- Minimize complexity wherever possible.
- Use the simplest solution that meets the requirements.
- Avoid over-engineering.

## 3. SOLID Principles

- **Single Responsibility Principle:** Each class, function, or module should have a single, well-defined purpose.
- **Open/Closed Principle:** Classes and modules should be open for extension but closed for modification.
- **Liskov Substitution Principle:** Subclasses should be substitutable for their base classes without affecting the correctness of the program.
- **Interface Segregation Principle:** Clients should not be forced to provide implementations for methods they do not use.
- **Dependency Inversion Principle:** Dependencies should be replaced with abstractions.

## 4. YAGNI (You Aren't Gonna Need It)

- Only implement functionality that is currently required.
- Avoid adding features or modifications without a clear and well-defined justification.
- Focus on solving the immediate problem at hand.

## 5. Testing & Mocking

- All unit tests MUST be written and executed.
- Mocking will ONLY be used for testing.  No reliance on realistic data or dependencies.
- Testing should be comprehensive, covering all possible scenarios and edge cases.
- Test coverage should be at least 80%.
- Test cases should be documented clearly with expected results.

## 6. File Size Limit: 180 Lines

- Each file must contain a maximum of 180 lines of code.
-  Code must be logically organized and avoid excessive blank lines.
-  File structure should promote readability and maintainability.

## 7. Code Quality & Style

- Follow PEP 8 style guidelines for Python code.
- Use descriptive variable and function names.
- Employ appropriate commenting to explain complex logic.
- Ensure code is properly formatted and indented.

## 8. Data Handling & Abstraction

- Data structures should be designed for efficient retrieval and manipulation.
- Use appropriate data formats (e.g., JSON, CSV) for data exchange.
- Abstract data representations to isolate implementation details.

## 9. Dependency Management

- Dependencies should be clearly specified and managed.
- Use version control for dependencies to ensure compatibility.

## 10. Error Handling

- Implement robust error handling with appropriate logging and reporting.
- Avoid silent errors.
- Provide informative error messages to facilitate debugging.

## 11. Algorithm & Data Structures

- Utilize appropriate algorithms and data structures for the task at hand.
- Consider time and space complexity when choosing algorithms.

## 12. Documentation

- Provide clear and concise documentation for all functions, classes, and modules.
- Use docstrings to describe functionality and parameters.
- Ensure documentation is up-to-date.

## 13. Testing Framework

- Use a standard testing framework (e.g., `pytest`, `unittest`) for testing.
- Implement proper test suites for all critical functionalities.

## 14. Code Review

-  All code should undergo code reviews before merging.
-  Ensure code is reviewed for correctness, readability, and adherence to best practices.

## 15.  Maintainability & Future-Proofing

-  Design code with long-term maintainability in mind.
-  Consider potential future modifications and expansions.
-  Prioritize code that is easy to understand and modify.

## 16.  Resource Management (if applicable):**
    -  If this repository is used for AI development, ensure adequate resource management practices are employed to minimize resource consumption.

---
```