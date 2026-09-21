package com.travelplatform.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * TravelPlatform Core Service
 * 
 * Deployable B - Handles:
 * - Data (Transaction Spine)
 * - Payment & Expense (Ledger, Refund SM)
 * - Servicing (Cancel, Void, Refund Request)
 * 
 * Database: PostgreSQL 16
 * Event Transport: Transactional Outbox (PostgreSQL)
 * Idempotency Store: PostgreSQL with Redis read-through cache
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.travelplatform.core")
@EnableJpaAuditing
public class CoreServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoreServiceApplication.class, args);
    }
}
