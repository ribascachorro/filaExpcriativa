CREATE DATABASE IF NOT EXISTS `exp-criativa-fila`;

USE `exp-criativa-fila`;

CREATE TABLE `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `birth_date` DATE NOT NULL,
  `insurance_provider` VARCHAR(100) NULL,
  `insurance_number` VARCHAR(50) NULL,
  `cpf` VARCHAR(11) NOT NULL UNIQUE,
  `user_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Chave estrangeira opcional para vincular a um usuário
  INDEX (`user_id`),
  CONSTRAINT `fk_patients_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `queue_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `is_priority` TINYINT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `served_at` DATETIME NULL,
  `cancelled_at` DATETIME NULL,
  `notified_at` DATETIME NULL,
  INDEX `idx_queue_priority_time` (`is_priority`, `created_at`),
  CONSTRAINT `fk_queue_patient`
    FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `login` VARCHAR(100) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','user') NOT NULL DEFAULT 'user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
