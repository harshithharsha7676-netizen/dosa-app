# Use Java 17
FROM eclipse-temurin:17-jdk-jammy 

# Copy jar file
COPY target/*.jar app.jar

# Run app
ENTRYPOINT ["java", "-jar", "/app.jar"]